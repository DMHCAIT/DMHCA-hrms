
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme';
import { DataProvider } from './providers/DataProvider';
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
// RS 9W integration removed

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DataProvider>
        <Router>
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
            </Routes>
          </Layout>
        </Router>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App
