// MOCK AUTH CONTEXT - NO LOGIN REQUIRED
// This provides dummy auth data so existing components don't break

import React, { createContext, useContext } from 'react';

interface UserProfile {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'employee';
  department?: string;
  position?: string;
  phone?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return mock data instead of throwing error
    return {
      user: { id: 'mock-admin', email: 'admin@dmhca.in' },
      profile: {
        id: 'mock-admin',
        employee_id: 'ADMIN001',
        first_name: 'System',
        last_name: 'Administrator',
        email: 'admin@dmhca.in',
        role: 'admin' as const,
        department: 'Administration',
        position: 'System Administrator'
      },
      loading: false,
      signIn: async () => ({ data: { success: true } }),
      signOut: async () => {},
      isAdmin: true,
      isEmployee: false,
    };
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Provide mock admin data
  const mockProfile: UserProfile = {
    id: 'mock-admin',
    employee_id: 'ADMIN001',
    first_name: 'System',
    last_name: 'Administrator',
    email: 'admin@dmhca.in',
    role: 'admin',
    department: 'Administration',
    position: 'System Administrator'
  };

  const value: AuthContextType = {
    user: { id: 'mock-admin', email: 'admin@dmhca.in' },
    profile: mockProfile,
    loading: false,
    signIn: async () => ({ data: { success: true } }),
    signOut: async () => {},
    isAdmin: true,
    isEmployee: false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};