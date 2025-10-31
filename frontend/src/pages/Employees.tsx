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
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  InputAdornment,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
} from '@mui/icons-material';
import { supabaseService } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import CreateEmployeeDialog from '../components/admin/CreateEmployeeDialog';

interface Employee {
  id?: number;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department_id?: number;
  branch_id?: number;
  position: string;
  date_of_joining: string;
  salary: number;
  status: 'Active' | 'Inactive' | 'On Leave';
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

interface Department {
  id: number;
  name: string;
  branch_id?: number;
}

interface Branch {
  id: number;
  name: string;
  address?: string;
}

const Employees: React.FC = () => {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [createEmployeeDialogOpen, setCreateEmployeeDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    branch_id: '',
    department_id: '',
    position: '',
    salary: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    status: 'Active' as 'Active' | 'Inactive' | 'On Leave',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  });

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter employees based on search and filters
  useEffect(() => {
    let filtered = employees;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.first_name.toLowerCase().includes(searchLower) ||
        emp.last_name.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower) ||
        emp.position.toLowerCase().includes(searchLower) ||
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchLower)
      );
    }

    if (filterDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department_id?.toString() === filterDepartment);
    }

    if (filterBranch !== 'all') {
      filtered = filtered.filter(emp => emp.branch_id?.toString() === filterBranch);
    }

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, filterDepartment, filterBranch]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [employeesResponse, branchesResponse, departmentsResponse] = await Promise.all([
        supabaseService.getEmployees(),
        supabaseService.getBranches(),
        supabaseService.getDepartments()
      ]);

      setEmployees(employeesResponse.data || []);
      setBranches(branchesResponse.data || []);
      setDepartments(departmentsResponse.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    }
    setLoading(false);
  };

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone,
        branch_id: employee.branch_id?.toString() || '',
        department_id: employee.department_id?.toString() || '',
        position: employee.position,
        salary: employee.salary.toString(),
        date_of_joining: employee.date_of_joining,
        status: employee.status,
        address: employee.address || '',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_phone: employee.emergency_contact_phone || '',
        emergency_contact_relationship: employee.emergency_contact_relationship || '',
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        branch_id: '',
        department_id: '',
        position: '',
        salary: '',
        date_of_joining: new Date().toISOString().split('T')[0],
        status: 'Active',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmployee(null);
    setError(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateEmployeeId = () => {
    const maxId = Math.max(0, ...employees.map(emp => {
      const match = emp.employee_id?.match(/EMP(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }));
    return `EMP${String(maxId + 1).padStart(3, '0')}`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.position) {
        setError('Please fill in all required fields');
        return;
      }

      if (editingEmployee) {
        // Update employee - only include changed fields
        const updateData: any = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          date_of_joining: formData.date_of_joining,
          salary: parseFloat(formData.salary) || 0,
          status: formData.status,
          address: formData.address,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_relationship: formData.emergency_contact_relationship,
        };

        // Only include department_id and branch_id if they have values
        if (formData.department_id) {
          updateData.department_id = parseInt(formData.department_id, 10);
        }
        if (formData.branch_id) {
          updateData.branch_id = parseInt(formData.branch_id, 10);
        }

        await supabaseService.updateEmployee(editingEmployee.id!, updateData);
        setSnackbarMessage('Employee updated successfully');
      } else {
        // Create new employee - all required fields must be provided
        const createData: any = {
          employee_id: generateEmployeeId(),
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          date_of_joining: formData.date_of_joining,
          salary: parseFloat(formData.salary) || 0,
          status: formData.status,
          address: formData.address || '',
          emergency_contact_name: formData.emergency_contact_name || '',
          emergency_contact_phone: formData.emergency_contact_phone || '',
          emergency_contact_relationship: formData.emergency_contact_relationship || '',
          department_id: formData.department_id ? parseInt(formData.department_id, 10) : 1, // Default department
          branch_id: formData.branch_id ? parseInt(formData.branch_id, 10) : 1, // Default branch
        };

        await supabaseService.createEmployee(createData);
        setSnackbarMessage('Employee created successfully');
      }

      setSnackbarOpen(true);
      handleCloseDialog();
      loadInitialData(); // Reload data
    } catch (err) {
      console.error('Error saving employee:', err);
      setError('Failed to save employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      await supabaseService.deleteEmployee(id);
      setSnackbarMessage('Employee deleted successfully');
      setSnackbarOpen(true);
      loadInitialData(); // Reload data
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError('Failed to delete employee. Please try again.');
    }
  };

  const getDepartmentName = (departmentId: number) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'N/A';
  };

  const getBranchName = (branchId: number) => {
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'N/A';
  };

  const getAvailableDepartments = () => {
    if (!formData.branch_id) return departments;
    return departments.filter(dept => dept.branch_id?.toString() === formData.branch_id);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Employees Management
            </Typography>
            {isAdmin() && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateEmployeeDialogOpen(true)}
                disabled={loading}
              >
                Add Employee
              </Button>
            )}
          </Box>

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={filterDepartment}
                label="Department"
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <MenuItem value="all">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Branch</InputLabel>
              <Select
                value={filterBranch}
                label="Branch"
                onChange={(e) => setFilterBranch(e.target.value)}
              >
                <MenuItem value="all">All Branches</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading && !openDialog && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Employees Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Employee</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Hire Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {employee.first_name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {employee.first_name} {employee.last_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {employee.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {employee.position}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {employee.employee_id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{getDepartmentName(employee.department_id || 0)}</TableCell>
                    <TableCell>{getBranchName(employee.branch_id || 0)}</TableCell>
                    <TableCell>
                      {new Date(employee.date_of_joining).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.status}
                        color={employee.status === 'Active' ? 'success' : 'default'}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleOpenDialog(employee)}
                        color="primary"
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(employee.id!)}
                        color="error"
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEmployees.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        No employees found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Employee Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                required
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Branch</InputLabel>
                <Select
                  value={formData.branch_id}
                  label="Branch"
                  onChange={(e) => handleInputChange('branch_id', e.target.value)}
                >
                  <MenuItem value="">Select Branch</MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.department_id}
                  label="Department"
                  onChange={(e) => handleInputChange('department_id', e.target.value)}
                  disabled={!formData.branch_id}
                >
                  <MenuItem value="">Select Department</MenuItem>
                  {getAvailableDepartments().map((dept) => (
                    <MenuItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Position"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Salary"
                type="number"
                value={formData.salary}
                onChange={(e) => handleInputChange('salary', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Hire Date"
                type="date"
                value={formData.date_of_joining}
                onChange={(e) => handleInputChange('date_of_joining', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="On Leave">On Leave</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              label="Address"
              multiline
              rows={2}
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />

            <Typography variant="h6" sx={{ mt: 2 }}>Emergency Contact</Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                value={formData.emergency_contact_name}
                onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
              />
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
              />
            </Box>

            <TextField
              fullWidth
              label="Relationship"
              value={formData.emergency_contact_relationship}
              onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : (editingEmployee ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Employee Dialog */}
      <CreateEmployeeDialog
        open={createEmployeeDialogOpen}
        onClose={() => setCreateEmployeeDialogOpen(false)}
        onSuccess={() => {
          loadInitialData(); // Refresh employee list
          setSnackbarMessage('Employee account created successfully!');
          setSnackbarOpen(true);
        }}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default Employees;