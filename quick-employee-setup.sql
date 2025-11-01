-- QUICK SETUP: Run this FIRST in Supabase SQL Editor
-- This creates the employee records that auth users will link to

-- 1. Create basic employee record for admin
INSERT INTO employees (
    employee_id, first_name, last_name, email, phone_number, 
    address, emergency_contact_name, emergency_contact_phone,
    hire_date, position, department, salary, role, status
) VALUES (
    'ADMIN001', 'System', 'Administrator', 'admin@dmhca.in', '+91-9876543210',
    'Admin Office, Hyderabad', 'Admin Contact', '+91-9876543211',
    '2024-01-01', 'System Administrator', 'Administration', 75000.00, 'admin', 'Active'
) ON CONFLICT (employee_id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

-- 2. Update existing employee if exists
UPDATE employees SET
    role = 'admin',
    status = 'Active',
    position = 'HR Manager',
    department = 'Administration',
    salary = COALESCE(salary, 65000.00),
    address = COALESCE(address, 'DMHCA Office, Hyderabad'),
    emergency_contact_name = COALESCE(emergency_contact_name, 'Emergency Contact'),
    emergency_contact_phone = COALESCE(emergency_contact_phone, '+91-9999999999')
WHERE email = 'santoshg@dmhca.in';

-- 3. Create sample employee
INSERT INTO employees (
    employee_id, first_name, last_name, email, phone_number,
    address, emergency_contact_name, emergency_contact_phone, 
    hire_date, position, department, salary, role, status
) VALUES (
    'EMP002', 'John', 'Doe', 'john.doe@dmhca.in', '+91-9876543212',
    'Employee Address, Hyderabad', 'John Emergency', '+91-9876543213',
    '2024-02-01', 'Software Developer', 'IT', 45000.00, 'employee', 'Active'  
) ON CONFLICT (employee_id) DO NOTHING;

SELECT 'Setup Complete! Now create auth users in Supabase Dashboard.' as message;