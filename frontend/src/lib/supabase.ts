import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ocvtacsuwkwzbpwnmlsd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdnRhY3N1d2t3emJwd25tbHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDc3MjYsImV4cCI6MjA3Njg4MzcyNn0.JJTuluIEZfVhFTonnaXCkiuzoD5AHZs0S_MjqdEn1DA';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript support
export interface Database {
  public: {
    Tables: {
      branches: {
        Row: {
          id: number;
          name: string;
          location: string;
          manager: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          location: string;
          manager: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          location?: string;
          manager?: string;
          created_at?: string;
        };
      };
      departments: {
        Row: {
          id: number;
          name: string;
          branch_id: number;
          head: string;
          employee_count: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          branch_id: number;
          head: string;
          employee_count?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          branch_id?: number;
          head?: string;
          employee_count?: number;
          created_at?: string;
        };
      };
      employees: {
        Row: {
          id: number;
          employee_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          department_id: number;
          branch_id: number;
          position: string;
          salary: number;
          date_of_joining: string;
          manager_id: number | null;
          status: string;
          address: string;
          emergency_contact_name: string;
          emergency_contact_phone: string;
          emergency_contact_relationship: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          employee_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          department_id: number;
          branch_id: number;
          position: string;
          salary: number;
          date_of_joining: string;
          manager_id?: number | null;
          status?: string;
          address: string;
          emergency_contact_name: string;
          emergency_contact_phone: string;
          emergency_contact_relationship: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          employee_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          department_id?: number;
          branch_id?: number;
          position?: string;
          salary?: number;
          date_of_joining?: string;
          manager_id?: number | null;
          status?: string;
          address?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          emergency_contact_relationship?: string;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: number;
          employee_id: number;
          date: string;
          check_in: string | null;
          check_out: string | null;
          total_hours: number | null;
          status: string;
          location: string | null;
          ip_address: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          employee_id: number;
          date: string;
          check_in?: string | null;
          check_out?: string | null;
          total_hours?: number | null;
          status?: string;
          location?: string | null;
          ip_address?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          employee_id?: number;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          total_hours?: number | null;
          status?: string;
          location?: string | null;
          ip_address?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      leaves: {
        Row: {
          id: number;
          employee_id: number;
          leave_type: string;
          start_date: string;
          end_date: string;
          days: number;
          reason: string;
          status: string;
          applied_on: string;
          approved_by: number | null;
          approved_on: string | null;
          rejection_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          employee_id: number;
          leave_type: string;
          start_date: string;
          end_date: string;
          days: number;
          reason: string;
          status?: string;
          applied_on?: string;
          approved_by?: number | null;
          approved_on?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          employee_id?: number;
          leave_type?: string;
          start_date?: string;
          end_date?: string;
          days?: number;
          reason?: string;
          status?: string;
          applied_on?: string;
          approved_by?: number | null;
          approved_on?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
        };
      };
      attendance_machines: {
        Row: {
          id: number;
          machine_id: string;
          ip_address: string | null;
          port: number | null;
          protocol: string | null;
          location: string;
          is_active: boolean;
          serial_number: string | null;
          cloud_id: string | null;
          cloud_service: string | null;
          device_password: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          machine_id: string;
          ip_address?: string | null;
          port?: number | null;
          protocol?: string | null;
          location: string;
          is_active?: boolean;
          serial_number?: string | null;
          cloud_id?: string | null;
          cloud_service?: string | null;
          device_password?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          machine_id?: string;
          ip_address?: string | null;
          port?: number | null;
          protocol?: string | null;
          location?: string;
          is_active?: boolean;
          serial_number?: string | null;
          cloud_id?: string | null;
          cloud_service?: string | null;
          device_password?: string | null;
          created_at?: string;
        };
      };
      attendance_machine_logs: {
        Row: {
          id: number;
          user_id: string;
          machine_id: string;
          timestamp: string;
          log_type: string;
          raw_data: any | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          machine_id: string;
          timestamp: string;
          log_type: string;
          raw_data?: any | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          machine_id?: string;
          timestamp?: string;
          log_type?: string;
          raw_data?: any | null;
          created_at?: string;
        };
      };
    };
  };
}

// Typed Supabase client
export type SupabaseClient = typeof supabase;