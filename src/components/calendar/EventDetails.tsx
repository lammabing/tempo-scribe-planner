
import React from 'react';
import { format } from 'date-fns';
import { useCalendarContext } from '@/contexts/CalendarContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/types/calendar';
import { Clock, CalendarIcon, Check, X, MapPin, FileEdit, User } from 'lucide-react';
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
      completed: !selectedEvent.completed,
      status: !selectedEvent.completed ? 'completed' : 'pending'
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

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return <Check className="h-4 w-4" />;
      case 'overdue': return <Clock className="h-4 w-4" />;
      case 'abandoned': return <X className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusClasses = (status?: string) => {
    switch (status) {
      case 'completed': return "bg-green-100 text-green-800 border-green-300";
      case 'overdue': return "bg-amber-100 text-amber-800 border-amber-300";
      case 'abandoned': return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
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
          
          {/* Status badge */}
          {selectedEvent.status && selectedEvent.status !== 'pending' && (
            <div className="mt-1">
              <span className={cn(
                "text-xs px-2 py-1 rounded-full inline-flex items-center border",
                getStatusClasses(selectedEvent.status)
              )}>
                {getStatusIcon(selectedEvent.status)}
                <span className="ml-1 font-medium">
                  {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                </span>
              </span>
            </div>
          )}
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
            
            {/* Deadline */}
            {selectedEvent.deadline && (
              <div className="flex items-center space-x-2 text-gray-600 font-medium">
                <CalendarIcon className="h-4 w-4 text-red-600" />
                <span className="text-red-600">
                  Deadline: {format(selectedEvent.deadline, "MMMM d, yyyy")}
                </span>
              </div>
            )}
            
            {/* Location */}
            {selectedEvent.location && (
              <div className="flex items-start space-x-2 text-gray-600">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>{selectedEvent.location}</span>
              </div>
            )}
          </div>
          
          {/* Contact Persons */}
          {selectedEvent.contactPersons && selectedEvent.contactPersons.length > 0 && (
            <div className="border-t pt-2">
              <h3 className="text-sm font-medium mb-2">Contact Persons:</h3>
              <div className="space-y-2">
                {selectedEvent.contactPersons.map(person => (
                  <div key={person.id} className="flex items-start space-x-2 text-gray-600 text-sm">
                    <User className="h-4 w-4 mt-0.5" />
                    <div>
                      <p className="font-medium">{person.name}</p>
                      {(person.email || person.phone) && (
                        <p className="text-xs text-gray-500">
                          {person.email && <span className="block">{person.email}</span>}
                          {person.phone && <span>{person.phone}</span>}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
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
