
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './providers/DataProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/common/Header';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';
import ComprehensiveLeaveManagement from './pages/ComprehensiveLeaveManagement';
import Payroll from './pages/Payroll';
import Calendar from './pages/Calendar';
import TimeTracking from './pages/TimeTracking';
import Worksheets from './pages/Worksheets';
import AttendanceMachineManagement from './pages/AttendanceMachineManagement';

// Main app content component that uses auth context
const AppContent: React.FC = () => {
  const { isAdmin, isEmployee, loading } = useAuth();

  if (loading) {
    return null; // ProtectedRoute will show loading spinner
  }

  return (
    <DataProvider>
      <Router>
        {/* Show different layouts based on user role */}
        {isEmployee() && !isAdmin() ? (
          // Employee-only view with limited access
          <Box>
            <Header title="Employee Portal" />
            <EmployeeDashboard />
          </Box>
        ) : isAdmin() ? (
          // Admin view with full access to all features
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/leave" element={<LeaveManagement />} />
              <Route path="/leave-management" element={<ComprehensiveLeaveManagement />} />
              <Route path="/time-tracking" element={<TimeTracking />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/worksheets" element={<Worksheets />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/attendance-machines" element={<AttendanceMachineManagement />} />
              <Route path="/employee-view" element={<EmployeeDashboard />} />
            </Routes>
          </Layout>
        ) : null}
      </Router>
    </DataProvider>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ProtectedRoute>
          <AppContent />
        </ProtectedRoute>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App
