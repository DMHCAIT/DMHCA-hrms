import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Box,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Grid
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  CloudSync as CloudSyncIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const API_BASE = 'https://dmhcahrms.xyz/api';

interface Employee {
  cardno: number;
  empname: string;
  empcode: string;
  branch: string;
  email?: string;
  phone?: string;
  status?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  employees?: Employee[];
  total_employees?: number;
  synced_count?: number;
}

const DelhiBranchManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalEmployees, setTotalEmployees] = useState<number>(27);
  const [apiResponse, setApiResponse] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const machineConfig = [
    { id: 1, name: 'Main Office', serial: 'RS2203601333B8', location: 'Sultanpur New Delhi', status: 'Active' },
    { id: 2, name: 'Branch Office', serial: 'RS2203601333B', location: 'Hyderabad', status: 'Active' },
    { id: 3, name: 'Backup Device', serial: 'RS2203601333B6', location: 'Kashmir', status: 'Active' }
  ];

  useEffect(() => {
    loadEmployees();
  }, []);

  const updateResponse = (content: string) => {
    setApiResponse(content);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const loadEmployees = async () => {
    setLoading(true);
    updateResponse('Loading Delhi branch employees...');
    
    try {
      const response = await fetch(`${API_BASE}/delhi-employees?action=list`);
      const data: ApiResponse = await response.json();
      
      if (data.success && data.employees) {
        setEmployees(data.employees);
        setTotalEmployees(data.total_employees || data.employees.length);
        updateResponse(JSON.stringify(data, null, 2));
        showSnackbar('Employee data loaded successfully', 'success');
      } else {
        updateResponse('Error: ' + data.message);
        showSnackbar('Error loading employee data', 'error');
      }
    } catch (error) {
      const errorMessage = 'Network Error: ' + (error as Error).message;
      updateResponse(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const syncToDatabase = async () => {
    setLoading(true);
    updateResponse('Syncing employees to Supabase database...');
    
    try {
      const response = await fetch(`${API_BASE}/delhi-employees?action=sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data: ApiResponse = await response.json();
      
      updateResponse(JSON.stringify(data, null, 2));
      
      if (data.success) {
        showSnackbar(`Successfully synced ${data.synced_count || 0} employees`, 'success');
        await loadEmployees(); // Reload to get updated data
      } else {
        showSnackbar('Sync failed: ' + data.message, 'error');
      }
    } catch (error) {
      const errorMessage = 'Sync Error: ' + (error as Error).message;
      updateResponse(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    setLoading(true);
    updateResponse('Exporting employee data as CSV...');
    
    try {
      const response = await fetch(`${API_BASE}/delhi-employees?action=csv`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'delhi_employees.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      
      updateResponse('CSV file downloaded successfully!');
      showSnackbar('CSV exported successfully', 'success');
    } catch (error) {
      const errorMessage = 'Export Error: ' + (error as Error).message;
      updateResponse(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const rs9wFormat = async () => {
    setLoading(true);
    updateResponse('Formatting employee data for RS9W machines...');
    
    try {
      const response = await fetch(`${API_BASE}/delhi-employees?action=rs9w`);
      const data = await response.json();
      
      updateResponse(JSON.stringify(data, null, 2));
      showSnackbar('RS9W format data generated', 'success');
    } catch (error) {
      const errorMessage = 'Format Error: ' + (error as Error).message;
      updateResponse(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEmployee(null);
  };

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({
    title, value, icon, color
  }) => (
    <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color}20, ${color}10)` }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h3" component="div" sx={{ color: color, fontWeight: 'bold' }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ color: color, fontSize: '3rem' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          🏢 Delhi Branch Employee Management
        </Typography>
        <Typography variant="h6">
          Sultanpur New Delhi - Comprehensive Employee Data & RS9W Integration
        </Typography>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value={totalEmployees}
            icon={<PeopleIcon />}
            color="#667eea"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="RS9W Machines"
            value={3}
            icon={<SettingsIcon />}
            color="#51cf66"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Branch Code"
            value="DEL"
            icon={<BusinessIcon />}
            color="#ffd43b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Department"
            value="DMHCA"
            icon={<BusinessIcon />}
            color="#ff8cc8"
          />
        </Grid>
      </Grid>

      {/* RS9W Machine Configuration */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          🔧 RS9W Machine Configuration
        </Typography>
        <Grid container spacing={2}>
          {machineConfig.map((machine) => (
            <Grid item xs={12} md={4} key={machine.id}>
              <Card sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📍 {machine.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Serial:</strong> {machine.serial}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Location:</strong> {machine.location}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {machine.status}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            fullWidth
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={loadEmployees}
            disabled={loading}
            sx={{ py: 2 }}
          >
            Load Employees
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            color="success"
            fullWidth
            startIcon={<CloudSyncIcon />}
            onClick={syncToDatabase}
            disabled={loading}
            sx={{ py: 2 }}
          >
            Sync to Database
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            color="info"
            fullWidth
            startIcon={<DownloadIcon />}
            onClick={exportCSV}
            disabled={loading}
            sx={{ py: 2 }}
          >
            Export CSV
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            color="warning"
            fullWidth
            startIcon={<SettingsIcon />}
            onClick={rs9wFormat}
            disabled={loading}
            sx={{ py: 2 }}
          >
            RS9W Format
          </Button>
        </Grid>
      </Grid>

      {/* Employee Table */}
      {employees.length > 0 && (
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Box sx={{ p: 2, backgroundColor: '#333', color: 'white' }}>
            <Typography variant="h6">
              👥 Delhi Branch Employees ({employees.length} employees)
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Card No</strong></TableCell>
                  <TableCell><strong>Employee Name</strong></TableCell>
                  <TableCell><strong>Employee Code</strong></TableCell>
                  <TableCell><strong>Branch</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee, index) => (
                  <TableRow key={employee.cardno} hover>
                    <TableCell>
                      <Chip label={employee.cardno} variant="outlined" />
                    </TableCell>
                    <TableCell>{employee.empname}</TableCell>
                    <TableCell>
                      <Chip label={employee.empcode} color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>{employee.branch}</TableCell>
                    <TableCell>
                      {employee.empname.replace(/\s+/g, '').toLowerCase()}@dmhca.com
                    </TableCell>
                    <TableCell>+91{9000000000 + employee.cardno}</TableCell>
                    <TableCell>
                      <Chip 
                        label="Active" 
                        color="success" 
                        size="small"
                        icon={<CheckCircleIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEditEmployee(employee)}>
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* API Response */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 API Response & Logs
        </Typography>
        <Box
          sx={{
            backgroundColor: '#f8f9fa',
            p: 2,
            borderRadius: 1,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            maxHeight: 400,
            overflow: 'auto',
            border: '1px solid #e9ecef'
          }}
        >
          {apiResponse || 'Delhi Branch Employee Management System Ready\nClick "Load Employees" to view all employees'}
        </Box>
      </Paper>

      {/* Edit Employee Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Employee Name"
                  value={selectedEmployee.empname}
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Card Number"
                  value={selectedEmployee.cardno}
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Employee Code"
                  value={selectedEmployee.empcode}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Branch"
                  value={selectedEmployee.branch}
                  disabled
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DelhiBranchManagement;