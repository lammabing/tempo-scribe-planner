
import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addHours, startOfMonth, isAfter, subWeeks } from 'date-fns';
import { CalendarEvent, CalendarView, EventType, RecurrenceFrequency, CompletionStatus } from '@/types/calendar';
import { getEventsForDay } from '@/utils/date-utils';
import { useAuth } from './AuthContext';
import { saveEventsLocally as saveEvents, getEventsLocally as getEvents, saveLastSyncTimestamp, getLastSyncTimestamp } from '@/utils/storage-utils';
import { useToast } from '@/components/ui/use-toast';

type CalendarContextType = {
  events: CalendarEvent[];
  selectedDate: Date;
  currentView: CalendarView;
  selectedEvent: CalendarEvent | null;
  isLoading: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  setSelectedDate: (date: Date) => void;
  setCurrentView: (view: CalendarView) => void;
  getEventsForDate: (date: Date) => CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
  selectEvent: (event: CalendarEvent | null) => void;
  syncEvents: () => Promise<void>;
  importEvents: (data: string) => Promise<boolean>;
  exportEvents: () => string;
};

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
};

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // Load events from localStorage on mount or when auth state changes
  useEffect(() => {
    setIsLoading(true);
    
    try {
      const storedEvents = getEvents();
      setEvents(storedEvents.length > 0 ? storedEvents : generateSampleEvents());
      
      const lastSyncTime = getLastSyncTimestamp();
      setLastSynced(lastSyncTime);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents(generateSampleEvents());
      setIsLoading(false);
      
      toast({
        title: "Error loading events",
        description: "There was a problem loading your events. Sample events have been loaded instead.",
        variant: "destructive",
      });
    }
  }, [isAuthenticated]);

  // Save events to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveEvents(events);
    }
  }, [events, isLoading]);

  const generateSampleEvents = (): CalendarEvent[] => {
    const now = new Date();
    
    return [
      {
        id: uuidv4(),
        title: 'Team Meeting',
        description: 'Weekly team sync',
        type: 'event',
        start: addDays(now, 1),
        end: addHours(addDays(now, 1), 1),
        allDay: false,
        color: '#8B5CF6',
        location: 'Conference Room A',
        status: 'pending',
        contactPersons: [
          {
            id: uuidv4(),
            name: 'John Smith',
            email: 'john@example.com'
          }
        ],
        recurrence: {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [1], // Monday
          end: {
            type: 'never'
          }
        }
      },
      {
        id: uuidv4(),
        title: 'Doctor Appointment',
        description: 'Annual checkup',
        type: 'appointment',
        start: addDays(now, 3),
        end: addHours(addDays(now, 3), 2),
        allDay: false,
        color: '#F97316',
        location: 'Medical Center',
        status: 'pending',
        contactPersons: [
          {
            id: uuidv4(),
            name: 'Dr. Johnson',
            phone: '555-123-4567'
          }
        ],
        recurrence: {
          frequency: 'none',
          interval: 1,
          end: {
            type: 'never'
          }
        }
      },
      {
        id: uuidv4(),
        title: 'Project Deadline',
        description: 'Submit project proposal',
        type: 'task',
        start: addDays(now, 7),
        end: addDays(now, 7),
        allDay: true,
        color: '#10B981',
        deadline: addDays(now, 7),
        status: 'pending',
        contactPersons: [
          {
            id: uuidv4(),
            name: 'Sarah Lee',
            email: 'sarah@example.com',
            phone: '555-987-6543'
          }
        ],
        recurrence: {
          frequency: 'none',
          interval: 1,
          end: {
            type: 'never'
          }
        },
        completed: false
      }
    ];
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return getEventsForDay(events, date);
  };

  const addEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent = { ...event, id: uuidv4() };
    setEvents([...events, newEvent]);
    
    toast({
      title: "Event added",
      description: `"${newEvent.title}" has been added to your calendar.`,
    });
  };

  const updateEvent = (updatedEvent: CalendarEvent) => {
    setEvents(events.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ));
    
    // If the selected event was updated, update the selected event as well
    if (selectedEvent && selectedEvent.id === updatedEvent.id) {
      setSelectedEvent(updatedEvent);
    }
    
    toast({
      title: "Event updated",
      description: `"${updatedEvent.title}" has been updated.`,
    });
  };

  const deleteEvent = (id: string) => {
    const eventToDelete = events.find(event => event.id === id);
    setEvents(events.filter(event => event.id !== id));
    
    // If the selected event was deleted, clear the selection
    if (selectedEvent && selectedEvent.id === id) {
      setSelectedEvent(null);
    }
    
    if (eventToDelete) {
      toast({
        title: "Event deleted",
        description: `"${eventToDelete.title}" has been removed from your calendar.`,
      });
    }
  };

  const selectEvent = (event: CalendarEvent | null) => {
    setSelectedEvent(event);
  };
  
  // Mock sync function - replace with actual API calls when backend is ready
  const syncEvents = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Sync failed",
        description: "You need to be logged in to sync your events.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSyncing(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would:
      // 1. Get last sync timestamp
      // 2. Send local events that have changed since last sync
      // 3. Get server events that have changed since last sync
      // 4. Merge events with conflict resolution
      
      // For now, we'll just pretend we've synced successfully
      const now = new Date();
      saveLastSyncTimestamp();
      setLastSynced(now);
      
      toast({
        title: "Sync complete",
        description: `Your calendar has been synced successfully at ${now.toLocaleTimeString()}.`,
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "An error occurred during sync.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const importEvents = async (jsonData: string): Promise<boolean> => {
    try {
      const importData = JSON.parse(jsonData);
      
      // Validate import data structure
      if (!importData.events || !Array.isArray(importData.events)) {
        toast({
          title: "Import failed",
          description: "Invalid data format: events array missing",
          variant: "destructive",
        });
        return false;
      }
      
      // Convert string dates back to Date objects
      const importedEvents = importData.events.map((event: any) => ({
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
      
      // Replace current events or merge them
      setEvents(importedEvents);
      
      toast({
        title: "Import successful",
        description: `Imported ${importedEvents.length} events.`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to parse import data",
        variant: "destructive",
      });
      return false;
    }
  };
  
  const exportEvents = (): string => {
    const exportData = {
      events,
      exportDate: new Date(),
      version: '1.0'
    };
    
    toast({
      title: "Export successful",
      description: `Exported ${events.length} events.`,
    });
    
    return JSON.stringify(exportData, null, 2);
  };

  return (
    <CalendarContext.Provider
      value={{
        events,
        selectedDate,
        currentView,
        selectedEvent,
        isLoading,
        isSyncing,
        lastSynced,
        setSelectedDate,
        setCurrentView,
        getEventsForDate,
        addEvent,
        updateEvent,
        deleteEvent,
        selectEvent,
        syncEvents,
        importEvents,
        exportEvents,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
