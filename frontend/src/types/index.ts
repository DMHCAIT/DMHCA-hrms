export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  dateOfJoining: Date;
  salary: number;
  manager?: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  avatar?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  totalHours: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Holiday';
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'Sick' | 'Vacation' | 'Personal' | 'Maternity' | 'Paternity' | 'Emergency';
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: Date;
  approvedBy?: string;
  approvedOn?: Date;
  comments?: string;
}

export interface LeaveBalance {
  employeeId: string;
  sick: number;
  vacation: number;
  personal: number;
  total: number;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: Date;
  projectName: string;
  taskDescription: string;
  hoursWorked: number;
  billable: boolean;
  status: 'Draft' | 'Submitted' | 'Approved';
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: {
    hra: number;
    transport: number;
    meal: number;
    other: number;
  };
  deductions: {
    tax: number;
    pf: number;
    insurance: number;
    other: number;
  };
  grossSalary: number;
  netSalary: number;
  status: 'Draft' | 'Processed' | 'Paid';
  payDate?: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'Meeting' | 'Holiday' | 'Event' | 'Leave' | 'Birthday' | 'Training';
  participants?: string[];
  location?: string;
  isAllDay: boolean;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  employeeCount: number;
  description?: string;
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingLeaveRequests: number;
  upcomingBirthdays: Employee[];
  recentHires: Employee[];
}