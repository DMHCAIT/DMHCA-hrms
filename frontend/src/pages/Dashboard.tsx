import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  People,
  Schedule,
  EventNote,
  PersonAdd,
  Business,
  LocationCity,
  TrendingUp,
  Payment,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { supabaseService } from '../services/supabase';

const Dashboard: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [payrollStats, setPayrollStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [
          branchesData,
          departmentsData,
          employeesData,
          statsData,
          attendanceData,
          leavesData,
          payrollPeriodsData,
          payslipsData
        ] = await Promise.all([
          supabaseService.getBranches(),
          supabaseService.getDepartments(),
          supabaseService.getEmployees(),
          supabaseService.getDashboardStats(),
          supabaseService.getAttendance({ limit: 5 }),
          supabaseService.getLeaves({ limit: 5 }),
          supabaseService.getPayrollPeriods(),
          supabaseService.getPayslips()
        ]);
        
        setBranches(branchesData.data || []);
        setDepartments(departmentsData.data || []);
        setEmployees(employeesData.data || []);
        setDashboardStats(statsData || {});
        setRecentAttendance(attendanceData.data || []);
        setRecentLeaves(leavesData.data || []);
        
        // Calculate payroll statistics
        const totalPayroll = (payslipsData.data || []).reduce((sum: number, slip: any) => 
          sum + (parseFloat(slip.net_salary) || 0), 0
        );
        
        setPayrollStats({
          totalPayroll,
          payrollPeriods: payrollPeriodsData.data?.length || 0,
          processedPayslips: payslipsData.data?.length || 0
        });
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        console.error('Dashboard data loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Database Connection Failed
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
          {error.includes('table') || error.includes('relation') ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                🔧 To fix this issue:
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                1. Go to your Supabase Dashboard
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                2. Navigate to SQL Editor
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                3. Run the SQL from supabase-schema.sql file
              </Typography>
            </Box>
          ) : null}
        </Alert>
      </Box>
    );
  }

  const StatCard = ({ title, value, icon, color, subtitle, progress }: any) => (
    <Card sx={{ 
      height: '100%', 
      background: `linear-gradient(135deg, ${color === 'primary' ? '#1976d2' : 
        color === 'success' ? '#2e7d32' : 
        color === 'warning' ? '#ed6c02' : 
        color === 'error' ? '#d32f2f' : 
        color === 'info' ? '#0288d1' : '#9c27b0'}15 0%, white 100%)`,
      border: `1px solid ${color === 'primary' ? '#1976d2' : 
        color === 'success' ? '#2e7d32' : 
        color === 'warning' ? '#ed6c02' : 
        color === 'error' ? '#d32f2f' : 
        color === 'info' ? '#0288d1' : '#9c27b0'}30`,
      transition: 'transform 0.2s',
      '&:hover': { transform: 'translateY(-2px)' }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              backgroundColor: `${color}.main`,
              color: 'white',
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        
        {progress !== undefined && (
          <Box sx={{ mb: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 4, 
                borderRadius: 2,
                backgroundColor: `${color}.100`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: `${color}.main`,
                }
              }} 
            />
          </Box>
        )}
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
            {progress !== undefined && ` (${Math.round(progress)}%)`}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        HR Dashboard Overview
      </Typography>

      {/* Database Status Alert */}
      {employees.length === 0 && departments.length === 0 && branches.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            No Data Available
          </Typography>
          <Typography variant="body2">
            The database appears to be empty or tables haven't been created yet. 
            Please run the setup SQL in your Supabase Dashboard to populate with initial data.
          </Typography>
        </Alert>
      )}

      {/* Main Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <StatCard
          title="Total Employees"
          value={dashboardStats.totalEmployees || employees.length}
          icon={<People />}
          color="primary"
          subtitle={employees.length === 0 ? "No employees in database" : "Active workforce"}
          progress={employees.length > 0 ? 100 : 0}
        />
        <StatCard
          title="Present Today"
          value={dashboardStats.presentToday || 0}
          icon={<CheckCircle />}
          color="success"
          subtitle="Currently at work"
          progress={dashboardStats.totalEmployees > 0 ? 
            (dashboardStats.presentToday / dashboardStats.totalEmployees) * 100 : 0}
        />
        <StatCard
          title="On Leave"
          value={dashboardStats.onLeave || 0}
          icon={<EventNote />}
          color="warning"
          subtitle="Approved leave today"
          progress={dashboardStats.totalEmployees > 0 ? 
            (dashboardStats.onLeave / dashboardStats.totalEmployees) * 100 : 0}
        />
        <StatCard
          title="Pending Requests"
          value={dashboardStats.pendingLeaveRequests || 0}
          icon={<Warning />}
          color="error"
          subtitle="Awaiting approval"
          progress={dashboardStats.pendingLeaveRequests > 0 ? 80 : 0}
        />
      </Box>

      {/* Secondary Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <StatCard
          title="Branches"
          value={branches.length}
          icon={<Business />}
          color="info"
          subtitle={branches.length === 0 ? "No branches configured" : "Office locations"}
        />
        <StatCard
          title="Departments"
          value={departments.length}
          icon={<LocationCity />}
          color="secondary"
          subtitle={departments.length === 0 ? "No departments set up" : "Active departments"}
        />
        <StatCard
          title="Total Payroll"
          value={`₹${(payrollStats.totalPayroll || 0).toLocaleString('en-IN')}`}
          icon={<Payment />}
          color="success"
          subtitle="Current month processed"
        />
        <StatCard
          title="Attendance Rate"
          value={`${dashboardStats.totalEmployees > 0 ? 
            Math.round((dashboardStats.presentToday / dashboardStats.totalEmployees) * 100) : 0}%`}
          icon={<TrendingUp />}
          color="primary"
          subtitle="Today's attendance"
        />
      </Box>

      {/* Real-time Activity Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        {/* Recent Attendance */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
              <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
              Recent Attendance
            </Typography>
            <List sx={{ p: 0 }}>
              {recentAttendance.slice(0, 5).map((attendance: any) => (
                <ListItem key={attendance.id} sx={{ px: 0, py: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                      <Schedule />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`Employee #${attendance.employee_id}`}
                    secondary={`${attendance.status} - ${new Date(attendance.date).toLocaleDateString()}`}
                  />
                  <Chip
                    label={attendance.status}
                    size="small"
                    color={attendance.status === 'Present' ? 'success' : 'error'}
                    variant="outlined"
                  />
                </ListItem>
              ))}
              {recentAttendance.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No recent attendance records
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>

        {/* Recent Leave Requests */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
              <EventNote sx={{ mr: 1, color: 'warning.main' }} />
              Recent Leave Requests
            </Typography>
            <List sx={{ p: 0 }}>
              {recentLeaves.slice(0, 5).map((leave: any) => (
                <ListItem key={leave.id} sx={{ px: 0, py: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                      <EventNote />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${leave.leave_type} Leave`}
                    secondary={`${new Date(leave.start_date).toLocaleDateString()} - ${new Date(leave.end_date).toLocaleDateString()}`}
                  />
                  <Chip
                    label={leave.status}
                    size="small"
                    color={leave.status === 'Approved' ? 'success' : 
                           leave.status === 'Rejected' ? 'error' : 'warning'}
                    variant="outlined"
                  />
                </ListItem>
              ))}
              {recentLeaves.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No recent leave requests
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>

        {/* Company Structure */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
              <Business sx={{ mr: 1, color: 'primary.main' }} />
              Company Structure
            </Typography>
            
            {/* Branches */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                Branches ({branches.length})
              </Typography>
              {branches.slice(0, 3).map((branch: any) => (
                <Box key={branch.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{branch.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{branch.location}</Typography>
                </Box>
              ))}
            </Box>

            {/* Departments */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'secondary.main' }}>
                Departments ({departments.length})
              </Typography>
              {departments.slice(0, 3).map((dept: any) => (
                <Box key={dept.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{dept.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dept.employee_count || 0} employees
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions */}
      <Card sx={{ mt: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {[
              { label: 'Add Employee', icon: <People /> },
              { label: 'Mark Attendance', icon: <Schedule /> },
              { label: 'Process Leave', icon: <EventNote /> },
              { label: 'Generate Report', icon: <PersonAdd /> },
            ].map((action) => (
              <Box
                key={action.label}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'grey.200',
                  borderRadius: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  minWidth: 150,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'primary.50',
                  },
                }}
              >
                <Box sx={{ color: 'primary.main', mb: 1 }}>
                  {action.icon}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {action.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* System Status & Real-time Information */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mt: 4 }}>
        <Alert 
          severity="success" 
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: '2rem' }
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            🟢 System Status - Operational
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Database:</strong> ✅ Connected to Supabase PostgreSQL
            <br />
            <strong>Data Sync:</strong> ✅ Real-time updates active
            <br />
            <strong>Last Updated:</strong> {new Date().toLocaleString()}
          </Typography>
        </Alert>

        <Alert 
          severity="info"
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: '2rem' }
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            📊 Live Statistics
          </Typography>
          <Typography variant="body2">
            <strong>Total Employees:</strong> {dashboardStats.totalEmployees || employees.length}
            <br />
            <strong>Present Today:</strong> {dashboardStats.presentToday || 0} 
            ({dashboardStats.totalEmployees > 0 ? 
              Math.round((dashboardStats.presentToday / dashboardStats.totalEmployees) * 100) : 0}%)
            <br />
            <strong>On Leave:</strong> {dashboardStats.onLeave || 0} employees
            <br />
            <strong>Pending Approvals:</strong> {dashboardStats.pendingLeaveRequests || 0} requests
          </Typography>
        </Alert>

        <Alert 
          severity="warning"
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: '2rem' }
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            🏢 Organization Structure  
          </Typography>
          <Typography variant="body2">
            <strong>Branches:</strong> {branches.length} locations
            <br />
            <strong>Departments:</strong> {departments.length} active departments
            <br />
            <strong>Payroll Processed:</strong> ₹{(payrollStats.totalPayroll || 0).toLocaleString('en-IN')}
            <br />
            <strong>Recent Activities:</strong> {recentAttendance.length + recentLeaves.length} records
          </Typography>
        </Alert>

        <Alert 
          severity="info"
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: '2rem' }
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            🚀 Quick Links
          </Typography>
          <Typography variant="body2">
            • <strong>Comprehensive Leave System:</strong> Navigate → "Leave Policies"
            <br />
            • <strong>Real-time Attendance:</strong> Navigate → "Attendance" 
            <br />
            • <strong>Payroll Management:</strong> Navigate → "Payroll"
            <br />
            • <strong>Employee Records:</strong> Navigate → "Employees"
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default Dashboard;