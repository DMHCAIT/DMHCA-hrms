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
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  LinearProgress,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Add,
  CheckCircle,
  Cancel,
  Schedule,
  Person,
  CalendarToday,
  TrendingUp,
  Warning,
  Assignment,
  AccountBalance,
  School,
  Security,
  Visibility
} from '@mui/icons-material';
import { supabaseService } from '../services/supabase';
import type {
  LeaveApplication,
  LeaveType,
  EmployeeLeaveBalance,
  LeaveCalculationResult
} from '../types/leave.types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`leave-tabpanel-${index}`}
      aria-labelledby={`leave-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ComprehensiveLeaveManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<EmployeeLeaveBalance[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null);
  const [eligibilityCheck, setEligibilityCheck] = useState<LeaveCalculationResult | null>(null);
  
  // Form states
  const [newLeave, setNewLeave] = useState({
    employee_id: '',
    leave_type_id: '',
    start_date: '',
    end_date: '',
    leave_reason: '',
    is_half_day: false,
    is_emergency: false,
    comp_off_date: ''
  });

  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [
        { data: applications },
        { data: types },
        { data: balances },
        { data: employeeList }
      ] = await Promise.all([
        supabaseService.getLeaveApplications(),
        supabaseService.getLeaveTypes(),
        supabaseService.getAllEmployeeLeaveBalances(),
        supabaseService.getEmployees()
      ]);

      setLeaveApplications(applications || []);
      setLeaveTypes(types || []);
      setLeaveBalances(balances || []);
      setEmployees(employeeList || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCheckEligibility = async () => {
    if (!newLeave.employee_id || !newLeave.leave_type_id || !newLeave.start_date || !newLeave.end_date) {
      showNotification('Please fill employee, leave type, and dates', 'error');
      return;
    }

    try {
      const eligibility = await supabaseService.checkLeaveEligibility(
        Number(newLeave.employee_id),
        Number(newLeave.leave_type_id),
        newLeave.start_date,
        newLeave.end_date,
        newLeave.is_half_day
      );

      setEligibilityCheck(eligibility);
    } catch (error: any) {
      showNotification(error.message || 'Error checking eligibility', 'error');
    }
  };

  const handleApplyLeave = async () => {
    if (!newLeave.employee_id || !newLeave.leave_type_id || !newLeave.start_date || 
        !newLeave.end_date || !newLeave.leave_reason) {
      showNotification('Please fill all required fields', 'error');
      return;
    }

    if (eligibilityCheck && !eligibilityCheck.can_approve) {
      showNotification('Please resolve eligibility issues before applying', 'error');
      return;
    }

    try {
      setLoading(true);

      const { data } = await supabaseService.applyForLeave({
        employee_id: Number(newLeave.employee_id),
        leave_type_id: Number(newLeave.leave_type_id),
        start_date: newLeave.start_date,
        end_date: newLeave.end_date,
        leave_reason: newLeave.leave_reason,
        is_half_day: newLeave.is_half_day,
        is_emergency: newLeave.is_emergency,
        comp_off_date: newLeave.comp_off_date || undefined
      });

      setLeaveApplications(prev => [data, ...prev]);
      setOpenDialog(false);
      setNewLeave({
        employee_id: '',
        leave_type_id: '',
        start_date: '',
        end_date: '',
        leave_reason: '',
        is_half_day: false,
        is_emergency: false,
        comp_off_date: ''
      });
      setEligibilityCheck(null);
      
      showNotification('Leave application submitted successfully', 'success');
      fetchInitialData(); // Refresh data
    } catch (error: any) {
      showNotification(error.message || 'Error submitting leave application', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (applicationId: number) => {
    try {
      setLoading(true);
      const { data } = await supabaseService.approveLeaveApplication(applicationId, 1); // Assuming admin user ID = 1
      
      setLeaveApplications(prev => 
        prev.map(app => app.id === applicationId ? data : app)
      );
      
      showNotification('Leave application approved successfully', 'success');
      fetchInitialData(); // Refresh balances
    } catch (error: any) {
      showNotification(error.message || 'Error approving leave application', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectLeave = async (applicationId: number, reason: string) => {
    try {
      setLoading(true);
      const { data } = await supabaseService.rejectLeaveApplication(applicationId, 1, reason);
      
      setLeaveApplications(prev => 
        prev.map(app => app.id === applicationId ? data : app)
      );
      
      showNotification('Leave application rejected', 'success');
    } catch (error: any) {
      showNotification(error.message || 'Error rejecting leave application', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getLeaveTypeIcon = (code: string) => {
    const iconMap: { [key: string]: any } = {
      'CL': CalendarToday,
      'EL': Warning,
      'SL': Person,
      'ML': School,
      'MAR': CheckCircle,
      'PL': AccountBalance,
      'CO': TrendingUp,
      'BL': Security
    };
    const IconComponent = iconMap[code] || CalendarToday;
    return <IconComponent />;
  };

  const filteredApplications = leaveApplications.filter(app => {
    const statusMatch = statusFilter === 'all' || app.status === statusFilter;
    const employeeMatch = !employeeFilter || 
      app.employees?.first_name.toLowerCase().includes(employeeFilter.toLowerCase()) ||
      app.employees?.last_name.toLowerCase().includes(employeeFilter.toLowerCase());
    return statusMatch && employeeMatch;
  });

  if (loading && leaveApplications.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        📋 Comprehensive Leave Management System
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Applications" icon={<Assignment />} />
          <Tab label="Leave Balances" icon={<AccountBalance />} />
          <Tab label="Company Policies" icon={<Security />} />
          <Tab label="Analytics" icon={<TrendingUp />} />
        </Tabs>
      </Box>

      {/* Leave Applications Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Search employee..."
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              sx={{ minWidth: 200 }}
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Apply Leave
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Leave Type</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Applied On</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {application.employees?.first_name} {application.employees?.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {application.employees?.employee_id} • {application.employees?.department}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getLeaveTypeIcon(application.leave_types?.code || '')}
                      <Box>
                        <Typography variant="subtitle2">
                          {application.leave_types?.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          {application.is_emergency && (
                            <Chip label="Emergency" size="small" color="error" />
                          )}
                          {application.is_half_day && (
                            <Chip label="Half Day" size="small" color="info" />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(application.start_date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      to {formatDate(application.end_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" color="primary">
                      {application.total_days} {application.total_days === 1 ? 'day' : 'days'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(application.applied_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={application.status.toUpperCase()} 
                      color={getStatusColor(application.status)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setSelectedApplication(application);
                            setOpenDetailsDialog(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {application.status === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton 
                              color="success" 
                              size="small"
                              onClick={() => handleApproveLeave(application.id)}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton 
                              color="error" 
                              size="small"
                              onClick={() => handleRejectLeave(application.id, 'Rejected by admin')}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredApplications.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No leave applications found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {statusFilter !== 'all' ? 'Try changing the filter' : 'Apply for your first leave'}
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Leave Balances Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" sx={{ mb: 3 }}>💳 Employee Leave Balances</Typography>
        
        <Box sx={{ display: 'grid', gap: 2 }}>
          {employees.map((employee) => {
            const employeeBalances = leaveBalances.filter(b => b.employee_id === employee.id);
            const totalRemaining = employeeBalances.reduce((sum, b) => sum + b.remaining_days, 0);
            
            return (
              <Card key={employee.id} sx={{ '&:hover': { boxShadow: 3 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">
                        {employee.first_name} {employee.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {employee.employee_id} • {employee.department} • {employee.employment_status}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
                        {totalRemaining}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        days remaining
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 1.5 }}>
                    {employeeBalances.map((balance) => {
                      const usagePercent = (balance.used_days / balance.allocated_days) * 100;
                      return (
                        <Box key={balance.id} sx={{ 
                          p: 1.5, 
                          border: 1, 
                          borderColor: 'divider', 
                          borderRadius: 2,
                          backgroundColor: 'background.paper'
                        }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            {balance.leave_types?.name}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">
                              {balance.remaining_days}/{balance.allocated_days}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(usagePercent)}% used
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={usagePercent}
                            color={usagePercent > 80 ? 'error' : usagePercent > 60 ? 'warning' : 'primary'}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </TabPanel>

      {/* Company Policies Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" sx={{ mb: 3 }}>📜 Company Leave Policies & Guidelines</Typography>
        
        <Box sx={{ display: 'grid', gap: 3 }}>
          {/* Training & First Month Policy */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main' }}>
                <School /> Training & First Month Policy
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><Schedule color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Training Period: 10 Days" 
                    secondary="No performance targets apply during initial training"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Warning color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="First Month: No Leaves Permitted" 
                    secondary="Full attendance required for proper onboarding and evaluation"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingUp color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Performance Requirement: Minimum 40% of Monthly Target" 
                    secondary="Failure to achieve results in 50% salary deduction"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Probation Policy */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'warning.main' }}>
                <Security /> Probation Period Policy
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><Schedule color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Duration: 3 Months" 
                    secondary="Comprehensive employee evaluation and training period"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><AccountBalance color="error" /></ListItemIcon>
                  <ListItemText 
                    primary="Contract Bond: 6 Months Salary Amount" 
                    secondary="Payable if employee leaves organization without consent"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Person color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Leave Entitlement" 
                    secondary="Probation: 1 Casual leave/month • Permanent: 1 Casual + 1 Emergency leave/month"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Leave Types Grid */}
          <Typography variant="h6" sx={{ mt: 2 }}>📋 Leave Types & Entitlements</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 2 }}>
            {leaveTypes.map((leaveType) => (
              <Card key={leaveType.id} sx={{ height: 'fit-content' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {getLeaveTypeIcon(leaveType.code)}
                    <Typography variant="h6" color="primary">
                      {leaveType.name}
                    </Typography>
                    <Chip label={leaveType.code} size="small" variant="outlined" />
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {leaveType.max_days_per_year && (
                      <Chip label={`${leaveType.max_days_per_year} days/year`} size="small" color="primary" />
                    )}
                    {leaveType.max_days_per_month && (
                      <Chip label={`${leaveType.max_days_per_month}/month`} size="small" color="info" />
                    )}
                    {leaveType.is_carry_forward && (
                      <Chip label="Carry Forward" size="small" color="success" />
                    )}
                    {leaveType.expiry_days && (
                      <Chip label={`Expires in ${leaveType.expiry_days} days`} size="small" color="warning" />
                    )}
                    {leaveType.gender_specific && (
                      <Chip label={`${leaveType.gender_specific} only`} size="small" color="secondary" />
                    )}
                  </Box>

                  {leaveType.documentation_required && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      📄 Documentation Required
                    </Alert>
                  )}

                  {/* Special Rules */}
                  {leaveType.code === 'ML' && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      26 weeks for first 2 children, 12 weeks for 3rd child
                    </Alert>
                  )}
                  {leaveType.code === 'MAR' && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Once in lifetime benefit
                    </Alert>
                  )}
                  {leaveType.code === 'PL' && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Must be availed within 8 weeks of birth
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" sx={{ mb: 3 }}>📊 Leave Analytics & Statistics</Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 4 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">Total Applications</Typography>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {leaveApplications.length}
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">Pending Approvals</Typography>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {leaveApplications.filter(app => app.status === 'pending').length}
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">Approved This Month</Typography>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {leaveApplications.filter(app => 
                  app.status === 'approved' && 
                  new Date(app.approval_date || '').getMonth() === new Date().getMonth()
                ).length}
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">Total Leave Days Used</Typography>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {leaveApplications
                  .filter(app => app.status === 'approved')
                  .reduce((sum, app) => sum + app.total_days, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Leave Type Usage Chart */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>📈 Leave Type Usage Breakdown</Typography>
            {leaveTypes.map(type => {
              const typeUsage = leaveApplications
                .filter(app => app.status === 'approved' && app.leave_types?.id === type.id)
                .reduce((sum, app) => sum + app.total_days, 0);
              const maxUsage = Math.max(...leaveTypes.map(t => 
                leaveApplications
                  .filter(app => app.status === 'approved' && app.leave_types?.id === t.id)
                  .reduce((sum, app) => sum + app.total_days, 0)
              ));
              const percentage = maxUsage > 0 ? (typeUsage / maxUsage) * 100 : 0;

              return (
                <Box key={type.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{type.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {typeUsage} days used
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={percentage}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              );
            })}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Apply Leave Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          📝 Apply for Leave
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Employee *</InputLabel>
                <Select
                  value={newLeave.employee_id}
                  onChange={(e) => setNewLeave(prev => ({ ...prev, employee_id: e.target.value }))}
                  label="Employee *"
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} - {employee.employee_id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Leave Type *</InputLabel>
                <Select
                  value={newLeave.leave_type_id}
                  onChange={(e) => setNewLeave(prev => ({ ...prev, leave_type_id: e.target.value }))}
                  label="Leave Type *"
                >
                  {leaveTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name} ({type.code}) - {type.max_days_per_year || 'Unlimited'} days/year
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Start Date *"
                type="date"
                value={newLeave.start_date}
                onChange={(e) => setNewLeave(prev => ({ ...prev, start_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="End Date *"
                type="date"
                value={newLeave.end_date}
                onChange={(e) => setNewLeave(prev => ({ ...prev, end_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newLeave.is_half_day}
                    onChange={(e) => setNewLeave(prev => ({ ...prev, is_half_day: e.target.checked }))}
                  />
                }
                label="Half Day Leave"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newLeave.is_emergency}
                    onChange={(e) => setNewLeave(prev => ({ ...prev, is_emergency: e.target.checked }))}
                  />
                }
                label="Emergency Leave"
              />
            </Box>

            <TextField
              label="Leave Reason *"
              multiline
              rows={3}
              value={newLeave.leave_reason}
              onChange={(e) => setNewLeave(prev => ({ ...prev, leave_reason: e.target.value }))}
              fullWidth
              required
              placeholder="Please provide detailed reason for leave..."
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCheckEligibility}
                disabled={!newLeave.employee_id || !newLeave.leave_type_id || !newLeave.start_date || !newLeave.end_date}
              >
                Check Eligibility
              </Button>
            </Box>

            {eligibilityCheck && !eligibilityCheck.can_approve && (
              <Alert severity="error">
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  ❌ Leave Cannot be Approved:
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {eligibilityCheck.restrictions.map((restriction, index) => (
                    <li key={index}>{restriction}</li>
                  ))}
                </ul>
                <Typography variant="caption" color="text.secondary">
                  Recommendation: {eligibilityCheck.recommendation}
                </Typography>
              </Alert>
            )}

            {eligibilityCheck && eligibilityCheck.can_approve && (
              <Alert severity="success">
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  ✅ Leave Eligible for Approval
                </Typography>
                <Typography variant="body2">
                  Available balance: {eligibilityCheck.available_balance} days | 
                  Requested: {eligibilityCheck.requested_days} days
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => {
            setOpenDialog(false);
            setEligibilityCheck(null);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleApplyLeave} 
            variant="contained"
            disabled={!eligibilityCheck || !eligibilityCheck.can_approve}
          >
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>

      {/* Application Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>📋 Leave Application Details</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Employee"
                  value={`${selectedApplication.employees?.first_name} ${selectedApplication.employees?.last_name}`}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Employee ID"
                  value={selectedApplication.employees?.employee_id}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Department"
                  value={selectedApplication.employees?.department}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Leave Type"
                  value={selectedApplication.leave_types?.name}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Start Date"
                  value={formatDate(selectedApplication.start_date)}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="End Date"
                  value={formatDate(selectedApplication.end_date)}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Total Days"
                  value={selectedApplication.total_days}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Status"
                  value={selectedApplication.status.toUpperCase()}
                  InputProps={{ readOnly: true }}
                />
              </Box>
              <TextField
                label="Leave Reason"
                value={selectedApplication.leave_reason}
                InputProps={{ readOnly: true }}
                multiline
                rows={3}
              />
              {selectedApplication.rejection_reason && (
                <TextField
                  label="Rejection Reason"
                  value={selectedApplication.rejection_reason}
                  InputProps={{ readOnly: true }}
                  multiline
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ComprehensiveLeaveManagement;