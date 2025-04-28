
import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addHours, startOfMonth } from 'date-fns';
import { CalendarEvent, CalendarView, EventType, RecurrenceFrequency } from '@/types/calendar';
import { getEventsForDay, getEventsForRange } from '@/utils/date-utils';

type CalendarContextType = {
  events: CalendarEvent[];
  selectedDate: Date;
  currentView: CalendarView;
  selectedEvent: CalendarEvent | null;
  setSelectedDate: (date: Date) => void;
  setCurrentView: (view: CalendarView) => void;
  getEventsForDate: (date: Date) => CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
  selectEvent: (event: CalendarEvent | null) => void;
};

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
};

const LOCAL_STORAGE_KEY = 'calendar-events';

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Load events from localStorage on mount
  useEffect(() => {
    const savedEvents = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
          recurrence: {
            ...event.recurrence,
            end: {
              ...event.recurrence.end,
              until: event.recurrence.end.until ? new Date(event.recurrence.end.until) : undefined
            }
          }
        }));
        setEvents(parsedEvents);
      } catch (error) {
        console.error('Failed to parse saved events:', error);
      }
    } else {
      // Add some sample events if there are none saved
      const now = new Date();
      
      const sampleEvents: CalendarEvent[] = [
        {
          id: uuidv4(),
          title: 'Team Meeting',
          description: 'Weekly team sync',
          type: 'event',
          start: addDays(now, 1),
          end: addHours(addDays(now, 1), 1),
          allDay: false,
          color: 'event-1',
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
          color: 'event-3',
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
          color: 'event-2',
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
      
      setEvents(sampleEvents);
    }
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return getEventsForDay(events, date);
  };

  const addEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent = { ...event, id: uuidv4() };
    setEvents([...events, newEvent]);
  };

  const updateEvent = (updatedEvent: CalendarEvent) => {
    setEvents(events.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ));
    
    // If the selected event was updated, update the selected event as well
    if (selectedEvent && selectedEvent.id === updatedEvent.id) {
      setSelectedEvent(updatedEvent);
    }
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
    
    // If the selected event was deleted, clear the selection
    if (selectedEvent && selectedEvent.id === id) {
      setSelectedEvent(null);
    }
  };

  const selectEvent = (event: CalendarEvent | null) => {
    setSelectedEvent(event);
  };

  return (
    <CalendarContext.Provider
      value={{
        events,
        selectedDate,
        currentView,
        selectedEvent,
        setSelectedDate,
        setCurrentView,
        getEventsForDate,
        addEvent,
        updateEvent,
        deleteEvent,
        selectEvent,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
