-- HR Software Database Schema - Production Ready
-- This file should be executed in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE employment_status AS ENUM ('active', 'inactive', 'terminated', 'on_leave');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'half_day', 'overtime');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'maternity', 'paternity', 'emergency', 'other');

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    head_employee_id UUID,
    budget DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table (Enhanced)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    department VARCHAR(50) NOT NULL, -- For backward compatibility
    position VARCHAR(100) NOT NULL,
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2),
    status employment_status DEFAULT 'active',
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    date_of_birth DATE,
    national_id VARCHAR(50),
    bank_account VARCHAR(50),
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_hire_date CHECK (hire_date <= CURRENT_DATE),
    CONSTRAINT check_salary CHECK (salary >= 0),
    CONSTRAINT check_employee_id_format CHECK (employee_id ~ '^[A-Z0-9]{3,20}$')
);

-- Attendance table (Enhanced)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    status attendance_status NOT NULL DEFAULT 'present',
    notes TEXT,
    hours_worked DECIMAL(4,2) GENERATED ALWAYS AS (
        CASE 
            WHEN check_in IS NOT NULL AND check_out IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (check_out - check_in)) / 3600.0
            ELSE NULL 
        END
    ) STORED,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    break_duration INTERVAL DEFAULT '00:00:00',
    location VARCHAR(100),
    device_id VARCHAR(50), -- For biometric device tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate entries
    UNIQUE(employee_id, date),
    
    -- Constraints
    CONSTRAINT check_check_out_after_check_in CHECK (check_out > check_in OR check_out IS NULL),
    CONSTRAINT check_date_not_future CHECK (date <= CURRENT_DATE),
    CONSTRAINT check_overtime_positive CHECK (overtime_hours >= 0)
);

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
    reason TEXT NOT NULL,
    status leave_status DEFAULT 'pending',
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_end_date_after_start CHECK (end_date >= start_date),
    CONSTRAINT check_start_date_future CHECK (start_date >= CURRENT_DATE - INTERVAL '1 day'),
    CONSTRAINT check_total_days_positive CHECK (total_days > 0)
);

-- Leave balances table
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    total_days INTEGER NOT NULL DEFAULT 0,
    used_days INTEGER NOT NULL DEFAULT 0,
    remaining_days INTEGER GENERATED ALWAYS AS (total_days - used_days) STORED,
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(employee_id, leave_type, year),
    
    -- Constraints
    CONSTRAINT check_total_days_positive CHECK (total_days >= 0),
    CONSTRAINT check_used_days_positive CHECK (used_days >= 0),
    CONSTRAINT check_used_not_exceed_total CHECK (used_days <= total_days)
);

-- Audit log table for tracking changes
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by UUID, -- Could be employee_id or system
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    data_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year ON leave_balances(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at);

-- Foreign key for department head
ALTER TABLE departments ADD CONSTRAINT fk_departments_head 
    FOREIGN KEY (head_employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Create functions and triggers for automatic updates

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create audit log
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values)
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Audit triggers
CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_attendance AFTER INSERT OR UPDATE OR DELETE ON attendance
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_leave_requests AFTER INSERT OR UPDATE OR DELETE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Insert default system settings
INSERT INTO system_settings (key, value, description, data_type) VALUES
('working_hours_per_day', '8', 'Standard working hours per day', 'number'),
('working_days_per_week', '5', 'Standard working days per week', 'number'),
('annual_leave_days', '21', 'Default annual leave days per year', 'number'),
('sick_leave_days', '10', 'Default sick leave days per year', 'number'),
('late_threshold_minutes', '15', 'Minutes after which attendance is marked as late', 'number'),
('overtime_threshold_hours', '8', 'Hours after which overtime is calculated', 'number'),
('company_name', 'DMHCA', 'Company name for reports', 'string'),
('hr_email', 'hr@dmhca.com', 'HR department email', 'string'),
('attendance_grace_period', '10', 'Grace period in minutes for attendance', 'number'),
('backup_retention_days', '365', 'Number of days to retain backup data', 'number')
ON CONFLICT (key) DO NOTHING;

-- Insert default departments
INSERT INTO departments (name, description) VALUES
('Human Resources', 'Manages employee relations and company policies'),
('Information Technology', 'Handles all technology infrastructure and development'),
('Finance', 'Manages financial operations and accounting'),
('Administration', 'General administration and office management'),
('Operations', 'Daily operational activities and coordination')
ON CONFLICT (name) DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW employee_details AS
SELECT 
    e.id,
    e.employee_id,
    e.name,
    e.email,
    e.phone,
    e.department,
    d.name as department_name,
    e.position,
    e.hire_date,
    e.salary,
    e.status,
    e.created_at,
    e.updated_at,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)) as years_of_service
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;

CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    e.id as employee_id,
    e.employee_id,
    e.name,
    e.department,
    COUNT(a.id) as total_days,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
    COALESCE(SUM(a.hours_worked), 0) as total_hours_worked,
    COALESCE(SUM(a.overtime_hours), 0) as total_overtime_hours
FROM employees e
LEFT JOIN attendance a ON e.id = a.employee_id
    AND a.date >= CURRENT_DATE - INTERVAL '30 days'
WHERE e.status = 'active'
GROUP BY e.id, e.employee_id, e.name, e.department;

-- Create a function for attendance statistics
CREATE OR REPLACE FUNCTION get_attendance_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_employees INTEGER,
    avg_attendance_rate DECIMAL,
    total_present INTEGER,
    total_absent INTEGER,
    total_late INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT e.id)::INTEGER as total_employees,
        ROUND(
            COUNT(CASE WHEN a.status = 'present' THEN 1 END)::DECIMAL / 
            NULLIF(COUNT(a.id), 0) * 100, 2
        ) as avg_attendance_rate,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END)::INTEGER as total_present,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END)::INTEGER as total_absent,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END)::INTEGER as total_late
    FROM employees e
    LEFT JOIN attendance a ON e.id = a.employee_id
        AND a.date BETWEEN start_date AND end_date
    WHERE e.status = 'active';
END;
$$ LANGUAGE plpgsql;

COMMENT ON DATABASE postgres IS 'DMHCA HR Management System Database - Production Ready';
COMMENT ON TABLE employees IS 'Employee master data with comprehensive information';
COMMENT ON TABLE attendance IS 'Daily attendance records with automatic hours calculation';
COMMENT ON TABLE leave_requests IS 'Employee leave applications and approvals';
COMMENT ON TABLE leave_balances IS 'Annual leave balance tracking per employee';
COMMENT ON TABLE audit_logs IS 'System audit trail for all data changes';
COMMENT ON TABLE system_settings IS 'Configurable system parameters';