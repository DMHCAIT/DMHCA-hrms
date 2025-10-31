import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Paper,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,

  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search,

  Login,
  Logout,
  Refresh,
} from '@mui/icons-material';
import { supabaseService } from '../services/supabase';

interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  department_id?: number;
  position: string;
}

interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  location?: string;
  total_hours?: number;
  employees?: Employee;
}

interface AttendanceStats {
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
}

const Attendance: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [action, setAction] = useState<'checkin' | 'checkout' | null>(null);
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0
  });
  const [snackbar, setSnackbar] = useState<{ 
    open: boolean; 
    message: string; 
    severity: 'success' | 'error' | 'info' 
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [employeesResponse, attendanceResponse] = await Promise.all([
        supabaseService.getEmployees(),
        supabaseService.getAttendance({ date: selectedDate })
      ]);

      const employeesData = employeesResponse.data || [];
      const attendanceData = attendanceResponse.data || [];

      setEmployees(employeesData);
      setAttendance(attendanceData);
      
      // Calculate stats
      calculateStats(employeesData, attendanceData);
    } catch (err) {
      console.error('Error loading attendance data:', err);
      setError('Failed to load attendance data. Please try again.');
      showSnackbar('Failed to load attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (employeesData: Employee[], attendanceData: AttendanceRecord[]) => {
    const totalEmployees = employeesData.length;
    const present = attendanceData.filter(record => record.status === 'Present').length;
    const absent = attendanceData.filter(record => record.status === 'Absent').length;
    const late = attendanceData.filter(record => record.status === 'Late').length;
    const onLeave = attendanceData.filter(record => record.status === 'On Leave').length;

    setStats({
      totalEmployees,
      present,
      absent,
      late,
      onLeave
    });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAction = (employeeId: number, actionType: 'checkin' | 'checkout') => {
    setSelectedEmployee(employeeId);
    setAction(actionType);
    setOpenDialog(true);
  };

  const executeAction = async () => {
    if (!selectedEmployee || !action) return;

    try {
      setActionLoading(true);

      if (action === 'checkin') {
        await supabaseService.checkIn(selectedEmployee, 'Office');
        showSnackbar('Check-in successful', 'success');
      } else {
        await supabaseService.checkOut(selectedEmployee, 'Office');
        showSnackbar('Check-out successful', 'success');
      }

      setOpenDialog(false);
      loadData(); // Reload data to reflect changes
    } catch (err) {
      console.error('Error performing action:', err);
      showSnackbar(
        err instanceof Error ? err.message : 'Failed to perform action',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getEmployeeAttendance = (employeeId: number) => {
    return attendance.find(record => record.employee_id === employeeId);
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

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateWorkingHours = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn) return '-';
    if (!checkOut) {
      const now = new Date();
      const checkInTime = new Date(checkIn);
      const hours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      return `${hours.toFixed(1)}h (ongoing)`;
    }
    
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    const hours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    return `${hours.toFixed(1)}h`;
  };

  const filteredEmployees = employees.filter(employee =>
    `${employee.first_name} ${employee.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Attendance Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            label="Date"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <IconButton onClick={loadData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Total Employees
            </Typography>
            <Typography variant="h4" component="div">
              {stats.totalEmployees}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Present
            </Typography>
            <Typography variant="h4" component="div" color="success.main">
              {stats.present}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Absent
            </Typography>
            <Typography variant="h4" component="div" color="error.main">
              {stats.absent}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Late
            </Typography>
            <Typography variant="h4" component="div" color="warning.main">
              {stats.late}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              On Leave
            </Typography>
            <Typography variant="h4" component="div" color="info.main">
              {stats.onLeave}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content */}
      <Card>
        <CardContent>
          {/* Search and Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Employee</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Check In</TableCell>
                    <TableCell>Check Out</TableCell>
                    <TableCell>Working Hours</TableCell>
                    {isToday && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.map((employee) => {
                    const attendanceRecord = getEmployeeAttendance(employee.id);
                    const status = attendanceRecord?.status || 'Absent';
                    
                    return (
                      <TableRow key={employee.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {employee.first_name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {employee.first_name} {employee.last_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {employee.employee_id} • {employee.position}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status}
                            color={getStatusColor(status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {formatTime(attendanceRecord?.check_in || null)}
                        </TableCell>
                        <TableCell>
                          {formatTime(attendanceRecord?.check_out || null)}
                        </TableCell>
                        <TableCell>
                          {calculateWorkingHours(
                            attendanceRecord?.check_in || null,
                            attendanceRecord?.check_out || null
                          )}
                        </TableCell>
                        {isToday && (
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {!attendanceRecord?.check_in ? (
                                <Tooltip title="Check In">
                                  <IconButton
                                    color="success"
                                    size="small"
                                    onClick={() => handleAction(employee.id, 'checkin')}
                                    disabled={actionLoading}
                                  >
                                    <Login />
                                  </IconButton>
                                </Tooltip>
                              ) : !attendanceRecord?.check_out ? (
                                <Tooltip title="Check Out">
                                  <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() => handleAction(employee.id, 'checkout')}
                                    disabled={actionLoading}
                                  >
                                    <Logout />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Chip 
                                  label="Completed" 
                                  color="success" 
                                  size="small" 
                                  variant="outlined" 
                                />
                              )}
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                  {filteredEmployees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isToday ? 6 : 5} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                          No employees found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {action === 'checkin' ? 'Check In' : 'Check Out'} Confirmation
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {action === 'checkin' ? 'check in' : 'check out'}{' '}
            {selectedEmployee && employees.find(e => e.id === selectedEmployee) && 
              `${employees.find(e => e.id === selectedEmployee)?.first_name} 
               ${employees.find(e => e.id === selectedEmployee)?.last_name}`}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={executeAction} 
            variant="contained" 
            disabled={actionLoading}
            color={action === 'checkin' ? 'success' : 'error'}
          >
            {actionLoading ? (
              <CircularProgress size={20} />
            ) : (
              action === 'checkin' ? 'Check In' : 'Check Out'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Attendance;