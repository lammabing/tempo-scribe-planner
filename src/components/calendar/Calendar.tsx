
import React, { useState } from 'react';
import { format, addMonths, addWeeks, addDays, subMonths, subWeeks, subDays } from 'date-fns';
import { useCalendarContext } from '@/contexts/CalendarContext';
import { Button } from '@/components/ui/button';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import EventForm from './EventForm';
import EventDetails from './EventDetails';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarView } from '@/types/calendar';
import { cn } from '@/lib/utils';

const Calendar: React.FC = () => {
  const { selectedDate, setSelectedDate, currentView, setCurrentView, selectedEvent } = useCalendarContext();
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const navigateToToday = () => {
    setSelectedDate(new Date());
  };

  const navigatePrevious = () => {
    if (currentView === 'month') {
      setSelectedDate(subMonths(selectedDate, 1));
    } else if (currentView === 'week') {
      setSelectedDate(subWeeks(selectedDate, 1));
    } else {
      setSelectedDate(subDays(selectedDate, 1));
    }
  };

  const navigateNext = () => {
    if (currentView === 'month') {
      setSelectedDate(addMonths(selectedDate, 1));
    } else if (currentView === 'week') {
      setSelectedDate(addWeeks(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  const handleAddEvent = () => {
    setFormMode('create');
    setIsEventFormOpen(true);
  };

  const handleEditEvent = () => {
    setFormMode('edit');
    setIsEventDetailsOpen(false);
    setIsEventFormOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 border-b gap-2">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Calendar</h1>
          <Button variant="outline" onClick={navigateToToday}>
            Today
          </Button>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <h2 className="text-xl font-medium">
            {currentView === 'month' && format(selectedDate, 'MMMM yyyy')}
            {currentView === 'week' && `Week of ${format(selectedDate, 'MMM d, yyyy')}`}
            {currentView === 'day' && format(selectedDate, 'MMMM d, yyyy')}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex rounded-md border overflow-hidden">
            {['day', 'week', 'month'].map((view) => (
              <button
                key={view}
                className={cn(
                  'px-3 py-1.5 text-sm',
                  currentView === view
                    ? 'bg-calendar-primary text-white'
                    : 'hover:bg-gray-100'
                )}
                onClick={() => setCurrentView(view as CalendarView)}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
          
          <Button onClick={handleAddEvent} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-1" /> Add Event
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'month' && <MonthView />}
        {currentView === 'week' && <WeekView />}
        {currentView === 'day' && <DayView />}
      </div>

      {/* Event Form Modal */}
      <EventForm
        isOpen={isEventFormOpen}
        onClose={() => {
          setIsEventFormOpen(false);
          
          // If an event is selected and we just closed the edit form,
          // reopen the event details
          if (formMode === 'edit' && selectedEvent) {
            setIsEventDetailsOpen(true);
          }
        }}
        mode={formMode}
      />

      {/* Event Details Modal */}
      <EventDetails
        isOpen={isEventDetailsOpen || !!selectedEvent}
        onClose={() => setIsEventDetailsOpen(false)}
        onEdit={handleEditEvent}
      />
    </div>
  );
};

export default Calendar;
