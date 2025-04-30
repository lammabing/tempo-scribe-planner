
export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  createdAt: Date;
  lastLogin: Date;
  preferences?: UserPreferences;
};

export type UserCredentials = {
  email: string;
  password: string;
};

export type UserPreferences = {
  theme?: string;
  defaultView?: string;
  startDayOfWeek?: number;
  workingHours?: {
    start: string;
    end: string;
  };
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

export type AuthContextType = AuthState & {
  login: (credentials: UserCredentials) => Promise<void>;
  register: (credentials: UserCredentials, userData?: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  clearError: () => void;
};
