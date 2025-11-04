-- Row Level Security (RLS) Policies for HR Software
-- Execute this after the main schema.sql

-- Enable Row Level Security on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create roles for different access levels
-- Note: These should be created at the database level, not as SQL functions

-- Policies for EMPLOYEES table
-- Allow service role full access (for backend API)
CREATE POLICY "Service role can manage employees" ON employees
    FOR ALL USING (auth.role() = 'service_role');

-- HR administrators can view and manage all employees
CREATE POLICY "HR admins can manage employees" ON employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.email = auth.jwt() ->> 'email' 
            AND e.department IN ('Human Resources', 'Administration')
            AND e.status = 'active'
        )
    );

-- Employees can view their own record
CREATE POLICY "Employees can view own record" ON employees
    FOR SELECT USING (
        email = auth.jwt() ->> 'email'
    );

-- Department heads can view their department employees
CREATE POLICY "Department heads can view department employees" ON employees
    FOR SELECT USING (
        department IN (
            SELECT d.name FROM departments d 
            JOIN employees e ON d.head_employee_id = e.id
            WHERE e.email = auth.jwt() ->> 'email'
        )
    );

-- Policies for ATTENDANCE table
-- Service role full access
CREATE POLICY "Service role can manage attendance" ON attendance
    FOR ALL USING (auth.role() = 'service_role');

-- HR admins can manage all attendance
CREATE POLICY "HR admins can manage attendance" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.email = auth.jwt() ->> 'email' 
            AND e.department IN ('Human Resources', 'Administration')
            AND e.status = 'active'
        )
    );

-- Employees can view their own attendance
CREATE POLICY "Employees can view own attendance" ON attendance
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Department heads can view their department attendance
CREATE POLICY "Department heads can view department attendance" ON attendance
    FOR SELECT USING (
        employee_id IN (
            SELECT e.id FROM employees e
            JOIN departments d ON e.department_id = d.id
            JOIN employees head ON d.head_employee_id = head.id
            WHERE head.email = auth.jwt() ->> 'email'
        )
    );

-- Biometric devices can insert attendance (using API key)
CREATE POLICY "API can insert attendance" ON attendance
    FOR INSERT WITH CHECK (true); -- API authentication handled at application level

-- Policies for LEAVE_REQUESTS table
-- Service role full access
CREATE POLICY "Service role can manage leave requests" ON leave_requests
    FOR ALL USING (auth.role() = 'service_role');

-- HR admins can manage all leave requests
CREATE POLICY "HR admins can manage leave requests" ON leave_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.email = auth.jwt() ->> 'email' 
            AND e.department IN ('Human Resources', 'Administration')
            AND e.status = 'active'
        )
    );

-- Employees can manage their own leave requests
CREATE POLICY "Employees can manage own leave requests" ON leave_requests
    FOR ALL USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Department heads can view and approve department leave requests
CREATE POLICY "Department heads can manage department leave requests" ON leave_requests
    FOR ALL USING (
        employee_id IN (
            SELECT e.id FROM employees e
            JOIN departments d ON e.department_id = d.id
            JOIN employees head ON d.head_employee_id = head.id
            WHERE head.email = auth.jwt() ->> 'email'
        )
    );

-- Policies for LEAVE_BALANCES table
-- Service role full access
CREATE POLICY "Service role can manage leave balances" ON leave_balances
    FOR ALL USING (auth.role() = 'service_role');

-- HR admins can manage all leave balances
CREATE POLICY "HR admins can manage leave balances" ON leave_balances
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.email = auth.jwt() ->> 'email' 
            AND e.department IN ('Human Resources', 'Administration')
            AND e.status = 'active'
        )
    );

-- Employees can view their own leave balance
CREATE POLICY "Employees can view own leave balance" ON leave_balances
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Department heads can view department leave balances
CREATE POLICY "Department heads can view department leave balances" ON leave_balances
    FOR SELECT USING (
        employee_id IN (
            SELECT e.id FROM employees e
            JOIN departments d ON e.department_id = d.id
            JOIN employees head ON d.head_employee_id = head.id
            WHERE head.email = auth.jwt() ->> 'email'
        )
    );

-- Policies for DEPARTMENTS table
-- Service role full access
CREATE POLICY "Service role can manage departments" ON departments
    FOR ALL USING (auth.role() = 'service_role');

-- HR admins can manage departments
CREATE POLICY "HR admins can manage departments" ON departments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.email = auth.jwt() ->> 'email' 
            AND e.department IN ('Human Resources', 'Administration')
            AND e.status = 'active'
        )
    );

-- All authenticated users can view departments
CREATE POLICY "Authenticated users can view departments" ON departments
    FOR SELECT USING (auth.jwt() IS NOT NULL);

-- Policies for AUDIT_LOGS table
-- Service role full access
CREATE POLICY "Service role can manage audit logs" ON audit_logs
    FOR ALL USING (auth.role() = 'service_role');

-- HR admins can view audit logs
CREATE POLICY "HR admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.email = auth.jwt() ->> 'email' 
            AND e.department IN ('Human Resources', 'Administration')
            AND e.status = 'active'
        )
    );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Policies for SYSTEM_SETTINGS table
