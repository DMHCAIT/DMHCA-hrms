import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type Tables = Database['public']['Tables'];

class SupabaseService {
  // Health check
  async getHealthCheck() {
    try {
      const { error } = await supabase
        .from('branches')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      return { status: 'healthy', message: 'Supabase connection successful' };
    } catch (error) {
      throw new Error('Supabase connection failed');
    }
  }

  // Branch operations
  async getBranches() {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return { data };
  }

  async getBranch(id: string | number) {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return { data };
  }

  async createBranch(branch: Tables['branches']['Insert']) {
    const { data, error } = await supabase
      .from('branches')
      .insert(branch)
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  }

  async updateBranch(id: string | number, branch: Tables['branches']['Update']) {
    const { data, error } = await supabase
      .from('branches')
      .update(branch)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  }

  async deleteBranch(id: string | number) {
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  }

  // Department operations
  async getDepartments(branchId?: string | number) {
    let query = supabase
      .from('departments')
      .select(`
        *,
        branches:branch_id(name, location)
      `)
      .order('name');
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { data };
  }

  async getBranchDepartments(branchId: string | number) {
    return this.getDepartments(branchId);
  }

  // Employee operations
  async getEmployees(filters: Record<string, string | number> = {}) {
    let query = supabase
      .from('employees')
      .select(`
        *,
        departments:department_id(name),
        branches:branch_id(name, location),
        manager:manager_id(first_name, last_name)
      `)
      .order('first_name');

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { data };
  }

  async getEmployee(id: string | number) {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        departments:department_id(name),
        branches:branch_id(name, location),
        manager:manager_id(first_name, last_name)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return { data };
  }

  async getBranchEmployees(branchId: string | number) {
    return this.getEmployees({ branch_id: branchId });
  }

  async createEmployee(employee: Tables['employees']['Insert']) {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select(`
        *,
        departments:department_id(name),
        branches:branch_id(name, location)
      `)
      .single();
    
    if (error) throw error;
    return { data };
  }

  async updateEmployee(id: string | number, employee: Tables['employees']['Update']) {
    const { data, error } = await supabase
      .from('employees')
      .update(employee)
      .eq('id', id)
      .select(`
        *,
        departments:department_id(name),
        branches:branch_id(name, location)
      `)
      .single();
    
    if (error) throw error;
    return { data };
  }

  async deleteEmployee(id: string | number) {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  }

  // Attendance operations
  async getAttendance(filters: Record<string, string | number> = {}) {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        employees:employee_id(first_name, last_name, employee_id)
      `)
      .order('date', { ascending: false });

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { data };
  }

  async getEmployeeAttendance(employeeId: string | number, filters: Record<string, string | number> = {}) {
    return this.getAttendance({ employee_id: employeeId, ...filters });
  }

  async checkIn(employeeId: string | number, location = '', ipAddress = '') {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        employee_id: Number(employeeId),
        date: today,
        check_in: now,
        status: 'Present',
        location,
        ip_address: ipAddress
      })
      .select(`
        *,
        employees:employee_id(first_name, last_name, employee_id)
      `)
      .single();
    
    if (error) throw error;
    return { data };
  }

  async checkOut(employeeId: string | number, location = '', ipAddress = '') {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    
    // Find today's attendance record
    const { data: attendanceRecord, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .is('check_out', null)
      .single();
    
    if (fetchError) throw fetchError;
    if (!attendanceRecord) throw new Error('No check-in record found for today');
    
    // Calculate total hours
    const checkInTime = new Date(attendanceRecord.check_in!);
    const checkOutTime = new Date(now);
    const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    
    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_out: now,
        total_hours: Math.round(totalHours * 100) / 100,
        location,
        ip_address: ipAddress
      })
      .eq('id', attendanceRecord.id)
      .select(`
        *,
        employees:employee_id(first_name, last_name, employee_id)
      `)
      .single();
    
    if (error) throw error;
    return { data };
  }

  // Leave operations
  async getLeaves(filters: Record<string, string | number> = {}) {
    let query = supabase
      .from('leaves')
      .select(`
        *,
        employees:employee_id(first_name, last_name, employee_id),
        approver:approved_by(first_name, last_name)
      `)
      .order('applied_on', { ascending: false });

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { data };
  }

  async applyLeave(leave: Tables['leaves']['Insert']) {
    const { data, error } = await supabase
      .from('leaves')
      .insert({
        ...leave,
        applied_on: new Date().toISOString(),
        status: 'Pending'
      })
      .select(`
        *,
        employees:employee_id(first_name, last_name, employee_id)
      `)
      .single();
    
    if (error) throw error;
    return { data };
  }

  // Alias for compatibility
  async createLeaveRequest(leave: Tables['leaves']['Insert']) {
    return this.applyLeave(leave);
  }

  async updateLeaveStatus(
    leaveId: string | number, 
    status: string, 
    approvedBy: string | number, 
    rejectionReason = ''
  ) {
    const updates: Tables['leaves']['Update'] = {
      status,
      approved_by: Number(approvedBy),
      approved_on: new Date().toISOString()
    };

    if (status === 'Rejected' && rejectionReason) {
      updates.rejection_reason = rejectionReason;
    }

    const { data, error } = await supabase
      .from('leaves')
      .update(updates)
      .eq('id', leaveId)
      .select(`
        *,
        employees:employee_id(first_name, last_name, employee_id),
        approver:approved_by(first_name, last_name)
      `)
      .single();
    
    if (error) throw error;
    return { data };
  }

  // Dashboard stats
  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Get total employees
    const { count: totalEmployees } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active');

    // Get present today
    const { count: presentToday } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)
      .eq('status', 'Present');

    // Get on leave
    const { count: onLeave } = await supabase
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Approved')
      .lte('start_date', today)
      .gte('end_date', today);

    // Get pending leave requests
    const { count: pendingLeaveRequests } = await supabase
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending');

    return {
      totalEmployees: totalEmployees || 0,
      presentToday: presentToday || 0,
      onLeave: onLeave || 0,
      pendingLeaveRequests: pendingLeaveRequests || 0
    };
  }



  // Payroll operations
  async getPayrollEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        id,
        employee_id,
        first_name,
        last_name,
        department_id,
        position,
        salary,
        date_of_joining,
        phone,
        status,
        departments:department_id(name),
        branches:branch_id(name)
      `)
      .eq('status', 'Active')
      .order('first_name');
    
