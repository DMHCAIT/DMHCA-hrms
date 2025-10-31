import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { HRProvider } from '../contexts/HRContext';
import { apiService } from '../services/api';
import { Alert, CircularProgress, Box, Typography } from '@mui/material';

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider = ({ children }: DataProviderProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Testing Supabase connection and database setup...');

      // Test basic connection first
      await apiService.getHealthCheck();
      console.log('✅ Basic Supabase connection successful');
      
      // Test if tables exist by trying to fetch data
      try {
        const branches = await apiService.getBranches();
        console.log('📍 Branches loaded:', branches?.data?.length || 0, 'records');
        
        const departments = await apiService.getDepartments();
        console.log('🏢 Departments loaded:', departments?.data?.length || 0, 'records');

        const employees = await apiService.getEmployees();
        console.log('👥 Employees loaded:', employees?.data?.length || 0, 'records');

        console.log('✅ All database tables are accessible!');
        
      } catch (tableError: any) {
        if (tableError.message.includes('relation') || 
            tableError.message.includes('does not exist') ||
            tableError.message.includes('table')) {
          throw new Error('DATABASE_SETUP_REQUIRED');
        }
        throw tableError;
      }

    } catch (err: any) {
      let errorMessage = 'Failed to connect to Supabase database';
      
      if (err.message === 'DATABASE_SETUP_REQUIRED') {
        errorMessage = 'Database tables not found. Please run the setup SQL in Supabase Dashboard to create the required tables and sample data.';
      } else if (err.message.includes('Invalid API key')) {
        errorMessage = 'Invalid Supabase API key. Please check your Supabase configuration.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and Supabase service status.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('❌ Supabase connection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="100vh"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading HR System...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Connecting to Supabase database and loading data
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="100vh"
        p={3}
      >
        <Alert 
          severity="error" 
          sx={{ mb: 2, maxWidth: 600 }}
          action={
            <button 
              onClick={checkConnection}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'inherit', 
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          }
        >
          <Typography variant="h6" gutterBottom>
            Failed to Connect to Supabase Database
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {error.includes('table') || error.includes('schema') ? 
              'Please run the SQL setup script in your Supabase Dashboard first. Check SUPABASE_SETUP.md for instructions.' :
              'Please check your Supabase configuration and internet connection.'
            }
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <HRProvider>
      {children}
    </HRProvider>
  );
};