-- Service role full access
CREATE POLICY "Service role can manage system settings" ON system_settings
    FOR ALL USING (auth.role() = 'service_role');

-- HR admins can manage system settings
CREATE POLICY "HR admins can manage system settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.email = auth.jwt() ->> 'email' 
            AND e.department IN ('Human Resources', 'Administration')
            AND e.status = 'active'
        )
    );

-- All authenticated users can view public system settings
CREATE POLICY "Authenticated users can view public settings" ON system_settings
    FOR SELECT USING (
        auth.jwt() IS NOT NULL 
        AND key NOT LIKE '%secret%' 
        AND key NOT LIKE '%password%'
        AND key NOT LIKE '%token%'
    );

-- Create security definer functions for common operations
-- These functions run with elevated privileges but have controlled access

-- Function to get employee by email (for authentication)
CREATE OR REPLACE FUNCTION get_employee_by_email(employee_email TEXT)
RETURNS TABLE (
    id UUID,
    employee_id VARCHAR,
    name VARCHAR,
    email VARCHAR,
    department VARCHAR,
    position VARCHAR,
    status employment_status
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT e.id, e.employee_id, e.name, e.email, e.department, e.position, e.status
    FROM employees e
    WHERE e.email = employee_email AND e.status = 'active';
END;
$$;

-- Function to record attendance (for biometric devices)
CREATE OR REPLACE FUNCTION record_attendance_entry(
    emp_id VARCHAR,
    attendance_date DATE,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    attendance_status attendance_status DEFAULT 'present',
    device_identifier VARCHAR DEFAULT NULL,
    location_info VARCHAR DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    employee_uuid UUID;
    attendance_id UUID;
BEGIN
    -- Get employee UUID from employee_id
    SELECT id INTO employee_uuid
    FROM employees
    WHERE employee_id = emp_id AND status = 'active';
    
    if employee_uuid IS NULL THEN
        RAISE EXCEPTION 'Employee not found or inactive: %', emp_id;
    END IF;
    
    -- Insert or update attendance record
    INSERT INTO attendance (
        employee_id, date, check_in, check_out, status, device_id, location
    ) VALUES (
        employee_uuid, attendance_date, check_in_time, check_out_time, 
        attendance_status, device_identifier, location_info
    )
    ON CONFLICT (employee_id, date)
    DO UPDATE SET
        check_out = COALESCE(EXCLUDED.check_out, attendance.check_out),
        check_in = COALESCE(attendance.check_in, EXCLUDED.check_in),
        status = EXCLUDED.status,
        device_id = COALESCE(EXCLUDED.device_id, attendance.device_id),
        location = COALESCE(EXCLUDED.location, attendance.location),
        updated_at = NOW()
    RETURNING id INTO attendance_id;
    
    RETURN attendance_id;
END;
$$;

-- Function to calculate attendance statistics
CREATE OR REPLACE FUNCTION calculate_attendance_stats(
    emp_id UUID,
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    total_days INTEGER,
    present_days INTEGER,
    absent_days INTEGER,
    late_days INTEGER,
    total_hours DECIMAL,
    overtime_hours DECIMAL,
    attendance_percentage DECIMAL
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_days,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END)::INTEGER as present_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END)::INTEGER as absent_days,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END)::INTEGER as late_days,
        COALESCE(SUM(a.hours_worked), 0)::DECIMAL as total_hours,
        COALESCE(SUM(a.overtime_hours), 0)::DECIMAL as overtime_hours,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0
        END as attendance_percentage
    FROM attendance a
    WHERE a.employee_id = emp_id
    AND a.date BETWEEN start_date AND end_date;
END;
$$;

-- Grant necessary permissions to authenticated users
GRANT SELECT ON employees TO authenticated;
GRANT SELECT ON departments TO authenticated;
GRANT SELECT, INSERT ON attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE ON leave_requests TO authenticated;
GRANT SELECT ON leave_balances TO authenticated;
GRANT SELECT ON system_settings TO authenticated;

-- Grant execution permissions on functions
GRANT EXECUTE ON FUNCTION get_employee_by_email TO authenticated;
GRANT EXECUTE ON FUNCTION record_attendance_entry TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_attendance_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_attendance_stats TO authenticated;

-- Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_department_status ON employees(department, status);
CREATE INDEX IF NOT EXISTS idx_departments_head_employee ON departments(head_employee_id);

-- Comments for documentation
COMMENT ON POLICY "Service role can manage employees" ON employees IS 'Backend API has full access to employee data';
COMMENT ON POLICY "HR admins can manage employees" ON employees IS 'HR department can manage all employee records';
COMMENT ON POLICY "Employees can view own record" ON employees IS 'Employees can only access their personal information';
COMMENT ON FUNCTION get_employee_by_email IS 'Secure function to retrieve employee data for authentication';
COMMENT ON FUNCTION record_attendance_entry IS 'Secure function for biometric devices to record attendance';

-- Security note: Remember to set up proper API authentication and rate limiting
-- at the application level for functions that accept external input