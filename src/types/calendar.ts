
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
