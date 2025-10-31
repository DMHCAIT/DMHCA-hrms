// Leave Management System Types
// Comprehensive leave policies with automatic calculations

export interface LeaveType {
  id: number;
  name: string;
  code: string;
  max_days_per_year: number;
  max_days_per_month?: number;
  is_carry_forward: boolean;
  carry_forward_limit?: number;
  expiry_days?: number; // For comp-off leaves
  requires_approval: boolean;
  approval_levels: string[];
  documentation_required: boolean;
  gender_specific?: 'male' | 'female' | null;
  eligibility_criteria: LeaveEligibilityCriteria;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveEligibilityCriteria {
  min_service_months?: number;
  employee_status: ('probation' | 'permanent' | 'both')[];
  max_children_count?: number; // For maternity leave
  one_time_only?: boolean; // For marriage leave
  work_on_holiday_required?: boolean; // For comp-off
  within_weeks_of_event?: number; // For paternity leave
}

export interface EmployeeLeaveBalance {
  id: number;
  employee_id: number;
  leave_type_id: number;
  leave_year: number;
  allocated_days: number;
  used_days: number;
  carried_forward_days: number;
  remaining_days: number;
  comp_off_earned: number;
  comp_off_used: number;
  comp_off_expired: number;
  last_updated: string;
  employees?: {
    first_name: string;
    last_name: string;
    employee_id: string;
    employment_status: string;
    date_of_joining: string;
    gender: string;
  };
  leave_types?: LeaveType;
}

export interface LeaveApplication {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  leave_reason: string;
  applied_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: number;
  rejected_by?: number;
  approval_date?: string;
  rejection_reason?: string;
  documentation_path?: string;
  is_half_day: boolean;
  is_emergency: boolean;
  comp_off_date?: string; // Date when overtime was worked for comp-off
  created_at: string;
  updated_at: string;
  employees?: {
    first_name: string;
    last_name: string;
    employee_id: string;
    department: string;
    employment_status: string;
  };
  leave_types?: LeaveType;
  approved_by_employee?: {
    first_name: string;
    last_name: string;
  };
}

export interface TrainingPeriodPolicy {
  employee_id: number;
  training_start_date: string;
  training_end_date: string; // 10 days from start
  first_month_end_date: string; // 30 days after training
  is_training_complete: boolean;
  first_month_performance_target: number; // 40% of monthly target
  first_month_sales_achieved: number;
  first_month_penalty_applied: boolean;
  penalty_percentage: number; // 50% if no sales
}

export interface ProbationPolicy {
  employee_id: number;
  probation_start_date: string;
  probation_end_date: string; // 3 months
  contract_bond_months: number; // 6 months
  bond_amount: number; // 6 months salary
  is_probation_complete: boolean;
  can_take_emergency_leave: boolean;
  casual_leave_per_month: number; // 1 for probation, 1 for permanent
  emergency_leave_per_month: number; // 0 for probation, 1 for permanent
}

export interface LeaveCalculationResult {
  employee_id: number;
  leave_type: string;
  requested_days: number;
  eligible_days: number;
  available_balance: number;
  can_approve: boolean;
  restrictions: string[];
  deduction_amount: number;
  policy_violations: string[];
  recommendation: 'approve' | 'reject' | 'conditional';
}

export interface PayrollLeaveImpact {
  employee_id: number;
  period_id: number;
  total_leave_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  leave_deduction_amount: number;
  performance_penalty_amount: number; // For first month policy
  attendance_bonus_loss: number;
  leave_breakdown: {
    [leave_type: string]: {
      days: number;
      is_paid: boolean;
      deduction: number;
    };
  };
}

export interface CompanyEquipment {
  id: number;
  employee_id: number;
  equipment_type: 'laptop' | 'mobile' | 'charger' | 'id_card' | 'other';
  equipment_name: string;
  serial_number?: string;
  issue_date: string;
  return_date?: string;
  condition_on_issue: 'new' | 'good' | 'fair' | 'damaged';
  condition_on_return?: 'new' | 'good' | 'fair' | 'damaged';
  damage_cost?: number;
  is_returned: boolean;
  acknowledgment_signed: boolean;
  created_at: string;
  updated_at: string;
}

// Predefined Leave Types with Company Policies
export const COMPANY_LEAVE_TYPES: Omit<LeaveType, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Casual Leave',
    code: 'CL',
    max_days_per_year: 12, // 1 per month
    max_days_per_month: 1,
    is_carry_forward: false,
    requires_approval: true,
    approval_levels: ['department_head', 'hr'],
    documentation_required: false,
    eligibility_criteria: {
      employee_status: ['probation', 'permanent']
    },
    is_active: true
  },
  {
    name: 'Emergency Leave',
    code: 'EL',
    max_days_per_year: 12, // 1 per month for permanent only
    max_days_per_month: 1,
    is_carry_forward: false,
    requires_approval: true,
    approval_levels: ['department_head', 'hr', 'director'],
    documentation_required: true,
    eligibility_criteria: {
      employee_status: ['permanent']
    },
    is_active: true
  },
  {
    name: 'Sick Leave',
    code: 'SL',
    max_days_per_year: 12,
    is_carry_forward: true,
    carry_forward_limit: 6,
    requires_approval: true,
    approval_levels: ['department_head', 'hr', 'director'],
    documentation_required: true,
    eligibility_criteria: {
      employee_status: ['probation', 'permanent']
    },
    is_active: true
  },
  {
    name: 'Maternity Leave',
    code: 'ML',
    max_days_per_year: 182, // 26 weeks for first two children
    requires_approval: true,
    approval_levels: ['hr', 'director'],
    documentation_required: true,
    gender_specific: 'female',
    is_carry_forward: false,
    eligibility_criteria: {
      min_service_months: 12, // 80 days in 12 months
      employee_status: ['permanent'],
      max_children_count: 2 // 12 weeks for third child
    },
    is_active: true
  },
  {
    name: 'Marriage Leave',
    code: 'MAR',
    max_days_per_year: 5,
    requires_approval: true,
    approval_levels: ['hr'],
    documentation_required: true,
    is_carry_forward: false,
    eligibility_criteria: {
      employee_status: ['permanent'],
      one_time_only: true
    },
    is_active: true
  },
  {
    name: 'Paternity Leave',
    code: 'PL',
    max_days_per_year: 14,
    requires_approval: true,
    approval_levels: ['hr'],
    documentation_required: true,
    gender_specific: 'male',
    is_carry_forward: false,
    eligibility_criteria: {
      employee_status: ['permanent'],
      within_weeks_of_event: 8
    },
    is_active: true
  },
  {
    name: 'Compensatory Off',
    code: 'CO',
    max_days_per_year: 24, // Based on overtime worked
    expiry_days: 56, // 8 weeks maximum
    requires_approval: true,
    approval_levels: ['immediate_manager', 'hr'],
    documentation_required: false,
    is_carry_forward: false,
    eligibility_criteria: {
      employee_status: ['permanent'],
      work_on_holiday_required: true
    },
    is_active: true
  },
  {
    name: 'Bereavement Leave',
    code: 'BL',
    max_days_per_year: 5,
    requires_approval: true,
    approval_levels: ['department_head', 'hr'],
    documentation_required: true,
    is_carry_forward: false,
    eligibility_criteria: {
      employee_status: ['probation', 'permanent']
    },
    is_active: true
  }
];

