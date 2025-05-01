
import { User } from '@/types/auth';
import { CalendarEvent } from '@/types/calendar';
import { supabase } from '@/lib/supabase';

// Keys for local storage
const STORAGE_KEYS = {
  EVENTS: 'temposcribe_events',
  LAST_SYNC: 'temposcribe_last_sync',
};

// Calendar events storage - local fallback
export const saveEventsLocally = (events: CalendarEvent[]): void => {
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
};

export const getEventsLocally = (): CalendarEvent[] => {
  const eventsStr = localStorage.getItem(STORAGE_KEYS.EVENTS);
  if (!eventsStr) return [];
  
  try {
    const eventsData = JSON.parse(eventsStr);
    
    // Convert string dates back to Date objects
    return eventsData.map((event: any) => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
      deadline: event.deadline ? new Date(event.deadline) : undefined,
      recurrence: {
        ...event.recurrence,
        end: {
          ...event.recurrence.end,
          until: event.recurrence.end.until ? new Date(event.recurrence.end.until) : undefined
        }
      }
    }));
  } catch (error) {
    console.error('Failed to parse events data:', error);
    return [];
  }
};

// Supabase sync timestamp
export const saveLastSyncTimestamp = (): void => {
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
};

export const getLastSyncTimestamp = (): Date | null => {
  const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  return timestamp ? new Date(timestamp) : null;
};

// Convert CalendarEvent to Supabase format
export const eventToSupabaseFormat = (event: CalendarEvent, userId: string) => {
  return {
    id: event.id,
    user_id: userId,
    title: event.title,
    description: event.description || null,
    type: event.type,
    start_time: event.start.toISOString(),
    end_time: event.end.toISOString(),
    all_day: event.allDay,
    color: event.color,
    location: event.location || null,
    status: event.status,
    deadline: event.deadline ? event.deadline.toISOString() : null,
    completed: event.type === 'task' ? event.completed : null,
    recurrence: event.recurrence,
    updated_at: new Date().toISOString()
  };
};

// Convert Supabase format to CalendarEvent
export const supabaseToEventFormat = (dbEvent: any, participants: any[] = []): CalendarEvent => {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description || '',
    type: dbEvent.type as any,
    start: new Date(dbEvent.start_time),
    end: new Date(dbEvent.end_time),
    allDay: dbEvent.all_day,
    color: dbEvent.color,
    location: dbEvent.location || '',
    status: dbEvent.status as any,
    deadline: dbEvent.deadline ? new Date(dbEvent.deadline) : undefined,
    completed: dbEvent.type === 'task' ? !!dbEvent.completed : undefined,
    recurrence: {
      frequency: dbEvent.recurrence?.frequency || 'none',
      interval: dbEvent.recurrence?.interval || 1,
      daysOfWeek: dbEvent.recurrence?.daysOfWeek || [],
      end: {
        type: dbEvent.recurrence?.end?.type || 'never',
        count: dbEvent.recurrence?.end?.count,
        until: dbEvent.recurrence?.end?.until 
          ? new Date(dbEvent.recurrence.end.until) 
          : undefined
      }
    },
    contactPersons: participants.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email || undefined
    }))
  };
};

// Sync events with Supabase
export const syncEventsWithSupabase = async (
  userId: string,
  localEvents: CalendarEvent[]
): Promise<{ success: boolean; events: CalendarEvent[]; error?: string }> => {
  try {
    // Step 1: Get latest events from Supabase
    const { data: dbEvents, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId);
    
    if (fetchError) throw fetchError;
    
    // Step 2: Get all participants for these events
    const eventIds = dbEvents?.map(e => e.id) || [];
    const { data: allParticipants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .in('event_id', eventIds);
    
    if (participantsError) throw participantsError;
    
    // Create a map of event ID to participants
    const participantsByEvent = (allParticipants || []).reduce((acc: Record<string, any[]>, p: any) => {
      if (!acc[p.event_id]) acc[p.event_id] = [];
      acc[p.event_id].push(p);
      return acc;
    }, {});
    
    // Step 3: Convert Supabase events to CalendarEvents
    const remoteEvents = (dbEvents || []).map(event => 
      supabaseToEventFormat(event, participantsByEvent[event.id] || [])
    );
    
    // Step 4: Find local events that need to be created or updated in Supabase
    const lastSync = getLastSyncTimestamp();
    const localUpdates = localEvents.filter(event => 
      !remoteEvents.find(re => re.id === event.id) ||
      (lastSync && new Date(event.id) > lastSync)
    );
    
    if (localUpdates.length > 0) {
      // Insert/update events
      for (const event of localUpdates) {
        // Convert to Supabase format
        const supabaseEvent = eventToSupabaseFormat(event, userId);
        
        // Upsert the event
        const { error: upsertError } = await supabase
          .from('events')
          .upsert(supabaseEvent);
        
        if (upsertError) throw upsertError;
        
        // Handle participants
        if (event.contactPersons && event.contactPersons.length > 0) {
          // Delete existing participants first
          await supabase
            .from('participants')
            .delete()
            .eq('event_id', event.id);
          
          // Insert new participants
          const participants = event.contactPersons.map(p => ({
            id: p.id,
            event_id: event.id,
            name: p.name,
            email: p.email || null
          }));
          
          const { error: participantsUpsertError } = await supabase
            .from('participants')
            .upsert(participants);
          
          if (participantsUpsertError) throw participantsUpsertError;
        }
      }
    }
    
    // Save sync timestamp
    saveLastSyncTimestamp();
    
    // Return merged events - prefer remote events for consistency
    const mergedEvents = [...remoteEvents];
    
    // Add any local events that don't exist in remote
    localEvents.forEach(localEvent => {
      if (!mergedEvents.some(e => e.id === localEvent.id)) {
        mergedEvents.push(localEvent);
      }
    });
    
    return { success: true, events: mergedEvents };
  } catch (error) {
    console.error('Sync error:', error);
    return { 
      success: false, 
      events: localEvents, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};

// Import/Export functionality
export const exportCalendarData = (events: CalendarEvent[], user: User | null): string => {
  const exportData = {
    events,
    user: user ? {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      preferences: user.preferences
    } : null,
    exportDate: new Date(),
    version: '1.0'
  };
  
  return JSON.stringify(exportData, null, 2);
};

export const importCalendarData = (jsonData: string): { success: boolean; message: string; events?: CalendarEvent[] } => {
  try {
    const importData = JSON.parse(jsonData);
    
    // Validate import data structure
    if (!importData.events || !Array.isArray(importData.events)) {
      return { success: false, message: 'Invalid data format: events array missing' };
    }
    
    // Convert string dates back to Date objects
    const events = importData.events.map((event: any) => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
      deadline: event.deadline ? new Date(event.deadline) : undefined,
      recurrence: {
        ...event.recurrence,
        end: {
          ...event.recurrence.end,
          until: event.recurrence.end.until ? new Date(event.recurrence.end.until) : undefined
        }
      }
    }));
    
    return { success: true, message: 'Data imported successfully', events };
  } catch (error) {
    return { success: false, message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};
