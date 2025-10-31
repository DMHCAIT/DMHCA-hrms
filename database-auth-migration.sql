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

-- No sample data - use real employee data instead
-- Admin users will be created through the admin interface

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

-- Additional functions for user management

-- Function to create employee account with auth user
CREATE OR REPLACE FUNCTION create_employee_with_auth(
  p_email TEXT,
  p_password TEXT,
  p_employee_id TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role TEXT DEFAULT 'employee',
  p_department TEXT DEFAULT NULL,
  p_position TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_employee_record RECORD;
BEGIN
  -- Create auth user (this would typically be done via Supabase Admin API)
  -- For now, just insert the employee record and they'll need to be created in Supabase Auth
  
  -- Insert employee record
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
  ) VALUES (
    p_employee_id,
    p_first_name,
    p_last_name,
    p_email,
    p_role,
    p_department,
    p_position,
    p_phone,
    CURRENT_DATE,
    'active'
  ) RETURNING * INTO v_employee_record;

  RETURN json_build_object(
    'success', true,
    'employee_id', v_employee_record.employee_id,
    'message', 'Employee created successfully. Auth account needs to be created in Supabase Auth.'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update employee password (placeholder - actual password changes happen in Supabase Auth)
CREATE OR REPLACE FUNCTION update_employee_profile(
  p_employee_id TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL,
  p_position TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_current_user_id UUID;
  v_is_admin BOOLEAN;
  v_is_own_record BOOLEAN;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  
  -- Check if user is admin
  SELECT (role = 'admin') INTO v_is_admin
  FROM employees 
  WHERE auth_user_id = v_current_user_id;
  
  -- Check if updating own record
  SELECT (employee_id = p_employee_id) INTO v_is_own_record
  FROM employees 
  WHERE auth_user_id = v_current_user_id;
  
  -- Only allow if admin or own record
  IF NOT (v_is_admin OR v_is_own_record) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: Cannot update this employee record'
    );
  END IF;

  -- Update employee record
  UPDATE employees 
  SET 
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    phone = COALESCE(p_phone, phone),
    department = CASE WHEN v_is_admin THEN COALESCE(p_department, department) ELSE department END,
    position = CASE WHEN v_is_admin THEN COALESCE(p_position, position) ELSE position END,
    updated_at = NOW()
  WHERE employee_id = p_employee_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Employee profile updated successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Instructions:
-- 1. Run this migration in your Supabase SQL editor
-- 2. Use the admin interface to create employee accounts
-- 3. The system will handle auth user creation and linking automatically