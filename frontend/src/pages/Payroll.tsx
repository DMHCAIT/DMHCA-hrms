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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add,
  Calculate,
  Download,
  Visibility,
  CheckCircle,

  Print,
  Edit,
} from '@mui/icons-material';
import { supabaseService } from '../services/supabase';

interface PayrollEmployee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  department_id?: number;
  position: string;
  salary?: number;
  date_of_joining?: string;
  phone?: string;
  status?: string;
  departments?: {
    name: string;
  } | null;
  branches?: {
    name: string;
  } | null;
}

interface PayrollPeriod {
  id: number;
  period_name: string;
  start_date: string;
  end_date: string;
  is_processed: boolean;
  created_at?: string;
  processed_at?: string;
  processed_by?: number;
}

interface Payslip {
  id: number;
  employee_id: number;
  period_id: number;
  base_salary: number;
  working_days: number;
  present_days: number;
  overtime_hours: number;
  overtime_amount: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  allowances_breakdown: any;
  deductions_breakdown: any;
  status: string;
  approved_by?: number;
  approved_at?: string;
  paid_at?: string;
  created_at?: string;
  employees?: PayrollEmployee;
  payroll_periods?: PayrollPeriod;
}

interface PayrollSummary {
  totalEmployees: number;
  totalEarnings: number;
  totalDeductions: number;
  netPayroll: number;
  pendingPayslips: number;
  approvedPayslips: number;
  paidPayslips: number;
}



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
      id={`payroll-tabpanel-${index}`}
      aria-labelledby={`payroll-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Payroll: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Dialog states
  const [periodDialog, setPeriodDialog] = useState(false);
  const [payslipDialog, setPayslipDialog] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [componentDialog, setComponentDialog] = useState(false);

  // Form states
  const [periodForm, setPeriodForm] = useState({
    period_name: '',
    start_date: '',
    end_date: ''
  });

  const [componentForm, setComponentForm] = useState({
    employee_id: '',
    component_type: 'allowance' as 'allowance' | 'deduction',
    name: '',
    amount: 0,
    percentage: 0,
    is_taxable: true,
    calculation_type: 'fixed' as 'fixed' | 'percentage'
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadPayrollData();
    }
  }, [selectedPeriod]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [employeesRes, periodsRes] = await Promise.all([
        supabaseService.getPayrollEmployees(),
        supabaseService.getPayrollPeriods()
      ]);

      setEmployees(employeesRes.data || []);
      setPayrollPeriods(periodsRes.data || []);
      
      // Select the latest period by default
      if (periodsRes.data && periodsRes.data.length > 0) {
        setSelectedPeriod(periodsRes.data[0].id);
      }

    } catch (err) {
      console.error('Error loading payroll data:', err);
      setError('Failed to load payroll data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPayrollData = async () => {
    if (!selectedPeriod) return;

    try {
      const payslipsRes = await supabaseService.getPayslips(selectedPeriod);
      const payslipsData = payslipsRes.data || [];
      
      setPayslips(payslipsData);
      
      // Calculate summary from payslips data
      const summary: PayrollSummary = {
        totalEmployees: payslipsData.length,
        totalEarnings: payslipsData.reduce((sum, p) => sum + p.gross_salary, 0),
        totalDeductions: payslipsData.reduce((sum, p) => sum + p.total_deductions, 0),
        netPayroll: payslipsData.reduce((sum, p) => sum + p.net_salary, 0),
        pendingPayslips: payslipsData.filter(p => p.status === 'draft').length,
        approvedPayslips: payslipsData.filter(p => p.status === 'approved').length,
        paidPayslips: payslipsData.filter(p => p.status === 'paid').length
      };
      
      setPayrollSummary(summary);

    } catch (err) {
      console.error('Error loading payroll period data:', err);
      showSnackbar('Failed to load payroll period data', 'error');
    }
  };

  const handleCreatePeriod = async () => {
    try {
      if (!periodForm.period_name || !periodForm.start_date || !periodForm.end_date) {
        showSnackbar('Please fill all required fields', 'error');
        return;
      }

      const newPeriod = await supabaseService.createPayrollPeriod({
        ...periodForm,
        is_processed: false
      });

      setPayrollPeriods(prev => [newPeriod.data, ...prev]);
      setSelectedPeriod(newPeriod.data.id);
      setPeriodDialog(false);
      setPeriodForm({ period_name: '', start_date: '', end_date: '' });
      showSnackbar('Payroll period created successfully', 'success');

    } catch (err) {
      console.error('Error creating payroll period:', err);
      showSnackbar('Failed to create payroll period', 'error');
    }
  };

  const handleGeneratePayroll = async () => {
    if (!selectedPeriod) {
      showSnackbar('Please select a payroll period', 'warning');
      return;
    }

    try {
      setProcessing(true);
      
      // Generate payslips for all employees in the selected period
      const generatedCount = employees.length;
      
      for (const employee of employees) {
        const payslipData = {
          employee_id: employee.id,
          period_id: selectedPeriod,
          base_salary: employee.salary || 0,
          working_days: 22, // Default working days
          present_days: 22, // Default present days
          overtime_hours: 0,
          overtime_amount: 0,
          gross_salary: employee.salary || 0,
          total_deductions: 0,
          net_salary: employee.salary || 0,
          allowances_breakdown: {},
          deductions_breakdown: {},
          status: 'draft'
        };
        
        try {
          await supabaseService.generatePayslip(payslipData);
        } catch (err) {
          console.error('Error generating payslip for employee:', employee.employee_id, err);
        }
      }
      
      showSnackbar(`Generated ${generatedCount} payslips successfully`, 'success');
      loadPayrollData(); // Reload data

    } catch (err) {
      console.error('Error generating payroll:', err);
      showSnackbar('Failed to generate payroll', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleApprovePayslip = async (payslipId: number) => {
    try {
      await supabaseService.updatePayslipStatus(payslipId, 'approved', 1); // Assuming admin user ID = 1
      showSnackbar('Payslip approved successfully', 'success');
      loadPayrollData();
    } catch (err) {
      console.error('Error approving payslip:', err);
      showSnackbar('Failed to approve payslip', 'error');
    }
  };

  const handleAddComponent = async () => {
    try {
      if (!componentForm.employee_id || !componentForm.name) {
        showSnackbar('Please fill all required fields', 'error');
        return;
      }

      await supabaseService.createSalaryComponent({
        employee_id: Number(componentForm.employee_id),
        component_type: componentForm.component_type,
        name: componentForm.name,
        amount: componentForm.calculation_type === 'fixed' ? componentForm.amount : 0,
        percentage: componentForm.calculation_type === 'percentage' ? componentForm.percentage : 0,
        is_taxable: componentForm.is_taxable,
        is_active: true,
        effective_from: new Date().toISOString()
      });

      setComponentDialog(false);
      setComponentForm({
        employee_id: '',
        component_type: 'allowance',
        name: '',
        amount: 0,
        percentage: 0,
        is_taxable: true,
        calculation_type: 'fixed'
      });
      showSnackbar('Salary component added successfully', 'success');

    } catch (err) {
      console.error('Error adding salary component:', err);
      showSnackbar('Failed to add salary component', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'paid': return 'info';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Payroll Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setPeriodDialog(true)}
          >
            New Period
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setComponentDialog(true)}
          >
            Add Component
          </Button>
          <Button
            variant="contained"
            startIcon={processing ? <CircularProgress size={20} /> : <Calculate />}
            onClick={handleGeneratePayroll}
            disabled={processing || !selectedPeriod}
          >
            {processing ? 'Generating...' : 'Generate Payroll'}
          </Button>
        </Box>
      </Box>

      {/* Period Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">Payroll Period:</Typography>
            <FormControl sx={{ minWidth: 300 }}>
              <Select
                value={selectedPeriod || ''}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              >
                {payrollPeriods.map((period) => (
                  <MenuItem key={period.id} value={period.id}>
                    {period.period_name} ({new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Chip
              label={payrollPeriods.find(p => p.id === selectedPeriod)?.is_processed ? 'Processed' : 'Draft'}
              color={payrollPeriods.find(p => p.id === selectedPeriod)?.is_processed ? 'success' : 'default'}
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Payroll Summary */}
      {payrollSummary && (
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Card sx={{ minWidth: 200, flex: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                {payrollSummary.totalEmployees}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Employees
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200, flex: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                {formatCurrency(payrollSummary.totalEarnings)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gross Salary
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200, flex: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
                {formatCurrency(payrollSummary.totalDeductions)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Deductions
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200, flex: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                {formatCurrency(payrollSummary.netPayroll)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Net Payable
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Payslips" />
          <Tab label="Department Summary" />
          <Tab label="Salary Components" />
        </Tabs>
      </Box>

      {/* Payslips Tab */}
      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Gross Salary</TableCell>
                <TableCell>Deductions</TableCell>
                <TableCell>Net Salary</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payslips.map((payslip) => (
                <TableRow key={payslip.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {payslip.employees?.first_name} {payslip.employees?.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {payslip.employees?.employee_id}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{payslip.employees?.departments?.name}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>
                    {formatCurrency(payslip.gross_salary)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'error.main' }}>
                    {formatCurrency(payslip.total_deductions)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1.1em' }}>
                    {formatCurrency(payslip.net_salary)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payslip.status}
                      color={getStatusColor(payslip.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Payslip">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedPayslip(payslip);
                            setPayslipDialog(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {payslip.status === 'draft' && (
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApprovePayslip(payslip.id)}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Download">
                        <IconButton size="small" color="primary">
                          <Download />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Department Summary Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Department Summary
        </Typography>
        <Alert severity="info">
          Department-wise summary will be implemented based on employee department data.
        </Alert>
        {/* TODO: Implement department-wise grouping from payslips data */}
      </TabPanel>

      {/* Salary Components Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="body1">
          Salary components management will be displayed here. 
          This includes allowances, deductions, and other salary components for each employee.
        </Typography>
      </TabPanel>

      {/* Create Period Dialog */}
      <Dialog open={periodDialog} onClose={() => setPeriodDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Payroll Period</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Period Name"
              value={periodForm.period_name}
              onChange={(e) => setPeriodForm(prev => ({ ...prev, period_name: e.target.value }))}
              placeholder="e.g., October 2024, Q4 2024"
              fullWidth
            />
            <TextField
              label="Start Date"
              type="date"
              value={periodForm.start_date}
              onChange={(e) => setPeriodForm(prev => ({ ...prev, start_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End Date"
              type="date"
              value={periodForm.end_date}
              onChange={(e) => setPeriodForm(prev => ({ ...prev, end_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPeriodDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreatePeriod}>
            Create Period
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Component Dialog */}
      <Dialog open={componentDialog} onClose={() => setComponentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Salary Component</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Employee</InputLabel>
              <Select
                value={componentForm.employee_id}
                onChange={(e) => setComponentForm(prev => ({ ...prev, employee_id: e.target.value }))}
                label="Employee"
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} - {emp.employee_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={componentForm.component_type}
                onChange={(e) => setComponentForm(prev => ({ ...prev, component_type: e.target.value as 'allowance' | 'deduction' }))}
                label="Type"
              >
                <MenuItem value="allowance">Allowance</MenuItem>
                <MenuItem value="deduction">Deduction</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Component Name"
              value={componentForm.name}
              onChange={(e) => setComponentForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., House Rent Allowance, Medical Insurance"
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Calculation Type</InputLabel>
              <Select
                value={componentForm.calculation_type}
                onChange={(e) => setComponentForm(prev => ({ ...prev, calculation_type: e.target.value as 'fixed' | 'percentage' }))}
                label="Calculation Type"
              >
                <MenuItem value="fixed">Fixed Amount</MenuItem>
                <MenuItem value="percentage">Percentage of Base</MenuItem>
              </Select>
            </FormControl>

            {componentForm.calculation_type === 'fixed' ? (
              <TextField
                label="Amount"
                type="number"
                value={componentForm.amount}
                onChange={(e) => setComponentForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                fullWidth
              />
            ) : (
              <TextField
                label="Percentage"
                type="number"
                value={componentForm.percentage}
                onChange={(e) => setComponentForm(prev => ({ ...prev, percentage: Number(e.target.value) }))}
                helperText="Percentage of base salary"
                fullWidth
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComponentDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddComponent}>
            Add Component
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payslip Detail Dialog */}
      <Dialog open={payslipDialog} onClose={() => setPayslipDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Payslip Details
            <Button startIcon={<Print />} variant="outlined" size="small">
              Print
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPayslip && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 250 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Employee Information</Typography>
                  <Typography><strong>Name:</strong> {selectedPayslip.employees?.first_name} {selectedPayslip.employees?.last_name}</Typography>
                  <Typography><strong>Employee ID:</strong> {selectedPayslip.employees?.employee_id}</Typography>
                  <Typography><strong>Department:</strong> {selectedPayslip.employees?.departments?.name}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 250 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Period Information</Typography>
                  <Typography><strong>Period:</strong> {selectedPayslip.payroll_periods?.period_name}</Typography>
                  <Typography><strong>Base Salary:</strong> {formatCurrency(selectedPayslip.base_salary)}</Typography>
                  <Typography><strong>Gross Salary:</strong> {formatCurrency(selectedPayslip.gross_salary)}</Typography>
                  <Typography><strong>Working Days:</strong> {selectedPayslip.working_days}</Typography>
                  <Typography><strong>Present Days:</strong> {selectedPayslip.present_days}</Typography>
                  <Typography><strong>Overtime Hours:</strong> {selectedPayslip.overtime_hours}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>Earnings</Typography>
                  <Typography>Base Salary: {formatCurrency(selectedPayslip.base_salary)}</Typography>
                  <Typography>Overtime Amount: {formatCurrency(selectedPayslip.overtime_amount)}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography sx={{ fontWeight: 600, color: 'success.main' }}>
                    Gross Salary: {formatCurrency(selectedPayslip.gross_salary)}
                  </Typography>
                </Box>
                
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>Deductions</Typography>
                  <Typography>Total Deductions: {formatCurrency(selectedPayslip.total_deductions)}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography sx={{ fontWeight: 700 }}>
                    Total Deductions: {formatCurrency(selectedPayslip.total_deductions)}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Net Pay</Typography>
                  <Typography sx={{ fontSize: '1.5em', fontWeight: 700, color: 'primary.main' }}>
                    {formatCurrency(selectedPayslip.net_salary)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayslipDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payroll;