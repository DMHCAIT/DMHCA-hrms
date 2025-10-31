import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  AccessTime,
  Today,
  Assignment,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface AttendanceRecord {
  id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: 'present' | 'absent' | 'late';
  hours_worked: number | null;
}

const EmployeeDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      fetchEmployeeAttendance();
    }
  }, [profile]);

  const fetchEmployeeAttendance = async () => {
    try {
      setLoading(true);
      
      // Get last 30 days of attendance for the current employee
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('attendance_machine_logs')
        .select('*')
        .eq('employee_id', profile?.employee_id)
        .gte('timestamp', thirtyDaysAgo.toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        setError('Failed to load attendance records');
        console.error('Error fetching attendance:', error);
        return;
      }

      // Process the attendance data
      const processedRecords: AttendanceRecord[] = data?.map((record) => ({
        id: record.id,
        date: new Date(record.timestamp).toLocaleDateString(),
        check_in_time: record.check_in_time,
        check_out_time: record.check_out_time,
        status: record.status || 'present',
        hours_worked: record.hours_worked,
      })) || [];

      setAttendanceRecords(processedRecords);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle />;
      case 'late': return <AccessTime />;
      case 'absent': return <Cancel />;
      default: return <Assignment />;
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const calculateStats = () => {
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
    const lateDays = attendanceRecords.filter(r => r.status === 'late').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
    const totalHours = attendanceRecords.reduce((sum, r) => sum + (r.hours_worked || 0), 0);

    return { totalDays, presentDays, lateDays, absentDays, totalHours };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Unable to load employee profile
      </Alert>
    );
  }

  const stats = calculateStats();

  return (
    <Box sx={{ p: 3 }}>
      {/* Employee Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{ 
                width: 80, 
                height: 80, 
                mr: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <Person sx={{ fontSize: 40 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {profile.first_name} {profile.last_name}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {profile.position} • {profile.department}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip 
                  label={`ID: ${profile.employee_id}`} 
                  size="small" 
                  variant="outlined" 
                />
                <Chip 
                  label={profile.role} 
                  size="small" 
                  color="primary" 
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Attendance Statistics */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3, 
          mb: 3,
          '& > *': { 
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
            minWidth: 200 
          }
        }}
      >
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Today color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div">
              {stats.totalDays}
            </Typography>
            <Typography color="text.secondary">
              Total Days
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div" color="success.main">
              {stats.presentDays}
            </Typography>
            <Typography color="text.secondary">
              Present Days
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <AccessTime color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div" color="warning.main">
              {stats.lateDays}
            </Typography>
            <Typography color="text.secondary">
              Late Days
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Assignment color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div" color="info.main">
              {stats.totalHours.toFixed(1)}h
            </Typography>
            <Typography color="text.secondary">
              Total Hours
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Attendance Records Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Recent Attendance Records
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {attendanceRecords.length === 0 ? (
            <Alert severity="info">
              No attendance records found for the last 30 days.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Check In</TableCell>
                    <TableCell>Check Out</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {record.date}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatTime(record.check_in_time)}</TableCell>
                      <TableCell>{formatTime(record.check_out_time)}</TableCell>
                      <TableCell>
                        {record.hours_worked ? `${record.hours_worked.toFixed(1)}h` : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(record.status)}
                          label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          color={getStatusColor(record.status) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeDashboard;