import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  AccessTime,
  TrendingUp,
  Assignment,
  Person,
} from '@mui/icons-material';
import { supabaseService } from '../services/supabase';
import { supabase } from '../lib/supabase';

interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string;
  department_id?: number;
}

interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  total_hours: number | null;
  status: string;
  employees?: Employee;
}

interface TimeStats {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  daysWorked: number;
  averageHoursPerDay: number;
}

const TimeTracking: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [timeStats, setTimeStats] = useState<TimeStats>({
    totalHours: 0,
    regularHours: 0,
    overtimeHours: 0,
    daysWorked: 0,
    averageHoursPerDay: 0
  });

  useEffect(() => {
    loadData();
  }, [selectedEmployee, selectedPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [employeesResponse, attendanceResponse] = await Promise.all([
        supabaseService.getEmployees(),
        getAttendanceForPeriod()
      ]);

      setEmployees(employeesResponse.data || []);
      setAttendance(attendanceResponse);
      calculateStats(attendanceResponse);

    } catch (err) {
      console.error('Error loading time tracking data:', err);
      setError('Failed to load time tracking data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceForPeriod = async () => {
    // For date range queries, we need to use the supabase client directly
    let query = supabase
      .from('attendance')
      .select(`
        *,
        employees:employee_id(first_name, last_name, employee_id)
      `)
      .order('date', { ascending: false });
    
    if (selectedEmployee) {
      query = query.eq('employee_id', selectedEmployee);
    }

    if (selectedPeriod === 'today') {
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('date', today);
    } else if (selectedPeriod === 'week') {
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      query = query.gte('date', weekStart.toISOString().split('T')[0]);
    } else if (selectedPeriod === 'month') {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      query = query.gte('date', monthStart.toISOString().split('T')[0]);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const calculateStats = (attendanceData: AttendanceRecord[]) => {
    const stats: TimeStats = {
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      daysWorked: attendanceData.filter(record => record.total_hours && record.total_hours > 0).length,
      averageHoursPerDay: 0
    };

    attendanceData.forEach(record => {
      if (record.total_hours && record.total_hours > 0) {
        stats.totalHours += record.total_hours;
        if (record.total_hours <= 8) {
          stats.regularHours += record.total_hours;
        } else {
          stats.regularHours += 8;
          stats.overtimeHours += (record.total_hours - 8);
        }
      }
    });

    if (stats.daysWorked > 0) {
      stats.averageHoursPerDay = stats.totalHours / stats.daysWorked;
    }

    setTimeStats(stats);
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatHours = (hours: number | null) => {
    if (!hours) return '0.0h';
    return `${hours.toFixed(1)}h`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'success';
      case 'Absent': return 'error';
      case 'Late': return 'warning';
      case 'On Leave': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Time Tracking & Analytics
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel>Employee</InputLabel>
          <Select
            value={selectedEmployee || ''}
            label="Employee"
            onChange={(e) => setSelectedEmployee(e.target.value ? Number(e.target.value) : null)}
          >
            <MenuItem value="">All Employees</MenuItem>
            {employees.map((employee) => (
              <MenuItem key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name} ({employee.employee_id})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={selectedPeriod}
            label="Time Period"
            onChange={(e) => setSelectedPeriod(e.target.value as 'today' | 'week' | 'month')}
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <AccessTime sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography color="textSecondary" gutterBottom>
              Total Hours
            </Typography>
            <Typography variant="h4" component="div">
              {formatHours(timeStats.totalHours)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Assignment sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography color="textSecondary" gutterBottom>
              Regular Hours
            </Typography>
            <Typography variant="h4" component="div" color="success.main">
              {formatHours(timeStats.regularHours)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingUp sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography color="textSecondary" gutterBottom>
              Overtime Hours
            </Typography>
            <Typography variant="h4" component="div" color="warning.main">
              {formatHours(timeStats.overtimeHours)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Person sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography color="textSecondary" gutterBottom>
              Days Worked
            </Typography>
            <Typography variant="h4" component="div" color="info.main">
              {timeStats.daysWorked}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Avg: {formatHours(timeStats.averageHoursPerDay)}/day
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Detailed Time Records */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Detailed Time Records
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Total Hours</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {record.employees?.first_name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {record.employees?.first_name} {record.employees?.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {record.employees?.employee_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(record.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {formatTime(record.check_in)}
                    </TableCell>
                    <TableCell>
                      {formatTime(record.check_out)}
                    </TableCell>
                    <TableCell>
                      <Typography 
                        sx={{ 
                          fontWeight: 'bold',
                          color: (record.total_hours || 0) > 8 ? 'warning.main' : 'inherit'
                        }}
                      >
                        {formatHours(record.total_hours)}
                      </Typography>
                      {(record.total_hours || 0) > 8 && (
                        <Typography variant="caption" sx={{ color: 'warning.main', display: 'block' }}>
                          +{formatHours((record.total_hours || 0) - 8)} OT
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        color={getStatusColor(record.status) as any}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {attendance.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        No time records found for the selected period
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TimeTracking;