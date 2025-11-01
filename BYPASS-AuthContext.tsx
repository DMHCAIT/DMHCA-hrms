// TEMPORARY AUTH BYPASS FOR TESTING
// Replace AuthContext.tsx content with this for immediate login access

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
  user: User | null;
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // BYPASS: Auto-login with demo admin user
  useEffect(() => {
    // Simulate logged in admin user
    const demoUser = {
      id: 'demo-admin-id',
      email: 'admin@dmhca.in',
      aud: 'authenticated',
      role: 'authenticated'
    } as User;

    const demoProfile: UserProfile = {
      id: 'demo-admin-id',
      employee_id: 'ADMIN001',
      first_name: 'System',
      last_name: 'Administrator',
      email: 'admin@dmhca.in',
      role: 'admin',
      department: 'Administration',
      position: 'System Administrator'
    };

    setUser(demoUser);
    setProfile(demoProfile);
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // BYPASS: Accept any admin email with correct password
    if (email.includes('admin') && password === 'Admin@123') {
      const demoUser = {
        id: 'demo-admin-id',
        email: email,
        aud: 'authenticated',
        role: 'authenticated'
      } as User;

      const demoProfile: UserProfile = {
        id: 'demo-admin-id',
        employee_id: 'ADMIN001',
        first_name: 'System',
        last_name: 'Administrator',
        email: email,
        role: 'admin',
        department: 'Administration',
        position: 'System Administrator'
      };

      setUser(demoUser);
      setProfile(demoProfile);
      
      return { data: { user: demoUser } };
    }
    
    // For other emails, try regular Supabase auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (data?.user) {
        setUser(data.user);
        // Try to fetch profile from employees table
        const { data: employeeData } = await supabase
          .from('employees')
          .select('*')
          .eq('email', email)
          .single();

        if (employeeData) {
          setProfile({
            id: data.user.id,
            employee_id: employeeData.employee_id,
            first_name: employeeData.first_name,
            last_name: employeeData.last_name,
            email: employeeData.email,
            role: employeeData.role || 'employee',
            department: employeeData.department,
            position: employeeData.position,
            phone: employeeData.phone,
            avatar_url: employeeData.avatar_url,
          });
        }
      }

      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === 'admin';
  const isEmployee = profile?.role === 'employee';

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin,
    isEmployee,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};