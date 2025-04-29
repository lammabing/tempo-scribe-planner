
export type EventType = 'event' | 'task' | 'appointment';

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type RecurrenceEnd = {
  type: 'never' | 'until' | 'count';
  until?: Date;
  count?: number;
};

export type CompletionStatus = 'pending' | 'completed' | 'overdue' | 'abandoned';

export type ContactPerson = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

// Available colors for events with their display names
export const EVENT_COLORS = [
  { id: 'event-1', name: 'Purple', hex: '#8B5CF6' },
  { id: 'event-2', name: 'Green', hex: '#10B981' },
  { id: 'event-3', name: 'Orange', hex: '#F97316' },
  { id: 'event-4', name: 'Blue', hex: '#0EA5E9' },
  { id: 'event-5', name: 'Pink', hex: '#D946EF' },
  { id: 'event-6', name: 'Red', hex: '#EF4444' },
  { id: 'event-7', name: 'Teal', hex: '#14B8A6' },
  { id: 'event-8', name: 'Amber', hex: '#F59E0B' }
];

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string;
  recurrence: {
    frequency: RecurrenceFrequency;
    interval: number;
    daysOfWeek?: number[];
    end: RecurrenceEnd;
  };
  completed?: boolean;
  // New optional fields
  deadline?: Date;
  status?: CompletionStatus;
  location?: string;
  contactPersons?: ContactPerson[];
};

export type CalendarView = 'month' | 'week' | 'day';
