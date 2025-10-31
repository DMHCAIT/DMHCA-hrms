export interface PayrollEmployee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  department: string;
  position: string;
  base_salary: number;
  hourly_rate?: number;
  employment_type: 'full-time' | 'part-time' | 'contract';
  join_date: string;
  bank_account?: string;
  tax_id?: string;
}

export interface SalaryComponent {
  id: number;
  employee_id: number;
  component_type: 'allowance' | 'deduction';
  name: string;
  amount: number;
  percentage?: number;
  is_taxable: boolean;
  is_active: boolean;
  effective_from: string;
  created_at: string;
}

export interface PayrollPeriod {
  id: number;
  period_name: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'processing' | 'completed' | 'archived';
  created_at: string;
  processed_by?: number;
  processed_at?: string;
}

export interface Payslip {
  id: number;
  employee_id: number;
  payroll_period_id: number;
  
  // Salary breakdown
  base_salary: number;
  total_allowances: number;
  total_deductions: number;
  
  // Attendance-based calculations
  working_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  overtime_hours: number;
  
  // Calculated amounts
  gross_salary: number;
  taxable_income: number;
  tax_amount: number;
  net_salary: number;
  
  // Status
  status: 'draft' | 'approved' | 'paid';
  generated_at: string;
  approved_by?: number;
  approved_at?: string;
  paid_at?: string;
  
  // JSON fields for detailed breakdown
  allowances_breakdown: Record<string, number>;
  deductions_breakdown: Record<string, number>;

  // Joined data from relations
  employees?: PayrollEmployee;
  payroll_periods?: PayrollPeriod;
}

export interface AttendanceMachineData {
  employee_id: string;
  machine_id: string;
  timestamp: string;
  punch_type: 'check-in' | 'check-out';
  location?: string;
  device_info?: string;
}

export interface PayrollCalculationRule {
  id: number;
  rule_name: string;
  rule_type: 'tax' | 'overtime' | 'late_penalty' | 'bonus';
  condition: string; // JSON condition
  calculation_method: string; // JSON calculation formula
  is_active: boolean;
  created_at: string;
}

export interface PayrollSummary {
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  average_salary: number;
  department_wise: Record<string, {
    count: number;
    total_gross: number;
    total_net: number;
  }>;
}