import React, { useState } from 'react';
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
  Paper,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Search,
  Add,
  Receipt,
  Download,
  Payment,
  TrendingUp,
} from '@mui/icons-material';
import { useHR } from '../contexts/HRContext';
import type { PayrollRecord } from '../types';

const PayrollManagement: React.FC = () => {
  const { employees, payrollRecords, processPayroll } = useHR();
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleProcessPayroll = () => {
    if (selectedEmployeeId) {
      const monthName = months[selectedMonth - 1];
      processPayroll(selectedEmployeeId, monthName, selectedYear);
      setOpenDialog(false);
      setSelectedEmployeeId('');
    }
  };

  const filteredPayroll = payrollRecords.filter(record =>
    record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Processed':
        return 'info';
      case 'Draft':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate summary statistics
  const currentMonth = months[new Date().getMonth()];
  const currentYear = new Date().getFullYear();
  
  const thisMonthPayroll = payrollRecords.filter(
    record => record.month === currentMonth && record.year === currentYear
  );

  const totalPayrollThisMonth = thisMonthPayroll.reduce((sum, record) => sum + record.netSalary, 0);
  const processedCount = thisMonthPayroll.filter(record => record.status === 'Processed' || record.status === 'Paid').length;
  const paidCount = thisMonthPayroll.filter(record => record.status === 'Paid').length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Payroll Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          sx={{ borderRadius: 2 }}
        >
          Process Payroll
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
              {formatCurrency(totalPayrollThisMonth)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Payroll ({currentMonth})
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="success.main" sx={{ fontWeight: 700 }}>
              {paidCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Employees Paid
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="info.main" sx={{ fontWeight: 700 }}>
              {processedCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Processed Records
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="warning.main" sx={{ fontWeight: 700 }}>
              {employees.length - processedCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Processing
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search payroll records by employee name, month, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 500 }}
        />
      </Box>

      {/* Payroll Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Basic Salary</TableCell>
                <TableCell>Gross Salary</TableCell>
                <TableCell>Deductions</TableCell>
                <TableCell>Net Salary</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayroll.map((record) => {
                const totalDeductions = Object.values(record.deductions).reduce((sum, val) => sum + val, 0);
                
                return (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 32, height: 32 }}>
                          {record.employeeName.split(' ')[0][0]}{record.employeeName.split(' ')[1]?.[0]}
                        </Avatar>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {record.employeeName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.month} {record.year}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(record.basicSalary)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {formatCurrency(record.grossSalary)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'error.main' }}>
                        {formatCurrency(totalDeductions)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                        {formatCurrency(record.netSalary)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        color={getStatusColor(record.status) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Receipt />}
                          onClick={() => handleViewPayslip(record)}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Download />}
                          onClick={() => handleDownloadPayslip(record)}
                        >
                          Download
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredPayroll.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No payroll records found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {searchTerm ? 'Try adjusting your search criteria.' : 'Process payroll to see records here.'}
            </Typography>
          </Box>
        )}
      </Card>

      {/* Process Payroll Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Payment sx={{ mr: 1, color: 'primary.main' }} />
            Process Payroll
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Employee</InputLabel>
              <Select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                label="Employee"
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} - {employee.position}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  label="Month"
                >
                  {months.map((month, index) => (
                    <MenuItem key={month} value={index + 1}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  label="Year"
                >
                  {[2023, 2024, 2025].map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {selectedEmployeeId && (
              <Card sx={{ mt: 2, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Payroll Preview
                  </Typography>
                  {(() => {
                    const employee = employees.find(emp => emp.id === selectedEmployeeId);
                    if (!employee) return null;

                    const basicSalary = employee.salary;
                    const allowances = {
                      hra: basicSalary * 0.4,
                      transport: 2000,
                      meal: 1500,
                      other: 1000
                    };
                    const grossSalary = basicSalary + Object.values(allowances).reduce((a, b) => a + b, 0);
                    const deductions = {
                      tax: grossSalary * 0.1,
                      pf: basicSalary * 0.12,
                      insurance: 500,
                      other: 200
                    };
                    const netSalary = grossSalary - Object.values(deductions).reduce((a, b) => a + b, 0);

                    return (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Basic Salary:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(basicSalary)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Gross Salary:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {formatCurrency(grossSalary)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Total Deductions:</Typography>
                          <Typography variant="body2" sx={{ color: 'error.main' }}>
                            {formatCurrency(Object.values(deductions).reduce((a, b) => a + b, 0))}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2">Net Salary:</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {formatCurrency(netSalary)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleProcessPayroll}
            disabled={!selectedEmployeeId}
            startIcon={<TrendingUp />}
          >
            Process Payroll
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Placeholder functions for payslip operations
const handleViewPayslip = (record: PayrollRecord) => {
  console.log('Viewing payslip for:', record.employeeName);
  alert(`Viewing payslip for ${record.employeeName} - ${record.month} ${record.year}`);
};

const handleDownloadPayslip = (record: PayrollRecord) => {
  console.log('Downloading payslip for:', record.employeeName);
  alert(`Downloading payslip for ${record.employeeName} - ${record.month} ${record.year}`);
};

export default PayrollManagement;