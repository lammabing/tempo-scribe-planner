
import React from 'react';
import { format, getHours, getMinutes, isSameDay } from 'date-fns';
import { useCalendarContext } from '@/contexts/CalendarContext';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DayView: React.FC = () => {
  const { selectedDate, getEventsForDate, selectEvent } = useCalendarContext();
  
  const events = getEventsForDate(selectedDate);
  const allDayEvents = events.filter(event => event.allDay);
  const timeEvents = events.filter(event => !event.allDay);
  
  // Helper to position events according to their time
  const getEventStyle = (event: any) => {
    const startHour = getHours(event.start) + getMinutes(event.start) / 60;
    const endHour = getHours(event.end) + getMinutes(event.end) / 60;
    const duration = endHour - startHour;
    
    return {
      top: `${startHour * 4}rem`,
      height: `${duration * 4}rem`,
    };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b pb-2">
        <h2 className="text-xl font-semibold text-center">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        
        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div className="mt-2">
            <div className="text-sm font-medium mb-1 ml-16">All-day</div>
            <div className="ml-16 space-y-1">
              {allDayEvents.map(event => (
                <div 
                  key={event.id}
                  className={cn(
                    "bg-calendar-" + event.color,
                    "text-white rounded-md px-3 py-1 cursor-pointer",
                    "hover:opacity-90 transition-opacity"
                  )}
                  onClick={() => selectEvent(event)}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto relative">
        <div className="flex" style={{ minHeight: '96rem' }}> {/* 24 hours * 4rem */}
          <div className="w-16 bg-gray-50 flex-shrink-0">
            {HOURS.map((hour) => (
              <div key={hour} className="h-16 border-b border-gray-200 text-xs text-gray-500 text-right pr-2 pt-0">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>
          
          <div className="flex-1 relative">
            {/* Hour lines */}
            {HOURS.map((hour) => (
              <div key={hour} className="h-16 border-b border-gray-200"></div>
            ))}
            
            {/* Current time indicator */}
            {isSameDay(selectedDate, new Date()) && (
              <div 
                className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                style={{ 
                  top: `${(getHours(new Date()) + getMinutes(new Date()) / 60) * 4}rem` 
                }}
              >
                <div className="w-3 h-3 rounded-full bg-red-500 -mt-1.5 -ml-1.5"></div>
              </div>
            )}
            
            {/* Time-based events */}
            {timeEvents.map(event => (
              <div
                key={event.id}
                className={cn(
                  "absolute left-4 right-4 rounded-md p-2 overflow-hidden text-white",
                  "bg-calendar-" + event.color,
                  "cursor-pointer hover:opacity-90 transition-opacity"
                )}
                style={getEventStyle(event)}
                onClick={() => selectEvent(event)}
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-sm opacity-90">
                  {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                </div>
                {event.description && (
                  <div className="mt-1 text-sm opacity-90">{event.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayView;
