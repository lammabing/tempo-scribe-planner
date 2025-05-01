
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserCredentials, UserPreferences, AuthState, AuthContextType } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

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
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (session) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
          }

          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            firstName: profile?.first_name || '',
            lastName: profile?.last_name || '',
            createdAt: profile ? new Date(profile.created_at) : new Date(),
            lastLogin: profile ? new Date(profile.last_login) : new Date(),
            preferences: profile?.preferences || {},
          };

          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Session check error:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Update the profile's last_login time
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', session.user.id);

        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: profile?.first_name || '',
          lastName: profile?.last_name || '',
          createdAt: profile ? new Date(profile.created_at) : new Date(),
          lastLogin: new Date(),
          preferences: profile?.preferences || {},
        };

        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: UserCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) throw error;
      
      if (!data.user) throw new Error('User not found');

      toast({
        title: 'Login successful',
        description: `Welcome back!`,
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');
      
      // Create user profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: authData.user.email || '',
        first_name: userData?.firstName || '',
        last_name: userData?.lastName || '',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        preferences: userData?.preferences || {},
      });
      
      if (profileError) throw profileError;
      
      toast({
        title: 'Registration successful',
        description: `Welcome to TempoScribe!`,
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
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
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
      
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: userData.firstName,
          last_name: userData.lastName,
        })
        .eq('id', state.user.id);
      
      if (error) throw error;
      
      // Update local state with new profile data
      const updatedUser = {
        ...state.user,
        ...userData,
      };
      
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
      
      // Get current preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', state.user.id)
        .single();
      
      const currentPreferences = profile?.preferences || {};
      
      // Merge with new preferences
      const updatedPreferences = {
        ...currentPreferences,
        ...preferences,
      };
      
      // Update in database
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: updatedPreferences,
        })
        .eq('id', state.user.id);
      
      if (error) throw error;
      
      // Update local state
      const updatedUser = {
        ...state.user,
        preferences: updatedPreferences,
      };
      
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
