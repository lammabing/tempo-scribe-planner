
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useCalendarContext } from '@/contexts/CalendarContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarEvent, EventType, RecurrenceFrequency, CompletionStatus, ContactPerson, EVENT_COLORS } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CalendarIcon, Check, Trash2, Clock, X, MapPin, 
  User, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { v4 as uuidv4 } from 'uuid';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
}

const initialEventState = (start: Date): Omit<CalendarEvent, 'id'> => {
  const endTime = new Date(start);
  endTime.setHours(endTime.getHours() + 1);
  
  return {
    title: '',
    description: '',
    type: 'event',
    start,
    end: endTime,
    allDay: false,
    color: '#8B5CF6', // Default color (purple)
    recurrence: {
      frequency: 'none',
      interval: 1,
      end: { type: 'never' }
    },
    status: 'pending',
    contactPersons: []
  };
};

const EventForm: React.FC<EventFormProps> = ({ isOpen, onClose, mode }) => {
  const { selectedDate, selectedEvent, addEvent, updateEvent, deleteEvent } = useCalendarContext();
  
  const [eventData, setEventData] = useState<Omit<CalendarEvent, 'id'>>(
    mode === 'edit' && selectedEvent 
      ? {
          title: selectedEvent.title,
          description: selectedEvent.description || '',
          type: selectedEvent.type,
          start: selectedEvent.start,
          end: selectedEvent.end,
          allDay: selectedEvent.allDay,
          color: selectedEvent.color,
          recurrence: selectedEvent.recurrence,
          completed: selectedEvent.completed,
          deadline: selectedEvent.deadline,
          status: selectedEvent.status || 'pending',
          location: selectedEvent.location || '',
          contactPersons: selectedEvent.contactPersons || []
        }
      : initialEventState(selectedDate)
  );
  
  // State for new contact person form
  const [newContact, setNewContact] = useState<{name: string, email: string, phone: string}>({
    name: '',
    email: '',
    phone: ''
  });
  
  // State for collapsible section
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Check if deadline is overdue
  useEffect(() => {
    if (eventData.deadline) {
      const now = new Date();
      if (now > eventData.deadline && eventData.status === 'pending') {
        setEventData(prev => ({ ...prev, status: 'overdue' }));
      }
    }
  }, [eventData.deadline]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEventData(prev => ({ ...prev, [name]: value }));
  };

  const handleStartChange = (date: Date | undefined) => {
    if (!date) return;
    
    // Preserve the time from the existing start date
    const newStart = new Date(date);
    if (eventData.start) {
      newStart.setHours(
        eventData.start.getHours(),
        eventData.start.getMinutes()
      );
    }
    
    // If we're changing the start date, make sure the end date is still after the start
    let newEnd = eventData.end;
    const duration = eventData.end.getTime() - eventData.start.getTime();
    if (newStart.getTime() > newEnd.getTime() || isNaN(duration)) {
      newEnd = new Date(newStart.getTime() + 3600000); // Default to 1 hour later
    } else {
      newEnd = new Date(newStart.getTime() + duration);
    }
    
    setEventData(prev => ({ ...prev, start: newStart, end: newEnd }));
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newStart = new Date(eventData.start);
    newStart.setHours(hours, minutes);
    
    // Ensure end is still after start
    let newEnd = eventData.end;
    if (newStart >= newEnd) {
      const endTime = new Date(newStart);
      endTime.setHours(endTime.getHours() + 1);
      newEnd = endTime;
    }
    
    setEventData(prev => ({ ...prev, start: newStart, end: newEnd }));
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newEnd = new Date(eventData.end);
    newEnd.setHours(hours, minutes);
    
    // Ensure end is after start
    if (newEnd <= eventData.start) {
      const startTime = new Date(newEnd);
      startTime.setHours(startTime.getHours() - 1);
      setEventData(prev => ({ 
        ...prev, 
        start: startTime,
        end: newEnd
      }));
      return;
    }
    
    setEventData(prev => ({ ...prev, end: newEnd }));
  };

  const handleEndChange = (date: Date | undefined) => {
    if (!date) return;
    
    // Preserve the time from the existing end date
    const newEnd = new Date(date);
    if (eventData.end) {
      newEnd.setHours(
        eventData.end.getHours(),
        eventData.end.getMinutes()
      );
    }
    
    // Ensure end date is after start date
    if (newEnd < eventData.start) {
      return; // Don't allow end date before start date
    }
    
    setEventData(prev => ({ ...prev, end: newEnd }));
  };

  const handleRecurrenceFrequencyChange = (value: string) => {
    setEventData(prev => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        frequency: value as RecurrenceFrequency,
      },
    }));
  };

  const handleRecurrenceEndTypeChange = (value: string) => {
    setEventData(prev => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        end: {
          ...prev.recurrence.end,
          type: value as 'never' | 'until' | 'count',
        },
      },
    }));
  };

  const handleRecurrenceUntilChange = (date: Date | undefined) => {
    if (!date) return;
    setEventData(prev => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        end: {
          ...prev.recurrence.end,
          type: 'until',
          until: date,
        },
      },
    }));
  };

  const handleRecurrenceCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value, 10);
    if (isNaN(count) || count < 1) return;
    
    setEventData(prev => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        end: {
          ...prev.recurrence.end,
          type: 'count',
          count,
        },
      },
    }));
  };

  const handleRecurrenceIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interval = parseInt(e.target.value, 10);
    if (isNaN(interval) || interval < 1) return;
    
    setEventData(prev => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        interval,
      },
    }));
  };

  const handleAllDayChange = (checked: boolean) => {
    if (checked) {
      // If switching to all-day, set times to start and end of day
      const newStart = new Date(eventData.start);
      newStart.setHours(0, 0, 0, 0);
      
      const newEnd = new Date(eventData.end);
      newEnd.setHours(23, 59, 59, 999);
      
      setEventData(prev => ({ 
        ...prev, 
        allDay: checked, 
        start: newStart, 
        end: newEnd 
      }));
    } else {
      // If switching from all-day, set reasonable default times
      const newStart = new Date(eventData.start);
      newStart.setHours(9, 0, 0, 0);
      
      const newEnd = new Date(eventData.start);
      newEnd.setHours(10, 0, 0, 0);
      
      setEventData(prev => ({ 
        ...prev, 
        allDay: checked, 
        start: newStart, 
        end: newEnd 
      }));
    }
  };

  const handleToggleCompleted = () => {
    setEventData(prev => ({ ...prev, completed: !prev.completed }));
  };

  // Function for handling color selection - updated to use hex directly
  const handleColorSelection = (hexColor: string) => {
    setEventData(prev => ({ ...prev, color: hexColor }));
  };
  
  const handleDeadlineChange = (date: Date | undefined) => {
    if (!date) {
      setEventData(prev => ({ ...prev, deadline: undefined }));
      return;
    }
    
    // If deadline is in the past, set status to overdue
    const now = new Date();
    let newStatus = eventData.status;
    if (date < now && newStatus === 'pending') {
      newStatus = 'overdue';
    }
    
    setEventData(prev => ({ 
      ...prev, 
      deadline: date,
      status: newStatus
    }));
  };
  
  const handleStatusChange = (value: string) => {
    setEventData(prev => ({ ...prev, status: value as CompletionStatus }));
  };
  
  const handleAddContactPerson = () => {
    if (!newContact.name.trim()) return;
    
    const newContactPerson: ContactPerson = {
      id: uuidv4(),
      name: newContact.name.trim(),
      email: newContact.email.trim() || undefined,
      phone: newContact.phone.trim() || undefined
    };
    
    setEventData(prev => ({
      ...prev,
      contactPersons: [...(prev.contactPersons || []), newContactPerson]
    }));
    
    // Reset the form
    setNewContact({ name: '', email: '', phone: '' });
  };
  
  const handleRemoveContactPerson = (id: string) => {
    setEventData(prev => ({
      ...prev,
      contactPersons: (prev.contactPersons || []).filter(person => person.id !== id)
    }));
  };
  
  const handleContactInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewContact(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventData.title.trim()) {
      // Show validation error or toast
      return;
    }
    
    if (mode === 'create') {
      addEvent(eventData);
    } else if (mode === 'edit' && selectedEvent) {
      updateEvent({ ...eventData, id: selectedEvent.id });
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (mode === 'edit' && selectedEvent) {
      deleteEvent(selectedEvent.id);
      onClose();
    }
  };

  const getStatusIcon = (status: CompletionStatus) => {
    switch (status) {
      case 'completed': return <Check className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      case 'abandoned': return <X className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New Event' : 'Edit Event'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title - no label */}
          <Input 
            name="title" 
            value={eventData.title} 
            onChange={handleInputChange} 
            placeholder="Add title" 
            required 
            className="text-lg font-medium"
          />

          {/* Top Row: Event Type, Color, Recurrence, All-Day */}
          <div className="grid grid-cols-3 gap-2">
            {/* Event Type - no label */}
            <Select 
              value={eventData.type} 
              onValueChange={(value) => setEventData(prev => ({ ...prev, type: value as EventType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="appointment">Appointment</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Color - no label */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span 
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: eventData.color }}
                    />
                  </div>
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                <div className="grid grid-cols-4 gap-2">
                  {EVENT_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2",
                        eventData.color === color.hex ? "border-primary" : "border-transparent",
                        "hover:border-primary/50 transition-all"
                      )}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => handleColorSelection(color.hex)}
                      aria-label={`Select ${color.name} color`}
                      title={color.name}
                    >
                      {eventData.color === color.hex && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Recurrence and All-Day on same cell */}
            <div className="flex items-center gap-2">
              {/* Recurrence - no label */}
              <Select
                value={eventData.recurrence.frequency}
                onValueChange={handleRecurrenceFrequencyChange}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Repeat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>

              {/* All-Day Switch */}
              <div className="flex items-center">
                <Switch 
                  id="allDay" 
                  checked={eventData.allDay} 
                  onCheckedChange={handleAllDayChange}
                  className="ml-1" 
                />
              </div>
            </div>
          </div>
          
          {/* Date & Time Section */}
          <div className="grid grid-cols-2 gap-3">
            {/* Start Date/Time */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Start</div>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="justify-start text-left flex-1 text-sm py-1 px-2 h-9"
                    >
                      <CalendarIcon className="mr-1 h-4 w-4" />
                      <span>{format(eventData.start, "MMM d, yyyy")}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={eventData.start}
                      onSelect={handleStartChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                {!eventData.allDay && (
                  <Input
                    type="time"
                    value={format(eventData.start, "HH:mm")}
                    onChange={handleStartTimeChange}
                    className="w-24 h-9"
                  />
                )}
              </div>
            </div>
            
            {/* End Date/Time */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">End</div>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="justify-start text-left flex-1 text-sm py-1 px-2 h-9"
                    >
                      <CalendarIcon className="mr-1 h-4 w-4" />
                      <span>{format(eventData.end, "MMM d, yyyy")}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={eventData.end}
                      onSelect={handleEndChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                {!eventData.allDay && (
                  <Input
                    type="time"
                    value={format(eventData.end, "HH:mm")}
                    onChange={handleEndTimeChange}
                    className="w-24 h-9"
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Middle Row: Deadline and Status */}
          <div className="grid grid-cols-2 gap-3">
            {/* Deadline Field */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Deadline</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="justify-start text-left w-full text-sm py-1 px-2 h-9"
                  >
                    <CalendarIcon className="mr-1 h-4 w-4" />
                    <span>
                      {eventData.deadline 
                        ? format(eventData.deadline, "MMM d, yyyy") 
                        : "Optional"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-2 flex justify-between items-center border-b">
                    <div className="text-sm font-medium">Set Deadline</div>
                    {eventData.deadline && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2" 
                        onClick={() => handleDeadlineChange(undefined)}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Calendar
                    mode="single"
                    selected={eventData.deadline}
                    onSelect={handleDeadlineChange}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Status Field */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <Select
                value={eventData.status || 'pending'}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="text-sm py-1 px-2 h-9">
                  <SelectValue placeholder="Select status">
                    <div className="flex items-center">
                      {getStatusIcon(eventData.status as CompletionStatus)}
                      <span className="ml-1">
                        {eventData.status ? eventData.status.charAt(0).toUpperCase() + eventData.status.slice(1) : 'Pending'}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Completed
                    </div>
                  </SelectItem>
                  <SelectItem value="overdue">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                      Overdue
                    </div>
                  </SelectItem>
                  <SelectItem value="abandoned">
                    <div className="flex items-center">
                      <X className="h-4 w-4 mr-2 text-red-600" />
                      Abandoned
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Collapsible Details Section */}
          <Collapsible
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            className="border rounded-md p-2 space-y-3"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
              <span className="text-sm font-medium">Additional Details</span>
              {isDetailsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-3">
              {/* Location Field */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Location</div>
                <div className="flex">
                  <div className="flex items-center px-2 bg-muted rounded-l-md border-y border-l">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    name="location"
                    value={eventData.location || ''}
                    onChange={handleInputChange}
                    placeholder="Add location"
                    className="rounded-l-none py-1 px-2 h-9"
                  />
                </div>
              </div>
              
              {/* Description */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Description</div>
                <Textarea
                  name="description"
                  value={eventData.description}
                  onChange={handleInputChange}
                  placeholder="Add description"
                  rows={2}
                  className="resize-none"
                />
              </div>
              
              {/* Contact Persons */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Contact Persons</div>
                
                {/* List of added contacts */}
                {(eventData.contactPersons || []).length > 0 && (
                  <div className="space-y-1 mb-2">
                    {(eventData.contactPersons || []).map(person => (
                      <div 
                        key={person.id} 
                        className="flex items-center justify-between p-1 bg-muted rounded-md"
                      >
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-2" />
                          <div>
                            <p className="text-sm font-medium">{person.name}</p>
                            <div className="text-xs text-muted-foreground">
                              {person.email && <span className="block">{person.email}</span>}
                              {person.phone && <span>{person.phone}</span>}
                            </div>
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleRemoveContactPerson(person.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add new contact form */}
                <div className="space-y-1 p-2 bg-muted/50 rounded-md">
                  <div className="grid grid-cols-2 gap-1">
                    <Input
                      name="name"
                      value={newContact.name}
                      onChange={handleContactInputChange}
                      placeholder="Name"
                      className="text-sm h-8"
                    />
                    <Input
                      name="email"
                      value={newContact.email}
                      onChange={handleContactInputChange}
                      placeholder="Email"
                      className="text-sm h-8"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      name="phone"
                      value={newContact.phone}
                      onChange={handleContactInputChange}
                      placeholder="Phone"
                      className="text-sm h-8"
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddContactPerson}
                      disabled={!newContact.name.trim()}
                      className="whitespace-nowrap h-8"
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Recurrence Settings */}
              {eventData.recurrence.frequency !== 'none' && (
                <div className="space-y-2 border-l-2 border-blue-200 pl-3 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Every</span>
                    <Input
                      type="number"
                      min="1"
                      value={eventData.recurrence.interval}
                      onChange={handleRecurrenceIntervalChange}
                      className="w-16 text-sm h-8"
                    />
                    <span className="text-sm">
                      {eventData.recurrence.frequency === 'daily' ? 'day(s)' :
                       eventData.recurrence.frequency === 'weekly' ? 'week(s)' :
                       eventData.recurrence.frequency === 'monthly' ? 'month(s)' : 'year(s)'}
                    </span>
                  </div>
                  
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Ends</div>
                    <Tabs value={eventData.recurrence.end.type} onValueChange={handleRecurrenceEndTypeChange}>
                      <TabsList className="grid grid-cols-3 h-8">
                        <TabsTrigger value="never" className="text-xs py-1">Never</TabsTrigger>
                        <TabsTrigger value="until" className="text-xs py-1">On Date</TabsTrigger>
                        <TabsTrigger value="count" className="text-xs py-1">After</TabsTrigger>
                      </TabsList>
                      
                      {eventData.recurrence.end.type === 'until' && (
                        <div className="mt-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-sm py-1 px-2 h-8">
                                <CalendarIcon className="mr-1 h-4 w-4" />
                                <span>
                                  {eventData.recurrence.end.until ? 
                                    format(eventData.recurrence.end.until, "MMM d, yyyy") : 
                                    "Select end date"
                                  }
                                </span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={eventData.recurrence.end.until}
                                onSelect={handleRecurrenceUntilChange}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                      
                      {eventData.recurrence.end.type === 'count' && (
                        <div className="mt-1 flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={eventData.recurrence.end.count || 1}
                            onChange={handleRecurrenceCountChange}
                            className="w-16 text-sm h-8"
                          />
                          <span className="text-sm">occurrence(s)</span>
                        </div>
                      )}
                    </Tabs>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
          
          {/* Task-specific completed toggle */}
          {eventData.type === 'task' && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="completed" className="cursor-pointer text-sm">Completed</Label>
              <Switch
                id="completed"
                checked={!!eventData.completed}
                onCheckedChange={handleToggleCompleted}
              />
            </div>
          )}
          
          <div className="flex justify-between pt-2">
            {mode === 'edit' && (
              <Button 
                type="button" 
                onClick={handleDelete} 
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
            
            <div className="ml-auto space-x-2">
              <Button type="button" variant="outline" onClick={onClose} size="sm">
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" size="sm">
                {mode === 'create' ? 'Add' : 'Save'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventForm;
