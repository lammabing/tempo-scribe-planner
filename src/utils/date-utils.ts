
import { addDays, addMonths, addWeeks, addYears, format, getDay, isBefore, isEqual, isSameDay, isWithinInterval, startOfDay, startOfMonth, startOfWeek, endOfWeek, endOfMonth, eachDayOfInterval } from 'date-fns';
import { CalendarEvent, RecurrenceFrequency } from '@/types/calendar';

export const formatDate = (date: Date, formatStr: string = 'PP'): string => {
  return format(date, formatStr);
};

export const getDaysInMonth = (date: Date): Date[] => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
};

export const getDaysInWeek = (date: Date): Date[] => {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
};

export const getDaysGrid = (date: Date): Date[] => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  return eachDayOfInterval({ start: startDate, end: endDate });
};

export const getNextOccurrence = (
  event: CalendarEvent,
  after: Date,
): Date | null => {
  const { start, recurrence } = event;
  const { frequency, interval, end } = recurrence;

  // For non-recurring events, just return the start date if it's after the specified date
  if (frequency === 'none') {
    return isBefore(after, start) ? start : null;
  }

  let nextDate = start;
  let occurrenceCount = 0;

  // Find the next occurrence after the specified date
  while (isBefore(nextDate, after) || isEqual(nextDate, after)) {
    occurrenceCount++;

    // Check if we've reached the recurrence end
    if (end.type === 'count' && end.count && occurrenceCount >= end.count) {
      return null;
    }
    
    // Calculate next date based on frequency and interval
    switch (frequency) {
      case 'daily':
        nextDate = addDays(nextDate, interval);
        break;
      case 'weekly':
        nextDate = addWeeks(nextDate, interval);
        break;
      case 'monthly':
        nextDate = addMonths(nextDate, interval);
        break;
      case 'yearly':
        nextDate = addYears(nextDate, interval);
        break;
    }

    // Check if we've passed the until date
    if (end.type === 'until' && end.until && isBefore(end.until, nextDate)) {
      return null;
    }
  }

  return nextDate;
};

export const getEventOccurrencesInRange = (
  event: CalendarEvent,
  start: Date,
  end: Date,
): Date[] => {
  const occurrences: Date[] = [];
  let currentDate = new Date(event.start);
  
  // For non-recurring events, just check if it falls within the range
  if (event.recurrence.frequency === 'none') {
    if (isWithinInterval(event.start, { start, end }) || 
        isEqual(event.start, start) || 
        isEqual(event.start, end)) {
      occurrences.push(new Date(event.start));
    }
    return occurrences;
  }
  
  // For recurring events, find all occurrences within the range
  let maxIterations = 1000; // Safety limit to prevent infinite loops
  
  while (maxIterations > 0) {
    maxIterations--;
    
    // If we've gone past the end date, we're done
    if (isBefore(end, currentDate)) {
      break;
    }
    
    // If the current occurrence is within the range, add it
    if ((isBefore(start, currentDate) || isEqual(start, currentDate)) && 
        (isBefore(currentDate, end) || isEqual(currentDate, end))) {
      occurrences.push(new Date(currentDate));
    }
    
    // Move to the next occurrence
    const nextOccurrence = getNextOccurrence(
      { ...event, start: currentDate },
      addDays(currentDate, 1)
    );
    
    // If there's no next occurrence, we're done
    if (!nextOccurrence) {
      break;
    }
    
    currentDate = nextOccurrence;
  }
  
  return occurrences;
};

export const getEventsForDay = (
  events: CalendarEvent[],
  day: Date
): CalendarEvent[] => {
  const eventsForDay: CalendarEvent[] = [];
  
  events.forEach(event => {
    const occurrences = getEventOccurrencesInRange(
      event, 
      startOfDay(day), 
      startOfDay(day)
    );
    
    if (occurrences.length > 0) {
      occurrences.forEach(occurrence => {
        eventsForDay.push({
          ...event,
          start: occurrence,
          end: new Date(occurrence.getTime() + (event.end.getTime() - event.start.getTime()))
        });
      });
    }
  });
  
  return eventsForDay;
};

export const getEventsForRange = (
  events: CalendarEvent[],
  start: Date,
  end: Date
): CalendarEvent[] => {
  const eventsInRange: CalendarEvent[] = [];
  
  events.forEach(event => {
    const occurrences = getEventOccurrencesInRange(event, start, end);
    
    occurrences.forEach(occurrence => {
      eventsInRange.push({
        ...event,
        start: occurrence,
        end: new Date(occurrence.getTime() + (event.end.getTime() - event.start.getTime()))
      });
    });
  });
  
  return eventsInRange;
};

export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return date1.getMonth() === date2.getMonth() && 
         date1.getFullYear() === date2.getFullYear();
};
