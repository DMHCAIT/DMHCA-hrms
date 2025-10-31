import React, { useState } from 'react';
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
  CircularProgress,
  Typography,
  Divider,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { userManagementService } from '../../services/userManagement';

interface CreateEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EmployeeFormData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'employee';
  department: string;
  position: string;
  phone: string;
}

const CreateEmployeeDialog: React.FC<CreateEmployeeDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<EmployeeFormData>({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    department: '',
    position: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const departments = [
    'Human Resources',
    'Information Technology',
    'Finance',
    'Operations',
    'Marketing',
    'Sales',
    'Customer Service',
    'Legal',
    'Administration',
  ];

  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const validateForm = (): boolean => {
    if (!formData.employee_id || !formData.first_name || !formData.last_name || !formData.email) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const generateEmployeeId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const suggested = `EMP${timestamp}`;
    setFormData(prev => ({ ...prev, employee_id: suggested }));
  };

  const handleCreateEmployee = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Try to use backend API first
      if (userManagementService.isApiAvailable()) {
        const result = await userManagementService.createEmployee({
          employee_id: formData.employee_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department || undefined,
          position: formData.position || undefined,
          phone: formData.phone || undefined,
        });

        if (result.success) {
          setSuccess(`Employee ${formData.first_name} ${formData.last_name} created successfully!`);
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 1500);
          return;
        }
      }

      // Fallback to direct Supabase admin (development only)
      if (!supabaseAdmin) {
        setError('User management not available. Please configure backend API or add VITE_SUPABASE_SERVICE_ROLE_KEY for development.');
        return;
      }

      // Step 1: Create auth user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
      });

      if (authError) {
        setError(`Failed to create auth user: ${authError.message}`);
        return;
      }

      if (!authData.user) {
        setError('Failed to create auth user: No user data returned');
        return;
      }

      // Step 2: Create employee record linked to auth user
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          id: authData.user.id, // Link to auth user
          employee_id: formData.employee_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          role: formData.role,
          department: formData.department || null,
          position: formData.position || null,
          phone: formData.phone || null,
          hire_date: new Date().toISOString().split('T')[0],
          status: 'active',
          auth_user_id: authData.user.id,
        })
        .select()
        .single();

      if (employeeError) {
        // If employee creation fails, try to delete the auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        setError(`Failed to create employee record: ${employeeError.message}`);
        return;
      }

      setSuccess(`Employee ${formData.first_name} ${formData.last_name} created successfully!`);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);

    } catch (err: any) {
      setError(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      employee_id: '',
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'employee',
      department: '',
      position: '',
      phone: '',
    });
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd color="primary" />
          <Typography variant="h6">Create New Employee Account</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Employee ID */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                label="Employee ID *"
                value={formData.employee_id}
                onChange={(e) => handleInputChange('employee_id', e.target.value)}
                disabled={loading}
                sx={{ flex: 1 }}
              />
              <Button 
                variant="outlined" 
                onClick={generateEmployeeId}
                disabled={loading}
              >
                Generate ID
              </Button>
            </Box>

            {/* Name Fields */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name *"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                disabled={loading}
                fullWidth
              />
              <TextField
                label="Last Name *"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                disabled={loading}
                fullWidth
              />
            </Box>

            {/* Email and Role */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Email Address *"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={loading}
                fullWidth
              />
              <TextField
                select
                label="Role *"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value as 'admin' | 'employee')}
                disabled={loading}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </Box>

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">
              Account Security
            </Typography>

            {/* Password Fields */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Password *"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading}
                fullWidth
                helperText="Minimum 6 characters"
              />
              <TextField
                label="Confirm Password *"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={loading}
                fullWidth
              />
            </Box>

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">
              Job Information
            </Typography>

            {/* Department and Position */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                disabled={loading}
                fullWidth
              >
                <MenuItem value="">Select Department</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Position"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                disabled={loading}
                fullWidth
              />
            </Box>

            {/* Phone */}
            <TextField
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={loading}
              fullWidth
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleCreateEmployee}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
        >
          {loading ? 'Creating...' : 'Create Employee'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateEmployeeDialog;