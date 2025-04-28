
import React from 'react';
import { format } from 'date-fns';
import { useCalendarContext } from '@/contexts/CalendarContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/types/calendar';
import { Clock, CalendarIcon, Check, X, MapPin, FileEdit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EventDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ isOpen, onClose, onEdit }) => {
  const { selectedEvent, updateEvent } = useCalendarContext();
  
  if (!selectedEvent) return null;
  
  const handleToggleComplete = () => {
    updateEvent({
      ...selectedEvent,
      completed: !selectedEvent.completed
    });
  };
  
  const formatRecurrence = (event: CalendarEvent) => {
    const { frequency, interval, end } = event.recurrence;
    
    if (frequency === 'none') return 'One-time event';
    
    let text = `Repeats ${frequency}`;
    
    if (interval > 1) {
      text += ` every ${interval} ${frequency === 'daily' ? 'days' : 
        frequency === 'weekly' ? 'weeks' : 
        frequency === 'monthly' ? 'months' : 'years'}`;
    }
    
    if (end.type === 'until' && end.until) {
      text += `, until ${format(end.until, 'MMM d, yyyy')}`;
    } else if (end.type === 'count' && end.count) {
      text += `, ${end.count} time${end.count > 1 ? 's' : ''}`;
    }
    
    return text;
  };

  return (
    <Dialog 
      open={isOpen && selectedEvent !== null} 
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <Badge 
              className={cn(
                "mb-2", 
                selectedEvent.type === 'event' ? "bg-blue-600" :
                selectedEvent.type === 'task' ? "bg-green-600" :
                "bg-orange-500"
              )}
            >
              {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
            </Badge>
            
            {selectedEvent.type === 'task' && (
              <Button 
                variant="ghost" 
                size="sm"
                className={cn(
                  "px-2 rounded-full",
                  selectedEvent.completed ? "text-green-600" : "text-gray-400"
                )}
                onClick={handleToggleComplete}
              >
                {selectedEvent.completed ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
          
          <DialogTitle className={cn(
            "text-xl font-bold break-words",
            selectedEvent.type === 'task' && selectedEvent.completed && "line-through text-gray-500"
          )}>
            {selectedEvent.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {selectedEvent.allDay ? (
                  format(selectedEvent.start, "EEEE, MMMM d, yyyy") + ' (All day)'
                ) : (
                  <>
                    {format(selectedEvent.start, "EEEE, MMMM d, yyyy, h:mm a")}
                    {' - '}
                    {format(selectedEvent.end, "h:mm a")}
                  </>
                )}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-600">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatRecurrence(selectedEvent)}</span>
            </div>
          </div>
          
          {selectedEvent.description && (
            <div className="pt-2 border-t text-gray-800 whitespace-pre-line">
              {selectedEvent.description}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onEdit}>
              <FileEdit className="h-4 w-4 mr-1" /> Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetails;
