
import React from 'react';
import { format, isSameDay, isSameMonth } from 'date-fns';
import { useCalendarContext } from '@/contexts/CalendarContext';
import { getDaysGrid } from '@/utils/date-utils';
import { CalendarEvent } from '@/types/calendar';
import { cn } from '@/lib/utils';

const MonthView: React.FC = () => {
  const { selectedDate, setSelectedDate, getEventsForDate, selectEvent } = useCalendarContext();
  
  const days = getDaysGrid(selectedDate);
  const today = new Date();

  const renderEvents = (date: Date, events: CalendarEvent[]) => {
    // Show at most 3 events and a "+X more" indicator
    const maxEvents = 3;
    const displayEvents = events.slice(0, maxEvents);
    const moreCount = events.length - maxEvents;

    return (
      <>
        {displayEvents.map((event) => (
          <div
            key={event.id}
            className={cn(
              "event-pill bg-calendar-" + event.color,
              "text-white cursor-pointer mb-1 animate-fade-in"
            )}
            onClick={(e) => {
              e.stopPropagation();
              selectEvent(event);
            }}
          >
            {event.title}
          </div>
        ))}
        {moreCount > 0 && (
          <div className="text-xs text-gray-500 font-medium pl-1">
            +{moreCount} more
          </div>
        )}
      </>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="calendar-grid grid-cols-7 text-center font-medium border-b border-gray-200 bg-gray-50 py-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="calendar-grid flex-1 border-b border-gray-200">
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const events = getEventsForDate(day);
          
          return (
            <div
              key={day.toString()}
              className={cn(
                "calendar-day border-r border-b p-1",
                isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400",
                isToday && "bg-blue-50"
              )}
              onClick={() => setSelectedDate(day)}
            >
              <div
                className={cn(
                  "font-medium text-sm mb-1 flex items-center justify-between",
                  isToday && "text-blue-600"
                )}
              >
                <span
                  className={cn(
                    "h-6 w-6 flex items-center justify-center rounded-full",
                    isToday && "bg-blue-600 text-white"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="calendar-day-content text-left">
                {renderEvents(day, events)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
