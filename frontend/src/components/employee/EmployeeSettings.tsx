import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  Lock,
  Save,
  Edit,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ProfileUpdateData {
  first_name: string;
  last_name: string;
  phone: string;
  department: string;
  position: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const EmployeeSettings: React.FC = () => {
  const { profile } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState<ProfileUpdateData>({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    department: profile?.department || '',
    position: profile?.position || '',
  });
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleProfileChange = (field: keyof ProfileUpdateData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setMessage('');
    setError('');
  };

  const handlePasswordChange = (field: keyof PasswordChangeData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    setPasswordMessage('');
    setPasswordError('');
  };

  const validatePasswordForm = (): boolean => {
    if (!passwordData.currentPassword) {
      setPasswordError('Please enter your current password');
      return false;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return false;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return false;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      return false;
    }

    return true;
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('employees')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('employee_id', profile.employee_id);

      if (updateError) {
        setError(`Failed to update profile: ${updateError.message}`);
        return;
      }

      setMessage('Profile updated successfully!');
      setEditMode(false);
      
      // Refresh the page to update the auth context
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      setError(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setPasswordLoading(true);
    setPasswordMessage('');
    setPasswordError('');

    try {
      // First, verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: passwordData.currentPassword,
      });

      if (verifyError) {
        setPasswordError('Current password is incorrect');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) {
        setPasswordError(`Failed to update password: ${updateError.message}`);
        return;
      }

      setPasswordMessage('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

    } catch (err: any) {
      setPasswordError(`Unexpected error: ${err.message}`);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      department: profile?.department || '',
      position: profile?.position || '',
    });
    setEditMode(false);
    setMessage('');
    setError('');
  };

  if (!profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Unable to load profile information</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Account Settings
      </Typography>

      {/* Profile Information Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
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
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" gutterBottom>
                Profile Information
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
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
            <Button
              startIcon={<Edit />}
              onClick={() => setEditMode(!editMode)}
              disabled={loading}
            >
              {editMode ? 'Cancel' : 'Edit Profile'}
            </Button>
          </Box>

          {message && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                value={editMode ? profileData.first_name : profile.first_name}
                onChange={(e) => handleProfileChange('first_name', e.target.value)}
                disabled={!editMode || loading}
                fullWidth
              />
              <TextField
                label="Last Name"
                value={editMode ? profileData.last_name : profile.last_name}
                onChange={(e) => handleProfileChange('last_name', e.target.value)}
                disabled={!editMode || loading}
                fullWidth
              />
            </Box>

            <TextField
              label="Email Address"
              value={profile.email}
              disabled
              fullWidth
              helperText="Email cannot be changed. Contact admin if needed."
            />

            <TextField
              label="Phone Number"
              value={editMode ? profileData.phone : (profile.phone || '')}
              onChange={(e) => handleProfileChange('phone', e.target.value)}
              disabled={!editMode || loading}
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Department"
                value={profile.department || ''}
                disabled
                fullWidth
                helperText="Department can only be changed by admin"
              />
              <TextField
                label="Position"
                value={profile.position || ''}
                disabled
                fullWidth
                helperText="Position can only be changed by admin"
              />
            </Box>

            {editMode && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={handleCancelEdit} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Lock color="primary" sx={{ mr: 2 }} />
            <Typography variant="h5">
              Change Password
            </Typography>
          </Box>

          {passwordMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {passwordMessage}
            </Alert>
          )}

          {passwordError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {passwordError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 400 }}>
            <TextField
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
              disabled={passwordLoading}
              fullWidth
              required
            />

            <TextField
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              disabled={passwordLoading}
              fullWidth
              required
              helperText="Minimum 6 characters"
            />

            <TextField
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              disabled={passwordLoading}
              fullWidth
              required
            />

            <Button
              variant="contained"
              onClick={handleChangePassword}
              disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword}
              startIcon={passwordLoading ? <CircularProgress size={20} /> : <Lock />}
              sx={{ alignSelf: 'flex-start' }}
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeSettings;