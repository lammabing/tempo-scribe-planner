
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
    return isBefore(after, start) || isSameDay(after, start) ? start : null;
  }

  let nextDate = new Date(start); // Create a copy of the start date
  let occurrenceCount = 0;

  // Find the next occurrence after the specified date
  while (isBefore(nextDate, after) && !isSameDay(nextDate, after)) {
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
  
  // For non-recurring events, just check if it falls within the range
  if (event.recurrence.frequency === 'none') {
    const eventDate = startOfDay(new Date(event.start));
    const rangeStart = startOfDay(new Date(start));
    const rangeEnd = startOfDay(new Date(end));
    
    if ((isWithinInterval(eventDate, { start: rangeStart, end: rangeEnd }) || 
        isSameDay(eventDate, rangeStart) || 
        isSameDay(eventDate, rangeEnd))) {
      occurrences.push(new Date(event.start));
    }
    return occurrences;
  }
  
  // For recurring events, find all occurrences within the range
  let currentDate = new Date(event.start);
  let maxIterations = 366; // Safety limit to prevent infinite loops (one year of daily events max)
  
  while (maxIterations > 0) {
    maxIterations--;
    
    const currentDay = startOfDay(new Date(currentDate));
    const rangeStart = startOfDay(new Date(start));
    const rangeEnd = startOfDay(new Date(end));
    
    // If the current occurrence is within the range, add it
    if ((isBefore(rangeStart, currentDay) || isSameDay(rangeStart, currentDay)) && 
        (isBefore(currentDay, rangeEnd) || isSameDay(currentDay, rangeEnd))) {
      occurrences.push(new Date(currentDate));
    }
    
    // If we've gone past the end date, we're done
    if (isBefore(rangeEnd, currentDay)) {
      break;
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
  const startOfSelectedDay = startOfDay(new Date(day));
  
  events.forEach(event => {
    // For non-recurring events, directly check if it falls on this day
    if (event.recurrence.frequency === 'none') {
      const eventDay = startOfDay(new Date(event.start));
      if (isSameDay(eventDay, startOfSelectedDay)) {
        eventsForDay.push({...event});
      }
      return;
    }
    
    // For recurring events, check if any occurrence falls on this day
    const occurrences = getEventOccurrencesInRange(
      event, 
      startOfSelectedDay, 
      startOfSelectedDay
    );
    
    if (occurrences.length > 0) {
      occurrences.forEach(occurrence => {
        // Create a copy of the event with the correct start/end times for this occurrence
        const timeDiff = event.end.getTime() - event.start.getTime();
        const occurrenceStart = new Date(occurrence);
        const occurrenceEnd = new Date(occurrence.getTime() + timeDiff);
        
        eventsForDay.push({
          ...event,
          start: occurrenceStart,
          end: occurrenceEnd
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
      // Create a copy of the event with the start/end times adjusted for this occurrence
      const timeDiff = event.end.getTime() - event.start.getTime();
      const occurrenceStart = new Date(occurrence);
      const occurrenceEnd = new Date(occurrence.getTime() + timeDiff);
      
      eventsInRange.push({
        ...event,
        start: occurrenceStart,
        end: occurrenceEnd
      });
    });
  });
  
  return eventsInRange;
};

export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return date1.getMonth() === date2.getMonth() && 
         date1.getFullYear() === date2.getFullYear();
};
