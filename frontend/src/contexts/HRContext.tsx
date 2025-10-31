import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Employee, Attendance, LeaveRequest, TimeEntry, PayrollRecord, CalendarEvent, DashboardStats } from '../types';

interface HRContextType {
  // Employee Management
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  getEmployeeById: (id: string) => Employee | undefined;

  // Attendance Management
  attendance: Attendance[];
  markAttendance: (employeeId: string, checkIn?: Date, checkOut?: Date) => void;
  getAttendanceByEmployee: (employeeId: string) => Attendance[];

  // Leave Management
  leaveRequests: LeaveRequest[];
  submitLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'appliedOn' | 'status'>) => void;
  approveLeaveRequest: (id: string, approvedBy: string) => void;
  rejectLeaveRequest: (id: string, comments: string) => void;

  // Time Tracking
  timeEntries: TimeEntry[];
  addTimeEntry: (entry: Omit<TimeEntry, 'id'>) => void;
  updateTimeEntry: (id: string, entry: Partial<TimeEntry>) => void;

  // Payroll
  payrollRecords: PayrollRecord[];
  processPayroll: (employeeId: string, month: string, year: number) => void;

  // Calendar
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateCalendarEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;

  // Dashboard
  getDashboardStats: () => DashboardStats;
}

const HRContext = createContext<HRContextType | undefined>(undefined);

export const useHR = () => {
  const context = useContext(HRContext);
  if (!context) {
    throw new Error('useHR must be used within an HRProvider');
  }
  return context;
};

export const HRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Initialize with empty arrays - data will be loaded from Supabase
  useEffect(() => {
    // No sample data - all data comes from Supabase database
    console.log('HR Context initialized - waiting for real data from Supabase');
  }, []);

  const addEmployee = (employeeData: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: Date.now().toString(),
    };
    setEmployees(prev => [...prev, newEmployee]);
  };

  const updateEmployee = (id: string, employeeData: Partial<Employee>) => {
    setEmployees(prev =>
      prev.map(emp => emp.id === id ? { ...emp, ...employeeData } : emp)
    );
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  const getEmployeeById = (id: string) => {
    return employees.find(emp => emp.id === id);
  };

  const markAttendance = (employeeId: string, checkIn?: Date, checkOut?: Date) => {
    const today = new Date();
    const existingAttendance = attendance.find(
      att => att.employeeId === employeeId && 
      att.date.toDateString() === today.toDateString()
    );

    if (existingAttendance) {
      setAttendance(prev =>
        prev.map(att =>
          att.id === existingAttendance.id
            ? {
                ...att,
                checkOut: checkOut || att.checkOut,
                totalHours: checkOut && att.checkIn 
                  ? (checkOut.getTime() - att.checkIn.getTime()) / (1000 * 60 * 60)
                  : att.totalHours
              }
            : att
        )
      );
    } else {
      const newAttendance: Attendance = {
        id: Date.now().toString(),
        employeeId,
        date: today,
        checkIn: checkIn || new Date(),
        checkOut: checkOut || null,
        totalHours: 0,
        status: 'Present'
      };
      setAttendance(prev => [...prev, newAttendance]);
    }
  };

  const getAttendanceByEmployee = (employeeId: string) => {
    return attendance.filter(att => att.employeeId === employeeId);
  };

  const submitLeaveRequest = (requestData: Omit<LeaveRequest, 'id' | 'appliedOn' | 'status'>) => {
    const newRequest: LeaveRequest = {
      ...requestData,
      id: Date.now().toString(),
      appliedOn: new Date(),
      status: 'Pending'
    };
    setLeaveRequests(prev => [...prev, newRequest]);
  };

  const approveLeaveRequest = (id: string, approvedBy: string) => {
    setLeaveRequests(prev =>
      prev.map(req =>
        req.id === id
          ? { ...req, status: 'Approved' as const, approvedBy, approvedOn: new Date() }
          : req
      )
    );
  };

  const rejectLeaveRequest = (id: string, comments: string) => {
    setLeaveRequests(prev =>
      prev.map(req =>
        req.id === id
          ? { ...req, status: 'Rejected' as const, comments }
          : req
      )
    );
  };

  const addTimeEntry = (entryData: Omit<TimeEntry, 'id'>) => {
    const newEntry: TimeEntry = {
      ...entryData,
      id: Date.now().toString(),
    };
    setTimeEntries(prev => [...prev, newEntry]);
  };

  const updateTimeEntry = (id: string, entryData: Partial<TimeEntry>) => {
    setTimeEntries(prev =>
      prev.map(entry => entry.id === id ? { ...entry, ...entryData } : entry)
    );
  };

  const processPayroll = (employeeId: string, month: string, year: number) => {
    const employee = getEmployeeById(employeeId);
    if (!employee) return;

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

    const newPayroll: PayrollRecord = {
      id: Date.now().toString(),
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      grossSalary,
      netSalary,
      status: 'Draft'
    };

    setPayrollRecords(prev => [...prev, newPayroll]);
  };

  const addCalendarEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: Date.now().toString(),
    };
    setCalendarEvents(prev => [...prev, newEvent]);
  };

  const updateCalendarEvent = (id: string, eventData: Partial<CalendarEvent>) => {
    setCalendarEvents(prev =>
      prev.map(event => event.id === id ? { ...event, ...eventData } : event)
    );
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents(prev => prev.filter(event => event.id !== id));
  };

  const getDashboardStats = (): DashboardStats => {
    const today = new Date();
    const todayAttendance = attendance.filter(
      att => att.date.toDateString() === today.toDateString()
    );

    return {
      totalEmployees: employees.length,
      presentToday: todayAttendance.filter(att => att.status === 'Present').length,
      onLeave: employees.filter(emp => emp.status === 'On Leave').length,
      pendingLeaveRequests: leaveRequests.filter(req => req.status === 'Pending').length,
      upcomingBirthdays: [],
      recentHires: employees
        .filter(emp => {
          const joinDate = new Date(emp.dateOfJoining);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return joinDate >= thirtyDaysAgo;
        })
        .slice(0, 5)
    };
  };

  const value: HRContextType = {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
    attendance,
    markAttendance,
    getAttendanceByEmployee,
    leaveRequests,
    submitLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    timeEntries,
    addTimeEntry,
    updateTimeEntry,
    payrollRecords,
    processPayroll,
    calendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    getDashboardStats,
  };

  return <HRContext.Provider value={value}>{children}</HRContext.Provider>;
};