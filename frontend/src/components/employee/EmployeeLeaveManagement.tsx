import React, { useState } from 'react';
import {
  Box,
  Fab,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import {
  Add,
  CalendarToday,
  Assignment,
} from '@mui/icons-material';
import EmployeeLeaveInfo from './EmployeeLeaveInfo';
import LeaveApplicationDialog from './LeaveApplicationDialog';

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
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `leave-tab-${index}`,
    'aria-controls': `leave-tabpanel-${index}`,
  };
}

const EmployeeLeaveManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleApplicationSuccess = () => {
    // Refresh leave information when application is successful
    window.location.reload();
  };

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      {/* Header */}
      <Box sx={{ p: 3, pb: 0 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Leave Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Manage your leave requests and view your leave balance information
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="leave management tabs">
          <Tab 
            icon={<CalendarToday />} 
            label="Leave Information" 
            {...a11yProps(0)} 
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<Assignment />} 
            label="Leave History" 
            {...a11yProps(1)} 
            sx={{ minHeight: 64 }}
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <EmployeeLeaveInfo />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Leave Request History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your complete leave history will be displayed here, including approved, pending, and rejected requests.
          </Typography>
        </Box>
      </TabPanel>

      {/* Floating Action Button for New Leave Application */}
      <Fab
        color="primary"
        aria-label="apply for leave"
        onClick={() => setApplicationDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
          },
        }}
      >
        <Add />
      </Fab>

      {/* Leave Application Dialog */}
      <LeaveApplicationDialog
        open={applicationDialogOpen}
        onClose={() => setApplicationDialogOpen(false)}
        onSuccess={handleApplicationSuccess}
      />
    </Box>
  );
};

export default EmployeeLeaveManagement;