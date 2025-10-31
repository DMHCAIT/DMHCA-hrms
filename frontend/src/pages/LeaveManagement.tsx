import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert
} from '@mui/material';
import { EventNote, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LeaveManagement: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
        Leave Management
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body1">
          We have upgraded to a comprehensive leave management system with full company policy integration!
        </Typography>
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4 }}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          cursor: 'pointer',
          '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s ease' }
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <EventNote sx={{ fontSize: 48, mr: 2 }} />
              <Box>
                <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                  Basic Leave Management
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Simple leave requests and approvals
                </Typography>
              </Box>
            </Box>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              Quick access to basic leave functionality for simple leave request submissions and approvals.
            </Typography>
            <Alert severity="warning" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
              Note: This basic version has limited functionality. Use Leave Policies for full features.
            </Alert>
          </CardContent>
        </Card>

        <Card sx={{ 
          background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)', 
          color: 'white',
          cursor: 'pointer',
          '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s ease' }
        }} onClick={() => navigate('/leave-management')}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <EventNote sx={{ fontSize: 48, mr: 2 }} />
              <Box>
                <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                  Comprehensive Leave Policies
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Full company policy integration
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              Complete leave management with automatic payroll integration, policy enforcement, and comprehensive analytics.
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                ✅ Features Include:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '20px', opacity: 0.9 }}>
                <li>8 Leave Types with Company Policies</li>
                <li>Training & Probation Period Rules</li>
                <li>Automatic Payroll Calculations</li>
                <li>Multi-level Approval Workflows</li>
                <li>Leave Balance Tracking</li>
                <li>Analytics Dashboard</li>
              </ul>
            </Box>

            <Button 
              variant="contained" 
              endIcon={<ArrowForward />}
              onClick={() => navigate('/leave-management')}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Access Full System
            </Button>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ Comprehensive Leave Management System Ready
            </Alert>
            <Alert severity="info" sx={{ mb: 2 }}>
              ℹ️ Database setup required - Follow LEAVE_SYSTEM_SETUP.md instructions
            </Alert>
            <Alert severity="warning">
              ⚠️ Complete database setup before using Leave Policies features
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default LeaveManagement;
