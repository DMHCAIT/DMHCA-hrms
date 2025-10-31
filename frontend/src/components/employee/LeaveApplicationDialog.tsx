import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  MenuItem,
  Typography,
  Chip,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  InputAdornment,
} from '@mui/material';
import {
  CalendarToday,
  Description,
  AttachFile,
  Send,
  Warning,
  Info,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { differenceInDays, addDays, isBefore, isWeekend } from 'date-fns';

interface LeavePolicy {
  leave_type: string;
  annual_allocation: number;
  max_consecutive_days: number;
  min_notice_days: number;
  description: string;
}

interface LeaveBalance {
  leave_type: string;
  available: number;
  pending: number;
}

interface LeaveApplicationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Holiday {
  date: string;
  name: string;
  type: string;
}

const LeaveApplicationDialog: React.FC<LeaveApplicationDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { profile } = useAuth();
  const [leaveTypes, setLeaveTypes] = useState<LeavePolicy[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: null as Date | null,
    end_date: null as Date | null,
    reason: '',
    emergency: false,
    attachment: null as File | null,
  });

  const [calculatedDays, setCalculatedDays] = useState(0);
  const [workingDays, setWorkingDays] = useState(0);
  const [selectedPolicy, setSelectedPolicy] = useState<LeavePolicy | null>(null);
  const [selectedBalance, setSelectedBalance] = useState<LeaveBalance | null>(null);

  useEffect(() => {
    if (open) {
      fetchLeaveData();
    }
  }, [open]);

  useEffect(() => {
    calculateLeaveDays();
  }, [formData.start_date, formData.end_date, holidays]);

  useEffect(() => {
    validateLeaveRequest();
  }, [formData.leave_type, formData.start_date, formData.end_date, calculatedDays, selectedPolicy, selectedBalance]);

  const fetchLeaveData = async () => {
    try {
      // Fetch leave policies
      const { data: policies, error: policiesError } = await supabase
        .from('leave_policies')
        .select('*')
        .eq('status', 'active');

      if (policiesError) throw policiesError;

      // Fetch employee leave balances
      const { data: balances, error: balancesError } = await supabase
        .from('employee_leave_balances')
        .select('leave_type, available, pending')
        .eq('employee_id', profile?.employee_id)
        .eq('year', new Date().getFullYear());

      if (balancesError) throw balancesError;

      // Fetch holidays for current year
      const { data: holidayData, error: holidaysError } = await supabase
        .from('leave_calendar')
        .select('date, name, type')
        .gte('date', new Date().getFullYear() + '-01-01')
        .lte('date', new Date().getFullYear() + '-12-31');

      if (holidaysError) throw holidaysError;

      setLeaveTypes(policies || []);
      setLeaveBalances(balances || []);
      setHolidays(holidayData || []);

    } catch (err: any) {
      setError(`Failed to load leave data: ${err.message}`);
    }
  };

  const calculateLeaveDays = () => {
    if (!formData.start_date || !formData.end_date) {
      setCalculatedDays(0);
      setWorkingDays(0);
      return;
    }

    if (isBefore(formData.end_date, formData.start_date)) {
      setCalculatedDays(0);
      setWorkingDays(0);
      return;
    }

    const totalDays = differenceInDays(formData.end_date, formData.start_date) + 1;
    let workingDaysCount = 0;

    // Count working days (excluding weekends and holidays)
    for (let i = 0; i < totalDays; i++) {
      const currentDate = addDays(formData.start_date, i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Skip weekends
      if (isWeekend(currentDate)) continue;
      
      // Skip holidays
      if (holidays.some(holiday => holiday.date === dateString)) continue;
      
      workingDaysCount++;
    }

    setCalculatedDays(totalDays);
    setWorkingDays(workingDaysCount);
  };

  const validateLeaveRequest = () => {
    const newWarnings: string[] = [];

    if (!formData.leave_type || !formData.start_date || !formData.end_date) {
      setWarnings([]);
      return;
    }

    // Check if sufficient balance available
    if (selectedBalance && workingDays > selectedBalance.available) {
      newWarnings.push(`Insufficient leave balance. Available: ${selectedBalance.available} days, Requested: ${workingDays} days`);
    }

    // Check maximum consecutive days policy
    if (selectedPolicy && selectedPolicy.max_consecutive_days && workingDays > selectedPolicy.max_consecutive_days) {
      newWarnings.push(`Exceeds maximum consecutive days limit (${selectedPolicy.max_consecutive_days} days)`);
    }

    // Check minimum notice period
    if (selectedPolicy && !formData.emergency) {
      const daysDifference = differenceInDays(formData.start_date, new Date());
      if (daysDifference < selectedPolicy.min_notice_days) {
        newWarnings.push(`Requires ${selectedPolicy.min_notice_days} days notice. Current notice: ${daysDifference} days`);
      }
    }

    // Check for weekend-only leaves
    if (workingDays === 0 && calculatedDays > 0) {
      newWarnings.push('Selected dates contain only weekends and holidays');
    }

    setWarnings(newWarnings);
  };

  const handleLeaveTypeChange = (leaveType: string) => {
    setFormData(prev => ({ ...prev, leave_type: leaveType }));
    
    const policy = leaveTypes.find(p => p.leave_type === leaveType);
    const balance = leaveBalances.find(b => b.leave_type === leaveType);
    
    setSelectedPolicy(policy || null);
    setSelectedBalance(balance || null);
  };

  const handleSubmit = async () => {
    if (warnings.length > 0 && !formData.emergency) {
      setError('Please resolve all warnings before submitting, or mark as emergency leave');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Please provide a reason for your leave request');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: profile?.employee_id,
          leave_type: formData.leave_type,
          start_date: formData.start_date?.toISOString().split('T')[0],
          end_date: formData.end_date?.toISOString().split('T')[0],
          days_requested: workingDays,
          reason: formData.reason,
          status: 'pending',
        });

      if (insertError) throw insertError;

      onSuccess();
      handleClose();

    } catch (err: any) {
      setError(`Failed to submit leave request: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      leave_type: '',
      start_date: null,
      end_date: null,
      reason: '',
      emergency: false,
      attachment: null,
    });
    setCalculatedDays(0);
    setWorkingDays(0);
    setSelectedPolicy(null);
    setSelectedBalance(null);
    setWarnings([]);
    setError('');
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday color="primary" />
            <Typography variant="h6">Apply for Leave</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {warnings.length > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Please note:
                </Typography>
                {warnings.map((warning, index) => (
                  <Typography key={index} variant="body2">
                    • {warning}
                  </Typography>
                ))}
              </Alert>
            )}

            {/* Leave Type Selection */}
            <TextField
              select
              fullWidth
              label="Leave Type *"
              value={formData.leave_type}
              onChange={(e) => handleLeaveTypeChange(e.target.value)}
              sx={{ mb: 3 }}
              disabled={loading}
            >
              {leaveTypes.map((type) => (
                <MenuItem key={type.leave_type} value={type.leave_type}>
                  <Box>
                    <Typography variant="body1">{type.leave_type}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {type.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>

            {/* Policy and Balance Information */}
            {selectedPolicy && selectedBalance && (
              <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Leave Information
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip 
                      label={`Available: ${selectedBalance.available} days`}
                      color="success"
                      size="small"
                    />
                    <Chip 
                      label={`Pending: ${selectedBalance.pending} days`}
                      color="warning" 
                      size="small"
                    />
                    <Chip 
                      label={`Max Consecutive: ${selectedPolicy.max_consecutive_days || 'No limit'} days`}
                      color="info"
                      size="small"
                    />
                    <Chip 
                      label={`Min Notice: ${selectedPolicy.min_notice_days} days`}
                      color="default"
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    {selectedPolicy.description}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Date Selection */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <DatePicker
                label="Start Date *"
                value={formData.start_date}
                onChange={(date) => setFormData(prev => ({ ...prev, start_date: date }))}
                disabled={loading}
                minDate={new Date()}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="End Date *"
                value={formData.end_date}
                onChange={(date) => setFormData(prev => ({ ...prev, end_date: date }))}
                disabled={loading}
                minDate={formData.start_date || new Date()}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>

            {/* Days Calculation */}
            {formData.start_date && formData.end_date && (
              <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Leave Duration Summary
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      icon={<CalendarToday />}
                      label={`Total Days: ${calculatedDays}`}
                      color="primary"
                    />
                    <Chip 
                      icon={<CalendarToday />}
                      label={`Working Days: ${workingDays}`}
                      color="secondary"
                    />
                  </Box>
                  {calculatedDays !== workingDays && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <Info fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                      Excludes weekends and holidays
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reason */}
            <TextField
              fullWidth
              label="Reason for Leave *"
              multiline
              rows={4}
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              disabled={loading}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Description />
                  </InputAdornment>
                ),
              }}
            />

            {/* Emergency Leave Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.emergency}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergency: e.target.checked }))}
                  disabled={loading}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning color="warning" fontSize="small" />
                  <Typography variant="body2">
                    Emergency Leave (bypasses notice period requirements)
                  </Typography>
                </Box>
              }
              sx={{ mb: 2 }}
            />

            {/* Attachment Upload */}
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<AttachFile />}
                disabled={loading}
              >
                Attach Supporting Document (Optional)
                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData(prev => ({ ...prev, attachment: file }));
                  }}
                />
              </Button>
              {formData.attachment && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Selected: {formData.attachment.name}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.leave_type || !formData.start_date || !formData.end_date || workingDays === 0}
            startIcon={<Send />}
          >
            {loading ? 'Submitting...' : 'Submit Leave Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default LeaveApplicationDialog;