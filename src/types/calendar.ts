
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
  { id: 'purple', name: 'Purple', hex: '#8B5CF6' },
  { id: 'green', name: 'Green', hex: '#10B981' },
  { id: 'orange', name: 'Orange', hex: '#F97316' },
  { id: 'blue', name: 'Blue', hex: '#0EA5E9' },
  { id: 'pink', name: 'Pink', hex: '#D946EF' },
  { id: 'red', name: 'Red', hex: '#EF4444' },
  { id: 'teal', name: 'Teal', hex: '#14B8A6' },
  { id: 'amber', name: 'Amber', hex: '#F59E0B' }
];

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string; // This will now store the hex color directly
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
