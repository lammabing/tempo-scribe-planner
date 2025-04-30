
import React, { useState } from 'react';
import { CalendarProvider } from '@/contexts/CalendarContext';
import { AuthProvider } from '@/contexts/AuthContext';
import Calendar from '@/components/calendar/Calendar';
import AuthModal from '@/components/auth/AuthModal';
import ImportExportModal from '@/components/calendar/ImportExportModal';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RefreshCcw, LogIn, LogOut, User, Download, Menu } from 'lucide-react';
import { useCalendarContext } from '@/contexts/CalendarContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const HeaderContent: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { syncEvents, isSyncing } = useCalendarContext();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [importExportModalOpen, setImportExportModalOpen] = useState(false);
  
  const handleSync = async () => {
    await syncEvents();
  };
  
  const handleLogout = async () => {
    await logout();
  };
  
  const getInitials = (): string => {
    if (!user) return 'G';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    
    if (user.firstName) {
      return user.firstName.charAt(0);
    }
    
    return user.email.charAt(0).toUpperCase();
  };
  
  return (
    <>
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-bold">TempoScribe Planner</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        {isAuthenticated ? (
          <>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              title="Sync calendar"
            >
              <RefreshCcw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Button>
          
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setImportExportModalOpen(true)}
              title="Import/Export calendar"
            >
              <Download className="h-4 w-4 mr-1" />
              Import/Export
            </Button>
          
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button 
            size="sm"
            onClick={() => setAuthModalOpen(true)}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        )}
      </div>
      
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
      
      <ImportExportModal
        isOpen={importExportModalOpen}
        onClose={() => setImportExportModalOpen(false)}
      />
    </>
  );
};

const Index: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <AuthProvider>
        <CalendarProvider>
          <header className="bg-calendar-primary text-white py-3 px-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
              <HeaderContent />
            </div>
          </header>

          <main className="flex-1 container mx-auto bg-white shadow-sm my-4 overflow-hidden flex flex-col">
            <Calendar />
          </main>

          <footer className="py-3 px-4 text-center text-gray-600 text-sm">
            <p>TempoScribe Planner - Manage your schedule with ease</p>
          </footer>
        </CalendarProvider>
      </AuthProvider>
      
      <Toaster />
    </div>
  );
};

export default Index;
