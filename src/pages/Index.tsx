
import { CalendarProvider } from '@/contexts/CalendarContext';
import Calendar from '@/components/calendar/Calendar';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-calendar-primary text-white py-3 px-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold">TempoScribe Planner</h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto bg-white shadow-sm my-4 overflow-hidden flex flex-col">
        <CalendarProvider>
          <Calendar />
        </CalendarProvider>
      </main>

      <footer className="py-3 px-4 text-center text-gray-600 text-sm">
        <p>TempoScribe Planner - Manage your schedule with ease</p>
      </footer>
      
      <Toaster />
    </div>
  );
};

export default Index;
