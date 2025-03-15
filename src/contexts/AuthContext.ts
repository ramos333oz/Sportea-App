import { createContext } from 'react';

type User = {
  id: string;
  email: string;
  user_metadata?: {
    username?: string;
    full_name?: string;
  };
} | null;

type AuthContextType = {
  isSignedIn: boolean;
  user: User;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
};

// Create a context with default values
const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  user: null,
  signIn: async () => ({ success: false, error: 'Not implemented' }),
  signUp: async () => ({ success: false, error: 'Not implemented' }),
  signOut: async () => ({ success: false, error: 'Not implemented' }),
  resetPassword: async () => ({ success: false, error: 'Not implemented' }),
});

export default AuthContext; 