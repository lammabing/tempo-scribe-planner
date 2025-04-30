
export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  lastLogin: Date;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};
