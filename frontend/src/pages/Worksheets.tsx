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
  TextField,

  Chip,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  FileDownload,
  Print,
  Assessment,
  PieChart,
  BarChart,
  Timeline,
  TableChart,
  Description,
  Refresh,
} from '@mui/icons-material';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useHR } from '../contexts/HRContext';
import { apiService } from '../services/api';

const Worksheets: React.FC = () => {
  const { employees, attendance, leaveRequests, payrollRecords } = useHR();
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedReport, setSelectedReport] = useState('employee-summary');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(2024, 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  
  // Real data from Supabase
  const [realEmployees, setRealEmployees] = useState<any[]>([]);
  const [realDepartments, setRealDepartments] = useState<any[]>([]);
  const [realAttendance, setRealAttendance] = useState<any[]>([]);

  // Load real data from Supabase
  useEffect(() => {
    const loadWorksheetData = async () => {
      try {
        // Load all necessary data
        const [employeesRes, departmentsRes, attendanceRes] = await Promise.all([
          apiService.getEmployees(),
          apiService.getDepartments(),
          apiService.getAttendance()
        ]);
        
        setRealEmployees(employeesRes.data || []);
        setRealDepartments(departmentsRes.data || []);
        setRealAttendance(attendanceRes.data || []);
        
      } catch (err) {
        console.error('Error loading worksheet data:', err);
      }
    };
    
    loadWorksheetData();
  }, []);

  // Sample report data
  const reportTemplates = [
    { id: 'employee-summary', name: 'Employee Summary Report', icon: <TableChart />, type: 'table' },
    { id: 'attendance-stats', name: 'Attendance Statistics', icon: <BarChart />, type: 'chart' },
    { id: 'leave-analysis', name: 'Leave Analysis', icon: <PieChart />, type: 'chart' },
    { id: 'payroll-summary', name: 'Payroll Summary', icon: <Assessment />, type: 'table' },
    { id: 'department-overview', name: 'Department Overview', icon: <Timeline />, type: 'mixed' },
  ];

  // Generate report data based on selected report using real Supabase data
  const generateReportData = () => {
    // Use real Supabase data if available, otherwise fallback to context data
    const employeeData = realEmployees.length > 0 ? realEmployees : employees;
    const attendanceData = realAttendance.length > 0 ? realAttendance : attendance;
    const departmentData = realDepartments.length > 0 ? realDepartments : [];
    
    switch (selectedReport) {
      case 'employee-summary':
        return employeeData.map((emp: any) => {
          // Find department info for this employee
          const empDepartment = departmentData.find((d: any) => d.id === emp.department_id);
          
          return {
            id: emp.id,
            name: emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : `${emp.firstName || ''} ${emp.lastName || ''}`,
            department: empDepartment?.name || emp.department || 'Unknown',
            position: emp.position,
            status: emp.status,
            joinDate: emp.date_of_joining || new Date().toLocaleDateString(),
            attendance: attendanceData.filter((a: any) => a.employee_id === emp.id).length,
            leaves: leaveRequests.filter(l => l.employeeId === emp.id && l.status === 'Approved').length,
          };
        });

      case 'attendance-stats':
        // Group by departments from real data
        const departments = departmentData.length > 0 
          ? departmentData 
          : [...new Set(employeeData.map((e: any) => e.department || 'Unknown'))];
        
        return departments.map((dept: any) => {
          const deptName = typeof dept === 'string' ? dept : dept.name;
          const deptId = typeof dept === 'string' ? null : dept.id;
          
          const deptEmployees = employeeData.filter((e: any) => 
            deptId ? e.department_id === deptId : e.department === deptName
          );
          
          const totalAttendance = deptEmployees.reduce((sum: number, emp: any) => {
            return sum + attendanceData.filter((a: any) => a.employee_id === emp.id).length;
          }, 0);
          
          return {
            department: deptName,
            totalDays: totalAttendance,
            avgAttendance: deptEmployees.length > 0 ? Math.round((totalAttendance / deptEmployees.length) * 10) / 10 : 0,
          };
        });

      case 'leave-analysis':
        const leaveTypes = ['Annual', 'Sick', 'Personal', 'Maternity'];
        return leaveTypes.map(type => ({
          name: type,
          value: leaveRequests.filter(l => l.leaveType === type && l.status === 'Approved').length,
        }));

      case 'payroll-summary':
        return payrollRecords.map(record => {
          const employee = employeeData.find((e: any) => e.id === record.employeeId);
          const empDepartment = departmentData.find((d: any) => d.id === employee?.department_id);
          
          return {
            id: record.id,
            employeeName: employee ? 
              (employee.first_name ? `${employee.first_name} ${employee.last_name}` : `${employee.firstName} ${employee.lastName}`) 
              : 'Unknown',
            department: empDepartment?.name || employee?.department || 'Unknown',
            baseSalary: record.basicSalary,
            totalDeductions: record.deductions.tax + record.deductions.pf + record.deductions.insurance + record.deductions.other,
            netSalary: record.netSalary,
            payPeriod: `${record.month}/${record.year}`,
          };
        });

      case 'department-overview':
        return departmentData.map((dept: any) => ({
          id: dept.id,
          name: dept.name,
          branch: dept.branches?.name || 'Unknown',
          head: dept.head || 'Not Assigned',
          employeeCount: dept.employee_count || 0,
          status: 'Active'
        }));

      default:
        return [];
    }
  };

  const reportData = generateReportData();

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  const renderChart = () => {

    
    if (selectedReport === 'attendance-stats') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="avgAttendance" fill="#8884d8" />
          </RechartsBarChart>
        </ResponsiveContainer>
      );
    }

    if (selectedReport === 'leave-analysis') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={reportData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {reportData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  const renderTable = () => {
    if (reportData.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No data available for the selected report
        </Typography>
      );
    }

    const headers = Object.keys(reportData[0]);

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableCell key={header} sx={{ fontWeight: 600 }}>
                  {header.charAt(0).toUpperCase() + header.slice(1).replace(/([A-Z])/g, ' $1')}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.map((row, index) => (
              <TableRow key={index}>
                {headers.map((header) => (
                  <TableCell key={header}>
                    {typeof (row as any)[header] === 'number' && (header.includes('salary') || header.includes('Salary'))
                      ? `$${(row as any)[header].toLocaleString()}`
                      : (row as any)[header]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Sample worksheets data
  const worksheets = [
    {
      id: '1',
      name: 'Employee Onboarding Checklist',
      description: 'Complete checklist for new employee onboarding process',
      category: 'HR Process',
      lastModified: '2024-01-15',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Performance Evaluation Form',
      description: 'Annual performance review template',
      category: 'Performance',
      lastModified: '2024-01-10',
      status: 'Active',
    },
    {
      id: '3',
      name: 'Leave Request Template',
      description: 'Standard leave application form',
      category: 'Leave Management',
      lastModified: '2024-01-08',
      status: 'Active',
    },
    {
      id: '4',
      name: 'Exit Interview Form',
      description: 'Employee exit interview questionnaire',
      category: 'HR Process',
      lastModified: '2024-01-05',
      status: 'Draft',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Worksheets & Reports
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={printReport}
          >
            Print
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={() => exportToCSV(reportData, selectedReport)}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab label="Reports" />
          <Tab label="Worksheets" />
        </Tabs>
      </Box>

      {/* Reports Tab */}
      {currentTab === 0 && (
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Report Selection */}
          <Box sx={{ width: 300 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Available Reports
                </Typography>
                <List sx={{ p: 0 }}>
                  {reportTemplates.map((report) => (
                    <ListItem
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      sx={{ 
                        borderRadius: 1, 
                        mb: 1, 
                        cursor: 'pointer', 
                        bgcolor: selectedReport === report.id ? 'primary.50' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' } 
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {report.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={report.name}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* Report Content */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {reportTemplates.find(r => r.id === selectedReport)?.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Start Date"
                      type="date"
                      size="small"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      size="small"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      size="small"
                    >
                      Refresh
                    </Button>
                  </Box>
                </Box>

                {/* Chart Display */}
                {(selectedReport === 'attendance-stats' || selectedReport === 'leave-analysis') && (
                  <Box sx={{ mb: 3 }}>
                    {renderChart()}
                  </Box>
                )}

                {/* Table Display */}
                {renderTable()}
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Worksheets Tab */}
      {currentTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                HR Worksheets & Templates
              </Typography>
              <Button variant="contained" startIcon={<Description />}>
                Create New Worksheet
              </Button>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
              {worksheets.map((worksheet) => (
                <Box key={worksheet.id}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Description sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {worksheet.name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {worksheet.description}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Chip
                              label={worksheet.category}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              label={worksheet.status}
                              size="small"
                              color={worksheet.status === 'Active' ? 'success' : 'default'}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Last modified: {worksheet.lastModified}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button size="small" variant="outlined">
                              Edit
                            </Button>
                            <Button size="small" variant="outlined">
                              Download
                            </Button>
                          </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
      )}
    </Box>
  );
};

export default Worksheets;