    if (error) throw error;
    
    // Transform data to ensure foreign key relationships are single objects
    const transformedData = data?.map((employee: any) => ({
      ...employee,
      departments: Array.isArray(employee.departments) ? employee.departments[0] : employee.departments,
      branches: Array.isArray(employee.branches) ? employee.branches[0] : employee.branches
    }));
    
    return { data: transformedData };
  }

  async getSalaryComponents(employeeId?: number) {
    let query = supabase
      .from('salary_components')
      .select('*')
      .eq('is_active', true)
      .order('component_type', { ascending: true });

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data };
  }

  async createSalaryComponent(component: any) {
    const { data, error } = await supabase
      .from('salary_components')
      .insert(component)
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  }

  async getPayrollPeriods() {
    const { data, error } = await supabase
      .from('payroll_periods')
      .select('*')
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    return { data };
  }

  async createPayrollPeriod(period: any) {
    const { data, error } = await supabase
      .from('payroll_periods')
      .insert(period)
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  }

  async getPayslips(payrollPeriodId?: number, employeeId?: number) {
    let query = supabase
      .from('payslips')
      .select(`
        *,
        employees:employee_id(first_name, last_name, employee_id, departments:department_id(name)),
        payroll_periods:period_id(period_name, start_date, end_date)
      `)
      .order('created_at', { ascending: false });

    if (payrollPeriodId) {
      query = query.eq('period_id', payrollPeriodId);
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data };
  }

  async generatePayslip(payslipData: any) {
    const { data, error } = await supabase
      .from('payslips')
      .insert(payslipData)
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  }

  async updatePayslipStatus(payslipId: number, status: string, approvedBy?: number) {
    const updateData: any = { 
      status,
      approved_at: new Date().toISOString()
    };
    
    if (approvedBy) {
      updateData.approved_by = approvedBy;
    }

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('payslips')
      .update(updateData)
      .eq('id', payslipId)
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  }

  // Attendance Machine Integration
  async recordAttendanceFromMachine(attendanceData: any) {
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        employee_id: attendanceData.employee_id,
        date: attendanceData.date,
        check_in_time: attendanceData.punch_type === 'check-in' ? attendanceData.timestamp : null,
        check_out_time: attendanceData.punch_type === 'check-out' ? attendanceData.timestamp : null,
        machine_id: attendanceData.machine_id,
        location: attendanceData.location || 'Office',
        status: 'Present'
      })
      .select()
      .single();
    
    if (error) {
      // If record exists, update it
      if (error.code === '23505') { // Unique constraint violation
        const updateData: any = {};
        if (attendanceData.punch_type === 'check-in') {
          updateData.check_in_time = attendanceData.timestamp;
        } else {
          updateData.check_out_time = attendanceData.timestamp;
        }

        const { data: updatedData, error: updateError } = await supabase
          .from('attendance')
          .update(updateData)
          .eq('employee_id', attendanceData.employee_id)
          .eq('date', attendanceData.date)
          .select()
          .single();

        if (updateError) throw updateError;
        return { data: updatedData };
      }
      throw error;
    }
    
    return { data };
  }

  // Payroll Calculations
  async calculateMonthlyAttendance(employeeId: number, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) throw error;

    // Calculate attendance statistics
    const totalDays = data.length;
    const presentDays = data.filter(record => record.status === 'Present').length;
    const absentDays = totalDays - presentDays;
    const lateDays = data.filter(record => {
      if (!record.check_in_time) return false;
      const checkInTime = new Date(record.check_in_time);
      const lateThreshold = new Date(checkInTime);
      lateThreshold.setHours(9, 30, 0, 0); // 9:30 AM threshold
      return checkInTime > lateThreshold;
    }).length;

    // Calculate overtime hours
    const overtimeHours = data.reduce((total, record) => {
      if (!record.check_in_time || !record.check_out_time) return total;
      const checkIn = new Date(record.check_in_time);
      const checkOut = new Date(record.check_out_time);
      const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      return total + Math.max(0, hoursWorked - 8); // Standard 8 hours
    }, 0);

    return {
      working_days: totalDays,
      present_days: presentDays,
      absent_days: absentDays,
      late_days: lateDays,
      overtime_hours: Math.round(overtimeHours * 100) / 100
    };
  }

  // Generate comprehensive payroll for all employees
  async generatePayrollForPeriod(payrollPeriodId: number) {
    try {
      // Get payroll period details
      const { data: period } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('id', payrollPeriodId)
        .single();

      if (!period) throw new Error('Payroll period not found');

      // Get all active employees
      const { data: employees } = await this.getPayrollEmployees();

      const generatedPayslips = [];

      for (const employee of employees || []) {
        // Calculate payslip with comprehensive leave integration
        const payslip = await this.calculatePayrollWithLeaves(employee.id, payrollPeriodId);
        
        // Generate payslip record
        const { data: generatedPayslip } = await this.generatePayslip({
          ...payslip,
          payroll_period_id: payrollPeriodId,
          employee_id: employee.id,
          generated_at: new Date().toISOString(),
          status: 'draft'
        });

        generatedPayslips.push(generatedPayslip);
      }

      return { data: generatedPayslips };
    } catch (error) {
      throw error;
    }
  }

  private async calculatePayslip(employee: any, attendanceStats: any, components: any[], _period: any) {
    const baseSalary = employee.base_salary || 0;
    
    // Calculate pro-rated salary based on attendance
    const attendanceRatio = attendanceStats.present_days / attendanceStats.working_days;
    const proRatedBaseSalary = baseSalary * attendanceRatio;

    // Calculate allowances and deductions
    let totalAllowances = 0;
    let totalDeductions = 0;
    const allowancesBreakdown: Record<string, number> = {};
    const deductionsBreakdown: Record<string, number> = {};

    components.forEach(component => {
      const amount = component.percentage 
        ? (baseSalary * component.percentage / 100)
        : component.amount;

      if (component.component_type === 'allowance') {
        totalAllowances += amount;
        allowancesBreakdown[component.name] = amount;
      } else {
        totalDeductions += amount;
        deductionsBreakdown[component.name] = amount;
      }
    });

    // Add overtime pay
    const overtimePay = (attendanceStats.overtime_hours || 0) * (employee.hourly_rate || baseSalary / (22 * 8));
    totalAllowances += overtimePay;
    if (overtimePay > 0) {
      allowancesBreakdown['Overtime Pay'] = overtimePay;
    }

    // Calculate late penalty
    const latePenalty = attendanceStats.late_days * (baseSalary / 30); // One day salary per late day
    totalDeductions += latePenalty;
    if (latePenalty > 0) {
      deductionsBreakdown['Late Penalty'] = latePenalty;
    }

    // Calculate gross salary
    const grossSalary = proRatedBaseSalary + totalAllowances;

    // Calculate tax (simplified 10% tax)
    const taxableIncome = grossSalary - 50000; // 50k exemption
    const taxAmount = Math.max(0, taxableIncome * 0.1);
    totalDeductions += taxAmount;
    if (taxAmount > 0) {
      deductionsBreakdown['Income Tax'] = taxAmount;
    }

    // Calculate net salary
    const netSalary = grossSalary - totalDeductions;

    return {
      base_salary: baseSalary,
      total_allowances: Math.round(totalAllowances),
      total_deductions: Math.round(totalDeductions),
      working_days: attendanceStats.working_days,
      present_days: attendanceStats.present_days,
      absent_days: attendanceStats.absent_days,
      late_days: attendanceStats.late_days,
      overtime_hours: attendanceStats.overtime_hours,
      gross_salary: Math.round(grossSalary),
      taxable_income: Math.round(Math.max(0, taxableIncome)),
      tax_amount: Math.round(taxAmount),
      net_salary: Math.round(netSalary),
      allowances_breakdown: allowancesBreakdown,
      deductions_breakdown: deductionsBreakdown
    };
  }

  // Get payroll summary for a period
  async getPayrollSummary(payrollPeriodId: number) {
    const { data: payslips } = await this.getPayslips(payrollPeriodId);
    
    if (!payslips || payslips.length === 0) {
      return {
        total_employees: 0,
        total_gross: 0,
        total_deductions: 0,
        total_net: 0,
        average_salary: 0,
        department_wise: {}
      };
    }

    const totalEmployees = payslips.length;
    const totalGross = payslips.reduce((sum, p) => sum + (p.gross_salary || 0), 0);
    const totalDeductions = payslips.reduce((sum, p) => sum + (p.total_deductions || 0), 0);
    const totalNet = payslips.reduce((sum, p) => sum + (p.net_salary || 0), 0);

    // Department-wise breakdown
    const departmentWise: Record<string, any> = {};
    payslips.forEach(payslip => {
      const dept = payslip.employees?.department || 'Unknown';
      if (!departmentWise[dept]) {
        departmentWise[dept] = { count: 0, total_gross: 0, total_net: 0 };
      }
      departmentWise[dept].count++;
      departmentWise[dept].total_gross += payslip.gross_salary || 0;
      departmentWise[dept].total_net += payslip.net_salary || 0;
    });

    return {
      total_employees: totalEmployees,
      total_gross: Math.round(totalGross),
      total_deductions: Math.round(totalDeductions),
      total_net: Math.round(totalNet),
      average_salary: Math.round(totalNet / totalEmployees),
      department_wise: departmentWise
    };
  }

  // Attendance machine logging
  async logAttendancePunch(logData: any) {
    const { data, error } = await supabase
      .from('attendance_machine_logs')
      .insert(logData)
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  }

  // Enhanced attendance machine logging
  async logAttendanceMachine(logData: {
    machine_id: string;
    employee_id: number;
    punch_time: string;
    punch_type: string;
    machine_location: string;
    verify_type?: string;
    work_code?: number;
    device_sn?: string;
    sync_status?: string;
  }) {
    const { data, error } = await supabase
      .from('attendance_machine_logs')
      .insert({
        machine_id: logData.machine_id,
        employee_id: logData.employee_id,
        punch_time: logData.punch_time,
        punch_type: logData.punch_type,
        machine_location: logData.machine_location,
        sync_status: logData.sync_status || 'synced',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  }

  // Machine status management
  async updateMachineStatus(status: {
    machineId: string;
    isOnline: boolean;
    lastSync: Date;
    userCount: number;
    fpCount: number;
    faceCount: number;
    recordCount: number;
    deviceInfo: any;
  }) {
    // For now, we'll log the status. In a full implementation,
    // you might want to create a machine_status table
    console.log(`🔄 Machine Status Update:`, {
      machineId: status.machineId,
      isOnline: status.isOnline,
      lastSync: status.lastSync,
      deviceInfo: status.deviceInfo
    });
    
    return { success: true };
  }

  async getAttendanceMachineLogs(filters: any) {
    let query = supabase
      .from('attendance_machine_logs')
      .select('*')
      .order('processed_at', { ascending: false });

    if (filters.machine_id) {
      query = query.eq('machine_id', filters.machine_id);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data };
  }

  // ========================================
  // COMPREHENSIVE LEAVE MANAGEMENT SYSTEM
  // ========================================

  // Leave Types Management
  async getLeaveTypes() {
    // Since we don't have a leave_types table, return the enum values from the leaves table
    const leaveTypes = [
      { 
        id: 1, 
        name: 'Sick', 
        code: 'SICK', 
        max_days_per_year: 12,
        is_carry_forward: false,
        requires_approval: true,
        approval_levels: ['manager'],
        documentation_required: true,
        eligibility_criteria: {
          employee_status: ['probation', 'permanent'] as ('probation' | 'permanent' | 'both')[],
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { 
        id: 2, 
        name: 'Vacation', 
        code: 'VACATION', 
        max_days_per_year: 21,
        is_carry_forward: true,
        carry_forward_limit: 5,
        requires_approval: true,
        approval_levels: ['manager'],
        documentation_required: false,
        eligibility_criteria: {
          min_service_months: 3,
          employee_status: ['permanent'] as ('probation' | 'permanent' | 'both')[],
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { 
        id: 3, 
        name: 'Personal', 
        code: 'PERSONAL', 
        max_days_per_year: 5,
        is_carry_forward: false,
        requires_approval: true,
        approval_levels: ['manager'],
        documentation_required: false,
        eligibility_criteria: {
          employee_status: ['probation', 'permanent'] as ('probation' | 'permanent' | 'both')[],
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { 
        id: 4, 
        name: 'Maternity', 
        code: 'MATERNITY', 
        max_days_per_year: 180,
        is_carry_forward: false,
        requires_approval: true,
        approval_levels: ['manager', 'hr'],
        documentation_required: true,
        gender_specific: 'female' as 'female',
        eligibility_criteria: {
          min_service_months: 6,
          employee_status: ['permanent'] as ('probation' | 'permanent' | 'both')[],
          max_children_count: 2,
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { 
        id: 5, 
        name: 'Paternity', 
        code: 'PATERNITY', 
        max_days_per_year: 15,
        is_carry_forward: false,
        requires_approval: true,
        approval_levels: ['manager'],
        documentation_required: true,
        gender_specific: 'male' as 'male',
        eligibility_criteria: {
          employee_status: ['permanent'] as ('probation' | 'permanent' | 'both')[],
          within_weeks_of_event: 8,
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { 
        id: 6, 
        name: 'Emergency', 
        code: 'EMERGENCY', 
        max_days_per_year: 3,
        is_carry_forward: false,
        requires_approval: true,
        approval_levels: ['manager'],
        documentation_required: true,
        eligibility_criteria: {
          employee_status: ['probation', 'permanent'] as ('probation' | 'permanent' | 'both')[],
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return { data: leaveTypes };
  }

  async getLeaveType(id: string | number) {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return { data };
  }

  // Employee Leave Balances
  async getEmployeeLeaveBalances(employeeId: number, year?: number) {
    const currentYear = year || new Date().getFullYear();
    
    const { data, error } = await supabase
      .from('employee_leave_balances')
      .select(`
        *,
        employees:employee_id (
          first_name, last_name, employee_id, employment_status, date_of_joining, gender
        ),
        leave_types:leave_type_id (*)
      `)
      .eq('employee_id', employeeId)
      .eq('leave_year', currentYear);
    
    if (error) throw error;
    return { data };
  }

  async getAllEmployeeLeaveBalances(year?: number) {
    const currentYear = year || new Date().getFullYear();
    
    // Since we don't have employee_leave_balances table, we'll calculate from actual leaves
    const { data: employees } = await this.getEmployees();
    const { data: leaves } = await this.getLeaves();
    
    const balances = employees?.map(employee => {
      const employeeLeaves = leaves?.filter(leave => 
        leave.employee_id === employee.id && 
        new Date(leave.start_date).getFullYear() === currentYear &&
        leave.status === 'Approved'
      ) || [];
      
      const leaveTypes = [
        'Sick', 'Vacation', 'Personal', 'Maternity', 'Paternity', 'Emergency'
      ];
      
      return leaveTypes.map((leaveType, index) => {
        const usedDays = employeeLeaves
          .filter(leave => leave.leave_type === leaveType)
          .reduce((sum, leave) => sum + leave.days, 0);
        const allocatedDays = 20; // Default allowance
        
        return {
          id: parseInt(`${employee.id}${index + 1}`),
          employee_id: employee.id,
          leave_type_id: index + 1,
          leave_year: currentYear,
          allocated_days: allocatedDays,
          used_days: usedDays,
          carried_forward_days: 0,
          remaining_days: allocatedDays - usedDays,
          comp_off_earned: 0,
          comp_off_used: 0,
          comp_off_expired: 0,
          last_updated: new Date().toISOString(),
          employees: {
            first_name: employee.first_name,
            last_name: employee.last_name,
            employee_id: employee.employee_id,
            employment_status: employee.status || 'Active',
            date_of_joining: employee.date_of_joining || new Date().toISOString().split('T')[0],
            gender: 'Not specified'
          },
          leave_types: {
            id: index + 1,
            name: leaveType,
            code: leaveType.toUpperCase(),
            max_days_per_year: allocatedDays,
            is_carry_forward: false,
            requires_approval: true,
            approval_levels: ['manager'],
            documentation_required: false,
            eligibility_criteria: {
              employee_status: ['probation', 'permanent'] as ('probation' | 'permanent' | 'both')[],
            },
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };
      });
    }).flat() || [];
    
    return { data: balances };
  }

  // Leave Applications - using the actual 'leaves' table
  async getLeaveApplications(filters?: {
    employeeId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let query = supabase
      .from('leaves')
      .select(`
        *,
        employees:employee_id (
          first_name, last_name, employee_id, departments:department_id(name), status
        ),
        approved_by_employee:approved_by (first_name, last_name)
      `);

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('start_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('end_date', filters.endDate);
    }

    query = query.order('applied_on', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    
    // Transform data to match expected interface
    const transformedData = data?.map((leave: any) => ({
      ...leave,
      leave_types: {
        id: leave.leave_type.toLowerCase(),
        name: leave.leave_type,
        code: leave.leave_type.toUpperCase()
      }
    }));
    
    return { data: transformedData };
  }

  async applyForLeave(application: {
    employee_id: number;
    leave_type_id: number;
    start_date: string;
    end_date: string;
    leave_reason: string;
    is_half_day?: boolean;
    is_emergency?: boolean;
    comp_off_date?: string;
  }) {
    // First check eligibility and calculate days
    const eligibilityCheck = await this.checkLeaveEligibility(
      application.employee_id,
      application.leave_type_id,
      application.start_date,
      application.end_date,
      application.is_half_day || false
    );

    if (!eligibilityCheck.can_approve) {
      throw new Error(`Leave application rejected: ${eligibilityCheck.restrictions.join(', ')}`);
    }

    // Calculate total days (excluding weekends for now)
    const startDate = new Date(application.start_date);
    const endDate = new Date(application.end_date);
    let totalDays = 0;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Skip weekends (assuming Saturday = 6, Sunday = 0)
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        totalDays++;
      }
    }

    if (application.is_half_day) {
      totalDays = 0.5;
    }

    const { data, error } = await supabase
      .from('leave_applications')
      .insert({
        ...application,
        total_days: totalDays
      })
      .select(`
        *,
        employees:employee_id (first_name, last_name, employee_id, department),
        leave_types:leave_type_id (*)
      `)
      .single();

    if (error) throw error;
    return { data };
  }

  async approveLeaveApplication(applicationId: number, approvedBy: number) {
    // Get application details
    const { data: application, error: fetchError } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError) throw fetchError;
    if (!application) throw new Error('Leave application not found');

    // Update application status
    const { data, error } = await supabase
      .from('leave_applications')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approval_date: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select(`
        *,
        employees:employee_id (first_name, last_name, employee_id),
        leave_types:leave_type_id (*),
        approved_by_employee:approved_by (first_name, last_name)
      `)
      .single();

    if (error) throw error;

    // Update leave balance
    await this.updateLeaveBalance(
      application.employee_id,
      application.leave_type_id,
      application.total_days,
      'deduct'
    );

    return { data };
  }

  async rejectLeaveApplication(applicationId: number, rejectedBy: number, reason: string) {
    const { data, error } = await supabase
      .from('leave_applications')
      .update({
        status: 'rejected',
        rejected_by: rejectedBy,
        rejection_reason: reason,
        approval_date: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select(`
        *,
        employees:employee_id (first_name, last_name, employee_id),
        leave_types:leave_type_id (*),
        rejected_by_employee:rejected_by (first_name, last_name)
      `)
      .single();

    if (error) throw error;
    return { data };
  }

  // Leave Policy Engine - Core Business Logic
  async checkLeaveEligibility(
    employeeId: number, 
    leaveTypeId: number, 
    startDate: string, 
    endDate: string,
    isHalfDay: boolean = false
  ) {
    // Get employee details
    const { data: employee } = await supabase
      .from('employees')
      .select('*, employee_training_policy(*), employee_probation_policy(*)')
      .eq('id', employeeId)
      .single();

    if (!employee) throw new Error('Employee not found');

    // Get leave type details
    const { data: leaveType } = await supabase
      .from('leave_types')
      .select('*')
      .eq('id', leaveTypeId)
      .single();

    if (!leaveType) throw new Error('Leave type not found');

    // Get current leave balance
    const currentYear = new Date().getFullYear();
    const { data: balance } = await supabase
      .from('employee_leave_balances')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .eq('leave_year', currentYear)
      .single();

    // Calculate requested days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const requestedDays = isHalfDay ? 0.5 : this.calculateWorkingDays(start, end);

    const result = {
      employee_id: employeeId,
      leave_type: leaveType.name,
      requested_days: requestedDays,
      eligible_days: balance?.allocated_days || 0,
      available_balance: balance?.remaining_days || 0,
      can_approve: false,
      restrictions: [] as string[],
      deduction_amount: 0,
      policy_violations: [] as string[],
      recommendation: 'reject' as 'approve' | 'reject' | 'conditional'
    };

    // Check First Month Policy
    if (employee.employee_training_policy?.length > 0) {
      const trainingPolicy = employee.employee_training_policy[0];
      const firstMonthEndDate = new Date(trainingPolicy.first_month_end_date);
      const requestStart = new Date(startDate);

      if (requestStart <= firstMonthEndDate) {
        result.restrictions.push('No leaves permitted during first month of employment');
        return result;
      }
    }

    // Check Employment Status Eligibility
    const eligibilityCriteria = leaveType.eligibility_criteria as any;
    if (eligibilityCriteria?.employee_status && 
        !eligibilityCriteria.employee_status.includes(employee.employment_status)) {
      result.restrictions.push(`Leave type not available for ${employee.employment_status} employees`);
      return result;
    }

    // Check Emergency Leave Eligibility (Permanent Only)
    if (leaveType.code === 'EL' && employee.employment_status === 'probation') {
      result.restrictions.push('Emergency leave only available for permanent employees');
      return result;
    }

    // Check Monthly Limits
    if (leaveType.max_days_per_month) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthStart = new Date(currentYear, currentMonth, 1).toISOString();
      const monthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString();

      const { data: monthlyUsage } = await supabase
        .from('leave_applications')
        .select('total_days')
        .eq('employee_id', employeeId)
        .eq('leave_type_id', leaveTypeId)
        .eq('status', 'approved')
        .gte('start_date', monthStart)
        .lte('end_date', monthEnd);

      const usedThisMonth = monthlyUsage?.reduce((sum, leave) => sum + leave.total_days, 0) || 0;
      
      if (usedThisMonth + requestedDays > leaveType.max_days_per_month) {
        result.restrictions.push(`Monthly limit exceeded. Used: ${usedThisMonth}, Limit: ${leaveType.max_days_per_month}`);
        return result;
      }
    }

    // Check Available Balance
    if (balance && requestedDays > balance.remaining_days) {
      result.restrictions.push(`Insufficient balance. Available: ${balance.remaining_days} days`);
      return result;
    }

    // Check Gender Restrictions
    if (leaveType.gender_specific && employee.gender !== leaveType.gender_specific) {
      result.restrictions.push(`This leave type is only available for ${leaveType.gender_specific} employees`);
      return result;
    }

    // Check Maternity Leave Special Rules
    if (leaveType.code === 'ML') {
      // Check service period (80 days in 12 months)
      const joiningDate = new Date(employee.date_of_joining);
      const serviceMonths = (Date.now() - joiningDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      if (serviceMonths < 12) {
        result.restrictions.push('Minimum 12 months service required for maternity leave');
        return result;
      }
    }

    // Check Compensatory Off Expiry
    if (leaveType.code === 'CO' && balance) {
      const earnedDate = new Date(); // This should be tracked when comp-off is earned
      const expiryDate = new Date(earnedDate.getTime() + (leaveType.expiry_days || 56) * 24 * 60 * 60 * 1000);
      
      if (new Date() > expiryDate) {
        result.restrictions.push('Compensatory off has expired');
        return result;
      }
    }

    // All checks passed
    if (result.restrictions.length === 0) {
      result.can_approve = true;
      result.recommendation = 'approve';
    }

    return result;
  }

  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    let workingDays = 0;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        workingDays++;
      }
    }
    return workingDays;
  }

  private async updateLeaveBalance(
    employeeId: number, 
    leaveTypeId: number, 
    days: number, 
    operation: 'add' | 'deduct'
  ) {
    const currentYear = new Date().getFullYear();
    
    const { data: balance } = await supabase
      .from('employee_leave_balances')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .eq('leave_year', currentYear)
      .single();

    if (balance) {
      const newUsedDays = operation === 'add' 
        ? balance.used_days - days 
        : balance.used_days + days;

      await supabase
        .from('employee_leave_balances')
        .update({ 
          used_days: newUsedDays,
          last_updated: new Date().toISOString()
        })
        .eq('id', balance.id);
    }
  }

  // Training Period Management
  async getEmployeeTrainingPolicy(employeeId: number) {
    const { data, error } = await supabase
      .from('employee_training_policy')
      .select('*')
      .eq('employee_id', employeeId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return { data };
  }

  async updateTrainingProgress(employeeId: number, updates: {
    is_training_complete?: boolean;
    first_month_sales_achieved?: number;
    first_month_penalty_applied?: boolean;
  }) {
    const { data, error } = await supabase
      .from('employee_training_policy')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('employee_id', employeeId)
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  }

  // Probation Management
  async getEmployeeProbationPolicy(employeeId: number) {
    const { data, error } = await supabase
      .from('employee_probation_policy')
      .select('*')
      .eq('employee_id', employeeId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return { data };
  }

  async completeProbation(employeeId: number) {
    // Update probation status
    const { data: probationData, error: probationError } = await supabase
      .from('employee_probation_policy')
      .update({
        is_probation_complete: true,
        can_take_emergency_leave: true,
        emergency_leave_per_month: 1,
        updated_at: new Date().toISOString()
      })
      .eq('employee_id', employeeId)
      .select()
      .single();

    if (probationError) throw probationError;

    // Update employee status to permanent
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .update({ employment_status: 'permanent' })
      .eq('id', employeeId)
      .select()
      .single();

    if (employeeError) throw employeeError;

    // Update leave balances for permanent employee
    await this.initializeLeaveBalancesForEmployee(employeeId);

    return { probationData, employeeData };
  }

  private async initializeLeaveBalancesForEmployee(employeeId: number) {
    const currentYear = new Date().getFullYear();
    
    // Get all leave types
    const { data: leaveTypes } = await supabase
      .from('leave_types')
      .select('*')
      .eq('is_active', true);

    if (!leaveTypes) return;

    // Get employee details
    const { data: employee } = await supabase
      .from('employees')
      .select('employment_status')
      .eq('id', employeeId)
      .single();

    if (!employee) return;

    // Initialize balances for each leave type
    for (const leaveType of leaveTypes) {
      const eligibilityCriteria = leaveType.eligibility_criteria as any;
      
      // Check if employee is eligible
      if (eligibilityCriteria?.employee_status?.includes(employee.employment_status)) {
        let allocatedDays = 0;

        // Calculate allocation based on leave type
        if (leaveType.code === 'CL') allocatedDays = 12;
        else if (leaveType.code === 'EL' && employee.employment_status === 'permanent') allocatedDays = 12;
        else if (leaveType.code === 'SL') allocatedDays = 12;
        else if (leaveType.max_days_per_year) allocatedDays = leaveType.max_days_per_year;

        // Insert or update balance
        await supabase
          .from('employee_leave_balances')
          .upsert({
            employee_id: employeeId,
            leave_type_id: leaveType.id,
            leave_year: currentYear,
            allocated_days: allocatedDays,
            used_days: 0,
            carried_forward_days: 0
          });
      }
    }
  }

  // Company Equipment Management
  async getEmployeeEquipment(employeeId: number) {
    const { data, error } = await supabase
      .from('company_equipment')
      .select('*')
      .eq('employee_id', employeeId)
      .order('issue_date', { ascending: false });
    
    if (error) throw error;
    return { data };
  }

  async issueEquipment(equipment: {
    employee_id: number;
    equipment_type: string;
    equipment_name: string;
    serial_number?: string;
    condition_on_issue: string;
  }) {
    const { data, error } = await supabase
      .from('company_equipment')
      .insert({
        ...equipment,
        issue_date: new Date().toISOString().split('T')[0], // Today's date
        acknowledgment_signed: false,
        is_returned: false
      })
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  }

  async returnEquipment(equipmentId: number, condition: string, damageCost?: number) {
    const { data, error } = await supabase
      .from('company_equipment')
      .update({
        return_date: new Date().toISOString().split('T')[0],
        condition_on_return: condition,
        damage_cost: damageCost || 0,
        is_returned: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', equipmentId)
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  }

  // Enhanced Payroll Integration with Leave Policies
  async calculatePayrollWithLeaves(employeeId: number, periodId: number) {
    // Get payroll period details
    const { data: period } = await supabase
      .from('payroll_periods')
      .select('start_date, end_date')
      .eq('id', periodId)
      .single();

    if (!period) throw new Error('Payroll period not found');

    // Get employee details
    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (!employee) throw new Error('Employee not found');

    // Calculate attendance for the period
    const attendanceStats = await this.calculateMonthlyAttendance(
      employeeId,
      period.start_date,
      period.end_date
    );

    // Get salary components for this employee
    const { data: components } = await this.getSalaryComponents(employeeId);

    // Get base payroll calculation
    const basePayroll = await this.calculatePayslip(employee, attendanceStats, components || [], period);

    // Get approved leaves in this period
    const { data: leaves } = await supabase
      .from('leave_applications')
      .select(`
        *,
        leave_types:leave_type_id (code, name)
      `)
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .gte('start_date', period.start_date)
      .lte('end_date', period.end_date);

    // Get training/probation policies for penalties
    const { data: trainingPolicy } = await this.getEmployeeTrainingPolicy(employeeId);

    let leaveDeduction = 0;
    let performancePenalty = 0;
    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;
    const leaveBreakdown: any = {};

    // Calculate leave impact
    if (leaves) {
      for (const leave of leaves) {
        const leaveType = leave.leave_types;
        if (!leaveType) continue;

        leaveBreakdown[leaveType.name] = {
          days: leave.total_days,
          is_paid: this.isLeaveTypePaid(leaveType.code),
          deduction: 0
        };

        if (this.isLeaveTypePaid(leaveType.code)) {
          paidLeaveDays += leave.total_days;
        } else {
          unpaidLeaveDays += leave.total_days;
          // Calculate per-day salary deduction
          const perDayDeduction = basePayroll.base_salary / 30; // Assuming 30 working days
          const deduction = perDayDeduction * leave.total_days;
          leaveDeduction += deduction;
          leaveBreakdown[leaveType.name].deduction = deduction;
        }
      }
    }

    // Check first month performance penalty
    if (trainingPolicy?.data && !trainingPolicy.data.first_month_penalty_applied) {
      const firstMonthEndDate = new Date(trainingPolicy.data.first_month_end_date);
      const periodEndDate = new Date(period.end_date);

      if (periodEndDate >= firstMonthEndDate && 
          trainingPolicy.data.first_month_sales_achieved === 0) {
        // Apply 50% salary deduction for no sales
        performancePenalty = basePayroll.base_salary * 0.5;
        
        // Mark penalty as applied
        await this.updateTrainingProgress(employeeId, {
          first_month_penalty_applied: true
        });
      }
    }

    // Update payslip with leave impact
    const totalLeaveDeduction = leaveDeduction + performancePenalty;
    const adjustedGrossSalary = basePayroll.gross_salary - performancePenalty;
    const adjustedTotalDeductions = basePayroll.total_deductions + leaveDeduction;
    const adjustedNetSalary = adjustedGrossSalary - adjustedTotalDeductions;

    // Update deductions breakdown with leave impact
    const updatedDeductionsBreakdown = { ...basePayroll.deductions_breakdown };
    if (leaveDeduction > 0) {
      updatedDeductionsBreakdown['Leave Deduction'] = leaveDeduction;
    }
    if (performancePenalty > 0) {
      updatedDeductionsBreakdown['Performance Penalty (First Month)'] = performancePenalty;
    }

    return {
      ...basePayroll,
      gross_salary: Math.round(adjustedGrossSalary),
      total_deductions: Math.round(adjustedTotalDeductions),
      net_salary: Math.round(adjustedNetSalary),
      deductions_breakdown: updatedDeductionsBreakdown,
      leave_deduction_amount: Math.round(leaveDeduction),
      performance_penalty_amount: Math.round(performancePenalty),
      total_leave_impact: Math.round(totalLeaveDeduction),
      paid_leave_days: paidLeaveDays,
      unpaid_leave_days: unpaidLeaveDays,
      leave_breakdown: leaveBreakdown
    };
  }

  private isLeaveTypePaid(leaveCode: string): boolean {
    // Define which leave types are paid
    const paidLeaveTypes = ['CL', 'EL', 'SL', 'ML', 'MAR', 'PL', 'BL', 'CO'];
    return paidLeaveTypes.includes(leaveCode);
  }

  // Leave Analytics and Reporting
  async getLeaveAnalytics(filters?: {
    department?: string;
    branch?: string;
    year?: number;
  }) {
    const year = filters?.year || new Date().getFullYear();

    let query = supabase
      .from('employee_leave_balances')
      .select(`
        *,
        employees:employee_id (
          first_name, last_name, department, branch_id,
          branches:branch_id (name)
        ),
        leave_types:leave_type_id (name, code)
      `)
      .eq('leave_year', year);

    if (filters?.department) {
      query = query.eq('employees.department', filters.department);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Calculate analytics
    const analytics = {
      total_employees: 0,
      total_allocated_days: 0,
      total_used_days: 0,
      utilization_percentage: 0,
      leave_type_breakdown: {} as any,
      department_breakdown: {} as any
    };

    if (data) {
      analytics.total_employees = new Set(data.map(d => d.employee_id)).size;
      analytics.total_allocated_days = data.reduce((sum, d) => sum + d.allocated_days, 0);
      analytics.total_used_days = data.reduce((sum, d) => sum + d.used_days, 0);
      analytics.utilization_percentage = (analytics.total_used_days / analytics.total_allocated_days) * 100;

      // Group by leave type
      data.forEach(item => {
        const leaveTypeName = item.leave_types?.name || 'Unknown';
        if (!analytics.leave_type_breakdown[leaveTypeName]) {
          analytics.leave_type_breakdown[leaveTypeName] = {
            allocated: 0,
            used: 0,
            remaining: 0
          };
        }
        analytics.leave_type_breakdown[leaveTypeName].allocated += item.allocated_days;
        analytics.leave_type_breakdown[leaveTypeName].used += item.used_days;
        analytics.leave_type_breakdown[leaveTypeName].remaining += item.remaining_days;
      });

      // Group by department
      data.forEach(item => {
        const department = (item.employees as any)?.department || 'Unknown';
        if (!analytics.department_breakdown[department]) {
          analytics.department_breakdown[department] = {
            employees: new Set(),
            allocated: 0,
            used: 0
          };
        }
        analytics.department_breakdown[department].employees.add(item.employee_id);
        analytics.department_breakdown[department].allocated += item.allocated_days;
        analytics.department_breakdown[department].used += item.used_days;
      });

      // Convert sets to counts
      Object.keys(analytics.department_breakdown).forEach(dept => {
        analytics.department_breakdown[dept].employee_count = 
          analytics.department_breakdown[dept].employees.size;
        delete analytics.department_breakdown[dept].employees;
      });
    }

    return analytics;
  }

}

// Export singleton instance
export const supabaseService = new SupabaseService();
export default supabaseService;