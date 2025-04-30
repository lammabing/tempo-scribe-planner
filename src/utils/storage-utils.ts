
import { User } from '@/types/auth';
import { CalendarEvent } from '@/types/calendar';

// Keys for local storage
const STORAGE_KEYS = {
  AUTH_TOKEN: 'temposcribe_auth_token',
  USER: 'temposcribe_user',
  EVENTS: 'temposcribe_events',
  LAST_SYNC: 'temposcribe_last_sync',
};

// Authentication storage
export const saveAuthToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const saveUser = (user: User): void => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userStr) return null;
  
  try {
    const userData = JSON.parse(userStr);
    // Convert string dates back to Date objects
    return {
      ...userData,
      createdAt: new Date(userData.createdAt),
      lastLogin: new Date(userData.lastLogin),
    };
  } catch (error) {
    console.error('Failed to parse user data:', error);
    return null;
  }
};

export const removeUser = (): void => {
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// Calendar events storage
export const saveEvents = (events: CalendarEvent[]): void => {
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
};

export const getEvents = (): CalendarEvent[] => {
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

// Sync timestamp
export const saveLastSyncTimestamp = (): void => {
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
};

export const getLastSyncTimestamp = (): Date | null => {
  const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  return timestamp ? new Date(timestamp) : null;
};

// Import/Export functionality
export const exportCalendarData = (): string => {
  const events = getEvents();
  const user = getUser();
  
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
