import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CalendarToday,
  EventAvailable,
  Schedule,
  Pending,
  CheckCircle,
  Cancel,
  Info,
  TrendingUp,
  AccessTime,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface LeavePolicy {
  id: string;
  leave_type: string;
  annual_allocation: number;
  max_consecutive_days: number;
  min_notice_days: number;
  carry_forward_limit: number;
  carry_forward_expiry_months: number;
  description: string;
  color: string;
}

interface LeaveBalance {
  leave_type: string;
  total_allocated: number;
  used: number;
  pending: number;
  available: number;
  carry_forward_from_previous: number;
  carry_forward_to_next: number;
  expires_on: string | null;
}

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  applied_date: string;
  approved_by?: string;
  approved_date?: string;
  comments?: string;
}

interface LeaveStats {
  total_days_taken: number;
  total_days_available: number;
  most_used_leave_type: string;
  upcoming_expiry: { leave_type: string; days: number; expires_on: string } | null;
  average_monthly_usage: number;
}

const EmployeeLeaveInfo: React.FC = () => {
  const { profile } = useAuth();
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicy[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([]);
  const [leaveStats, setLeaveStats] = useState<LeaveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      fetchLeaveData();
    }
  }, [profile]);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);

      // Fetch leave policies
      const { data: policies, error: policiesError } = await supabase
        .from('leave_policies')
        .select('*')
        .eq('status', 'active')
        .order('leave_type');

      if (policiesError) {
        console.error('Error fetching leave policies:', policiesError);
        setError('Failed to load leave policies');
        return;
      }

      // Fetch employee leave balances
      const { data: balances, error: balancesError } = await supabase
        .from('employee_leave_balances')
        .select('*')
        .eq('employee_id', profile?.employee_id)
        .eq('year', new Date().getFullYear());

      if (balancesError) {
        console.error('Error fetching leave balances:', balancesError);
        setError('Failed to load leave balances');
        return;
      }

      // Fetch recent leave requests
      const { data: requests, error: requestsError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', profile?.employee_id)
        .order('applied_date', { ascending: false })
        .limit(10);

      if (requestsError) {
        console.error('Error fetching leave requests:', requestsError);
      }

      setLeavePolicies(policies || []);
      setLeaveBalances(balances || []);
      setRecentRequests(requests || []);

      // Calculate leave statistics
      calculateLeaveStats(balances || [], requests || []);

    } catch (err) {
      console.error('Error fetching leave data:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateLeaveStats = (balances: LeaveBalance[], _requests: LeaveRequest[]) => {
    const totalDaysTaken = balances.reduce((sum, balance) => sum + balance.used, 0);
    const totalDaysAvailable = balances.reduce((sum, balance) => sum + balance.available, 0);
    
    // Find most used leave type
    const mostUsedType = balances.reduce((prev, current) => 
      prev.used > current.used ? prev : current
    );

    // Find upcoming expiry
    const upcomingExpiry = balances
      .filter(balance => balance.expires_on && balance.carry_forward_from_previous > 0)
      .sort((a, b) => new Date(a.expires_on!).getTime() - new Date(b.expires_on!).getTime())[0];

    // Calculate average monthly usage (based on current usage)
    const monthsElapsed = new Date().getMonth() + 1;
    const averageMonthlyUsage = monthsElapsed > 0 ? totalDaysTaken / monthsElapsed : 0;

    setLeaveStats({
      total_days_taken: totalDaysTaken,
      total_days_available: totalDaysAvailable,
      most_used_leave_type: mostUsedType?.leave_type || 'N/A',
      upcoming_expiry: upcomingExpiry ? {
        leave_type: upcomingExpiry.leave_type,
        days: upcomingExpiry.carry_forward_from_previous,
        expires_on: upcomingExpiry.expires_on!
      } : null,
      average_monthly_usage: averageMonthlyUsage
    });
  };

  const getLeavePolicy = (leaveType: string) => {
    return leavePolicies.find(policy => policy.leave_type === leaveType);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle color="success" />;
      case 'rejected': return <Cancel color="error" />;
      case 'pending': return <Pending color="warning" />;
      default: return <Schedule color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'info';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUsagePercentage = (used: number, total: number) => {
    return total > 0 ? (used / total) * 100 : 0;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Leave Information
      </Typography>

      {/* Leave Statistics Overview */}
      {leaveStats && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Card sx={{ minWidth: 200, flex: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CalendarToday color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div">
                {leaveStats.total_days_taken}
              </Typography>
              <Typography color="text.secondary">
                Days Taken This Year
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 200, flex: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <EventAvailable color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" color="success.main">
                {leaveStats.total_days_available}
              </Typography>
              <Typography color="text.secondary">
                Days Available
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 200, flex: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" color="info.main">
                {leaveStats.average_monthly_usage.toFixed(1)}
              </Typography>
              <Typography color="text.secondary">
                Avg. Days/Month
              </Typography>
            </CardContent>
          </Card>

          {leaveStats.upcoming_expiry && (
            <Card sx={{ minWidth: 200, flex: 1 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <AccessTime color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div" color="warning.main">
                  {leaveStats.upcoming_expiry.days}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {leaveStats.upcoming_expiry.leave_type} expires on {formatDate(leaveStats.upcoming_expiry.expires_on)}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Leave Balances by Type */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Leave Balances by Type
          </Typography>
          
          {leaveBalances.length === 0 ? (
            <Alert severity="info">
              No leave balance information available. Please contact HR.
            </Alert>
          ) : (
            <Box>
              {leaveBalances.map((balance) => {
                const policy = getLeavePolicy(balance.leave_type);
                const usagePercentage = getUsagePercentage(balance.used, balance.total_allocated);
                
                return (
                  <Box key={balance.leave_type} sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" component="div">
                          {balance.leave_type}
                        </Typography>
                        {policy && (
                          <Typography variant="body2" color="text.secondary">
                            {policy.description}
                          </Typography>
                        )}
                      </Box>
                      <Tooltip title="View Policy Details">
                        <IconButton size="small">
                          <Info />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Leave Balance Details */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                      <Chip 
                        label={`Total: ${balance.total_allocated} days`} 
                        variant="outlined"
                        color="primary"
                      />
                      <Chip 
                        label={`Used: ${balance.used} days`} 
                        variant="filled"
                        color={getProgressColor(usagePercentage) as any}
                      />
                      <Chip 
                        label={`Available: ${balance.available} days`} 
                        variant="filled"
                        color="success"
                      />
                      {balance.pending > 0 && (
                        <Chip 
                          label={`Pending: ${balance.pending} days`} 
                          variant="filled"
                          color="warning"
                        />
                      )}
                      {balance.carry_forward_from_previous > 0 && (
                        <Chip 
                          label={`Carried Forward: ${balance.carry_forward_from_previous} days`} 
                          variant="outlined"
                          color="info"
                        />
                      )}
                    </Box>

                    {/* Usage Progress Bar */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Usage Progress</Typography>
                        <Typography variant="body2">{usagePercentage.toFixed(1)}%</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(usagePercentage, 100)} 
                        color={getProgressColor(usagePercentage) as any}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Policy Information */}
                    {policy && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Policy Information:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            • Annual Allocation: {policy.annual_allocation} days
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            • Max Consecutive: {policy.max_consecutive_days} days
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            • Min Notice: {policy.min_notice_days} days
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            • Carry Forward Limit: {policy.carry_forward_limit} days
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            • Carry Forward Expires: {policy.carry_forward_expiry_months} months
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Carry Forward Information */}
                    {balance.carry_forward_to_next > 0 && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        {balance.carry_forward_to_next} days will be carried forward to next year
                        {balance.expires_on && ` (expires on ${formatDate(balance.expires_on)})`}
                      </Alert>
                    )}

                    {balance.expires_on && balance.carry_forward_from_previous > 0 && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        {balance.carry_forward_from_previous} carried forward days will expire on {formatDate(balance.expires_on)}
                      </Alert>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Recent Leave Requests */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Leave Requests
          </Typography>
          
          {recentRequests.length === 0 ? (
            <Alert severity="info">
              No leave requests found.
            </Alert>
          ) : (
            <Box>
              {recentRequests.map((request) => (
                <Box 
                  key={request.id} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {request.leave_type}
                      </Typography>
                      <Chip 
                        icon={getStatusIcon(request.status)}
                        label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        size="small"
                        color={getStatusColor(request.status) as any}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(request.start_date)} - {formatDate(request.end_date)} ({request.days_requested} days)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Applied: {formatDate(request.applied_date)}
                    </Typography>
                    {request.reason && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Reason: {request.reason}
                      </Typography>
                    )}
                    {request.comments && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Comments: {request.comments}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeLeaveInfo;