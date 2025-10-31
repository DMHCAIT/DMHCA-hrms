-- Migration to add authentication support to employees table
-- This should be run in your Supabase SQL editor

-- Add role column if it doesn't exist
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'employee'));

-- Add auth_user_id column to link with Supabase auth
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON employees(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);

-- Update existing employees to have proper role
-- Set the first employee as admin (you can change this)
UPDATE employees 
SET role = 'admin' 
WHERE id = (SELECT id FROM employees ORDER BY created_at LIMIT 1);

-- Sample data - Insert admin user (modify as needed)
-- Note: You'll need to create these users in Supabase Auth first
INSERT INTO employees (
  employee_id, 
  first_name, 
  last_name, 
  email, 
  role, 
  department, 
  position, 
  phone,
  hire_date,
  status
) VALUES 
-- Admin user
('EMP001', 'Admin', 'User', 'admin@dmhca.com', 'admin', 'IT', 'System Administrator', '+1234567890', CURRENT_DATE, 'active'),
-- Employee user
('EMP002', 'John', 'Doe', 'john.doe@dmhca.com', 'employee', 'Operations', 'Operations Manager', '+1234567891', CURRENT_DATE, 'active'),
-- Another employee
('EMP003', 'Jane', 'Smith', 'jane.smith@dmhca.com', 'employee', 'HR', 'HR Specialist', '+1234567892', CURRENT_DATE, 'active')
ON CONFLICT (employee_id) DO NOTHING;

-- Enable Row Level Security (RLS) for better security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admins can see all employees
CREATE POLICY "Admins can view all employees" ON employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Employees can only see their own record
CREATE POLICY "Employees can view own record" ON employees
  FOR SELECT USING (auth_user_id = auth.uid());

-- Admins can update all employees
CREATE POLICY "Admins can update all employees" ON employees
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Employees can update their own record (limited fields)
CREATE POLICY "Employees can update own record" ON employees
  FOR UPDATE USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Similar policies for attendance_machine_logs
ALTER TABLE attendance_machine_logs ENABLE ROW LEVEL SECURITY;

-- Admins can see all attendance logs
CREATE POLICY "Admins can view all attendance logs" ON attendance_machine_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Employees can only see their own attendance logs
CREATE POLICY "Employees can view own attendance logs" ON attendance_machine_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employee_id = attendance_machine_logs.employee_id 
      AND auth_user_id = auth.uid()
    )
  );

-- Create a function to automatically link new auth users to employee records
CREATE OR REPLACE FUNCTION link_auth_user_to_employee()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to link the new auth user to an existing employee record by email
  UPDATE employees 
  SET auth_user_id = NEW.id 
  WHERE email = NEW.email 
  AND auth_user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically link users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_auth_user_to_employee();

-- Instructions:
-- 1. Run this migration in your Supabase SQL editor
-- 2. In Supabase Auth, create user accounts for the emails above:
--    - admin@dmhca.com (password: admin123 - change this!)
--    - john.doe@dmhca.com (password: employee123)
--    - jane.smith@dmhca.com (password: employee123)
-- 3. The trigger will automatically link auth users to employee records
-- 4. Update the id column in employees table to match auth.users(id) if needed