export interface LeavePolicy {
  // First Month Policy
  first_month_no_leaves: boolean;
  first_month_min_performance: number; // 40%
  first_month_salary_withhold_on_failure: boolean;

  // Training Period Policy  
  training_period_days: number; // 10 days
  no_performance_targets_during_training: boolean;

  // Probation Policy
  probation_period_months: number; // 3 months
  contract_bond_months: number; // 6 months
  bond_penalty_amount_months: number; // 6 months salary

  // Leave Allocation Rules
  casual_leave_probation_per_month: number; // 1
  casual_leave_permanent_per_month: number; // 1
  emergency_leave_probation_per_month: number; // 0
  emergency_leave_permanent_per_month: number; // 1

  // Maternity Leave Rules
  maternity_weeks_first_two_children: number; // 26
  maternity_weeks_third_child: number; // 12
  maternity_min_service_days: number; // 80 days in 12 months

  // Marriage Leave Rules
  marriage_leave_days: number; // 5
  marriage_leave_lifetime_limit: number; // 1

  // Paternity Leave Rules
  paternity_leave_days: number; // 14
  paternity_claim_within_weeks: number; // 8

  // Comp-off Rules
  comp_off_expiry_weeks: number; // 4-8 weeks
  comp_off_max_expiry_weeks: number; // 8

  // General Rules
  jurisdiction: string; // Delhi
  equipment_damage_compensation_required: boolean;
}