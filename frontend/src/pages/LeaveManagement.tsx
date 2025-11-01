import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  LinearProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Stack
} from '@mui/material';
import {
  ArrowForward,
  CalendarToday,
  People,
  CheckCircle,
  Schedule,
  Warning,
  Add,
  Visibility
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Interface definitions
interface LeaveBalance {
  employee_id: string;
  employee_name: string;
  leave_type: string;
  allocated: number;
  used: number;
  remaining: number;
  carried_forward?: number;
}

interface LeaveApplication {
  id: string;
  employee_id: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  applied_date: string;
}

const LeaveManagement: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Form states for new leave application
  const [newLeave, setNewLeave] = useState({
    employee_id: '',
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load employees
      const { data: employeesData } = await supabase
        .from('employees')
        .select('employee_id, first_name, last_name, email, status')
        .eq('status', 'Active');
      
      setEmployees(employeesData || []);
      
      // Generate demo leave balances
      const demoLeaveBalances = generateDemoLeaveBalances(employeesData || []);
      setLeaveBalances(demoLeaveBalances);
      
      // Generate demo leave applications
      const demoApplications = generateDemoApplications(employeesData || []);
      setLeaveApplications(demoApplications);
      
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const generateDemoLeaveBalances = (employees: any[]): LeaveBalance[] => {
    const leaveTypes = ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Emergency Leave'];
    const balances: LeaveBalance[] = [];
    
    employees.forEach(emp => {
      leaveTypes.forEach(type => {
        const allocated = type === 'Annual Leave' ? 21 : type === 'Sick Leave' ? 12 : 5;
        const used = Math.floor(Math.random() * (allocated * 0.7));
        balances.push({
          employee_id: emp.employee_id,
          employee_name: `${emp.first_name} ${emp.last_name}`,
          leave_type: type,
          allocated,
          used,
          remaining: allocated - used,
          carried_forward: type === 'Annual Leave' ? Math.floor(Math.random() * 5) : 0
        });
      });
    });
    
    return balances;
  };

  const generateDemoApplications = (employees: any[]): LeaveApplication[] => {
    const leaveTypes = ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Emergency Leave'];
    const statuses: ('pending' | 'approved' | 'rejected')[] = ['pending', 'approved', 'rejected'];
    const applications: LeaveApplication[] = [];
    
    employees.forEach((emp) => {
      for (let i = 0; i < 3; i++) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + Math.random() * 60);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);
        
        applications.push({
          id: `${emp.employee_id}-${i}`,
          employee_id: emp.employee_id,
          employee_name: `${emp.first_name} ${emp.last_name}`,
          leave_type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          days: Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          reason: 'Personal reasons',
          applied_date: new Date().toISOString().split('T')[0]
        });
      }
    });
    
    return applications.slice(0, 15); // Limit to 15 applications
  };

  const handleSubmitLeave = () => {
    // Add new leave application
    const days = Math.floor((new Date(newLeave.end_date).getTime() - new Date(newLeave.start_date).getTime()) / (1000 * 3600 * 24)) + 1;
    const employee = employees.find(emp => emp.employee_id === newLeave.employee_id);
    
    if (employee) {
      const newApplication: LeaveApplication = {
        id: `${newLeave.employee_id}-${Date.now()}`,
        employee_id: newLeave.employee_id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        leave_type: newLeave.leave_type,
        start_date: newLeave.start_date,
        end_date: newLeave.end_date,
        days,
        status: 'pending',
        reason: newLeave.reason,
        applied_date: new Date().toISOString().split('T')[0]
      };
      
      setLeaveApplications([newApplication, ...leaveApplications]);
      setOpenDialog(false);
      setNewLeave({ employee_id: '', leave_type: '', start_date: '', end_date: '', reason: '' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'pending': return <Schedule />;
      case 'rejected': return <Warning />;
      default: return <Schedule />;
    }
  };

  // Calculate summary stats
  const totalEmployees = employees.length;
  const totalApplications = leaveApplications.length;
  const pendingApplications = leaveApplications.filter(app => app.status === 'pending').length;
  const approvedApplications = leaveApplications.filter(app => app.status === 'approved').length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Leave Management Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          sx={{ bgcolor: 'primary.main' }}
        >
          Apply for Leave
        </Button>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
        gap: 3, 
        mb: 4 
      }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Total Employees
                </Typography>
                <Typography variant="h4" component="div">
                  {totalEmployees}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <People />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Total Applications
                </Typography>
                <Typography variant="h4" component="div">
                  {totalApplications}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <CalendarToday />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Pending Approval
                </Typography>
                <Typography variant="h4" component="div">
                  {pendingApplications}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <Schedule />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Approved Today
                </Typography>
                <Typography variant="h4" component="div">
                  {approvedApplications}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <CheckCircle />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Leave Applications" />
          <Tab label="Leave Balances" />
          <Tab label="Advanced Features" />
        </Tabs>

        {/* Leave Applications Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Employee</strong></TableCell>
                    <TableCell><strong>Leave Type</strong></TableCell>
                    <TableCell><strong>Start Date</strong></TableCell>
                    <TableCell><strong>End Date</strong></TableCell>
                    <TableCell><strong>Days</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Applied</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaveApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {application.employee_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {application.employee_id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{application.leave_type}</TableCell>
                      <TableCell>{new Date(application.start_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(application.end_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip label={`${application.days} days`} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(application.status)}
                          label={application.status.toUpperCase()}
                          color={getStatusColor(application.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(application.applied_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="small" startIcon={<Visibility />}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Leave Balances Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Employee</strong></TableCell>
                    <TableCell><strong>Leave Type</strong></TableCell>
                    <TableCell><strong>Allocated</strong></TableCell>
                    <TableCell><strong>Used</strong></TableCell>
                    <TableCell><strong>Remaining</strong></TableCell>
                    <TableCell><strong>Carried Forward</strong></TableCell>
                    <TableCell><strong>Usage %</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaveBalances.map((balance, index) => (
                    <TableRow key={`${balance.employee_id}-${balance.leave_type}-${index}`}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {balance.employee_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {balance.employee_id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={balance.leave_type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{balance.allocated}</TableCell>
                      <TableCell>{balance.used}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {balance.remaining}
                          </Typography>
                          <Typography variant="caption">days</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{balance.carried_forward || 0}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={(balance.used / balance.allocated) * 100}
                            sx={{ flex: 1, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption">
                            {Math.round((balance.used / balance.allocated) * 100)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Advanced Features Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
              gap: 3 
            }}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white',
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s ease' }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Basic Leave System
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Simple leave requests and approvals with basic functionality.
                  </Typography>
                  <Alert severity="warning" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
                    Limited features available
                  </Alert>
                </CardContent>
              </Card>
              
              <Card sx={{ 
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', 
                color: 'white',
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s ease' }
              }} onClick={() => navigate('/leave-management')}>
                <CardContent sx={ { p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Comprehensive Leave Policies
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Full company policy integration with advanced features.
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label="Policy Integration" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                    <Chip label="Payroll Integration" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                    <Chip label="Analytics" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  </Stack>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      mt: 2,
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                    endIcon={<ArrowForward />}
                  >
                    Access Full System
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Apply for Leave Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Apply for Leave</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
            gap: 2, 
            mt: 1 
          }}>
            <FormControl fullWidth>
              <InputLabel>Employee</InputLabel>
              <Select
                value={newLeave.employee_id}
                onChange={(e) => setNewLeave({...newLeave, employee_id: e.target.value})}
                label="Employee"
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.employee_id} value={emp.employee_id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Leave Type</InputLabel>
              <Select
                value={newLeave.leave_type}
                onChange={(e) => setNewLeave({...newLeave, leave_type: e.target.value})}
                label="Leave Type"
              >
                <MenuItem value="Annual Leave">Annual Leave</MenuItem>
                <MenuItem value="Sick Leave">Sick Leave</MenuItem>
                <MenuItem value="Personal Leave">Personal Leave</MenuItem>
                <MenuItem value="Emergency Leave">Emergency Leave</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={newLeave.start_date}
              onChange={(e) => setNewLeave({...newLeave, start_date: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={newLeave.end_date}
              onChange={(e) => setNewLeave({...newLeave, end_date: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
              <TextField
                fullWidth
                label="Reason"
                multiline
                rows={3}
                value={newLeave.reason}
                onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})}
                placeholder="Please provide reason for leave..."
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitLeave} 
            variant="contained"
            disabled={!newLeave.employee_id || !newLeave.leave_type || !newLeave.start_date || !newLeave.end_date}
          >
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveManagement;
