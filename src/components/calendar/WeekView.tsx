
import React, { useMemo } from 'react';
import { format, getHours, getMinutes, addDays, isSameDay } from 'date-fns';
import { useCalendarContext } from '@/contexts/CalendarContext';
import { getDaysInWeek } from '@/utils/date-utils';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const WeekView: React.FC = () => {
  const { selectedDate, getEventsForDate, selectEvent } = useCalendarContext();
  
  const days = getDaysInWeek(selectedDate);
  const today = new Date();

  // Pre-compute events for each day
  const eventsByDay = useMemo(() => {
    return days.map(day => {
      const dayEvents = getEventsForDate(day);
      return { day, events: dayEvents };
    });
  }, [days, getEventsForDate]);

  // Helper to position events according to their time
  const getEventStyle = (event: any) => {
    const startHour = getHours(event.start) + getMinutes(event.start) / 60;
    const endHour = getHours(event.end) + getMinutes(event.end) / 60;
    const duration = endHour - startHour;
    
    return {
      top: `${startHour * 4}rem`,
      height: `${duration * 4}rem`,
      backgroundColor: event.color
    };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b">
        <div className="w-16 bg-gray-50"></div>
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <div 
              key={day.toString()} 
              className={cn(
                "flex-1 text-center py-2 font-medium",
                isToday && "bg-blue-50"
              )}
            >
              <div className="text-sm">{format(day, 'EEE')}</div>
              <div 
                className={cn(
                  "text-lg",
                  isToday && "text-blue-600"
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="relative flex" style={{ minHeight: '96rem' }}> {/* 24 hours * 4rem */}
          <div className="w-16 bg-gray-50 flex-shrink-0">
            {HOURS.map((hour) => (
              <div key={hour} className="h-16 border-b border-gray-200 text-xs text-gray-500 text-right pr-2 pt-0">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>
          
          <div className="flex-1 grid grid-cols-7">
            {days.map((day, dayIndex) => {
              const { events } = eventsByDay[dayIndex];
              
              return (
                <div key={day.toString()} className="relative h-full border-r border-gray-200">
                  {/* Hour lines */}
                  {HOURS.map((hour) => (
                    <div key={hour} className="h-16 border-b border-gray-200"></div>
                  ))}
                  
                  {/* Events */}
                  {events
                    .filter(event => !event.allDay)
                    .map(event => (
                      <div
                        key={event.id}
                        className="absolute left-1 right-1 rounded-md p-1 overflow-hidden text-black text-xs cursor-pointer hover:opacity-90 transition-opacity"
                        style={getEventStyle(event)}
                        onClick={() => selectEvent(event)}
                      >
                        <div className="font-medium">{event.title}</div>
                        {getHours(event.end) - getHours(event.start) > 1 && (
                          <div className="text-xs opacity-90">
                            {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekView;
