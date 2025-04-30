
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserCredentials, UserPreferences, AuthState, AuthContextType } from '@/types/auth';
import { saveAuthToken, getAuthToken, removeAuthToken, saveUser, getUser, removeUser } from '@/utils/storage-utils';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

// Mock API functions - replace with actual API calls when backend is available
const mockLogin = async (credentials: UserCredentials): Promise<{ user: User; token: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For demo, just check if email is registered in localStorage
  const storedUser = localStorage.getItem(`user_${credentials.email}`);
  
  if (storedUser) {
    const user = JSON.parse(storedUser);
    // Very basic password check - NEVER do this in production!
    if (localStorage.getItem(`pwd_${credentials.email}`) === credentials.password) {
      user.lastLogin = new Date();
      localStorage.setItem(`user_${credentials.email}`, JSON.stringify(user));
      return { user, token: `mock-token-${uuidv4()}` };
    }
  }
  
  throw new Error('Invalid email or password');
};

const mockRegister = async (credentials: UserCredentials, userData?: Partial<User>): Promise<{ user: User; token: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if user already exists
  if (localStorage.getItem(`user_${credentials.email}`)) {
    throw new Error('Email already registered');
  }
  
  // Create new user
  const now = new Date();
  const user: User = {
    id: uuidv4(),
    email: credentials.email,
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    createdAt: now,
    lastLogin: now,
    preferences: userData?.preferences || {},
  };
  
  // Store user and password (NEVER do this in production!)
  localStorage.setItem(`user_${credentials.email}`, JSON.stringify(user));
  localStorage.setItem(`pwd_${credentials.email}`, credentials.password);
  
  return { user, token: `mock-token-${uuidv4()}` };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const token = getAuthToken();
    const user = getUser();
    
    if (token && user) {
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (credentials: UserCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { user, token } = await mockLogin(credentials);
      
      // Save to localStorage
      saveAuthToken(token);
      saveUser(user);
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      toast({
        title: 'Login successful',
        description: `Welcome back, ${user.firstName || user.email}!`,
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }));
      
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An error occurred during login',
        variant: 'destructive',
      });
    }
  };

  const register = async (credentials: UserCredentials, userData?: Partial<User>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { user, token } = await mockRegister(credentials, userData);
      
      // Save to localStorage
      saveAuthToken(token);
      saveUser(user);
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      toast({
        title: 'Registration successful',
        description: `Welcome to TempoScribe, ${user.firstName || user.email}!`,
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      }));
      
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An error occurred during registration',
        variant: 'destructive',
      });
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear localStorage
      removeAuthToken();
      removeUser();
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      
      toast({
        title: 'Logout successful',
        description: 'You have been logged out',
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Logout failed' 
      }));
      
      toast({
        title: 'Logout failed',
        description: error instanceof Error ? error.message : 'An error occurred during logout',
        variant: 'destructive',
      });
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      if (!state.user) {
        throw new Error('No user logged in');
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const updatedUser = {
        ...state.user,
        ...userData,
      };
      
      // Update in localStorage
      saveUser(updatedUser);
      
      setState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }));
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Profile update failed' 
      }));
      
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'An error occurred while updating your profile',
        variant: 'destructive',
      });
    }
  };

  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      if (!state.user) {
        throw new Error('No user logged in');
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = {
        ...state.user,
        preferences: {
          ...state.user.preferences,
          ...preferences,
        },
      };
      
      // Update in localStorage
      saveUser(updatedUser);
      
      setState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }));
      
      toast({
        title: 'Preferences updated',
        description: 'Your preferences have been updated successfully',
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Preferences update failed' 
      }));
      
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'An error occurred while updating your preferences',
        variant: 'destructive',
      });
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
