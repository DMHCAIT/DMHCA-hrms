-- COMPREHENSIVE LOGIN SETUP GUIDE
-- Execute these scripts in order

-- STEP 1: Run this in Supabase SQL Editor
-- Creates employee records first

-- 1. Create admin employee record
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

-- 2. Update existing employee (if exists)
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

-- 3. Create employee users
INSERT INTO employees (
    employee_id, first_name, last_name, email, phone_number,
    address, emergency_contact_name, emergency_contact_phone, 
    hire_date, position, department, salary, role, status
) VALUES 
    ('EMP002', 'John', 'Doe', 'john.doe@dmhca.in', '+91-9876543212',
     'Employee Address, Hyderabad', 'John Emergency', '+91-9876543213',
     '2024-02-01', 'Software Developer', 'IT', 45000.00, 'employee', 'Active'),
    ('EMP003', 'Jane', 'Smith', 'jane.smith@dmhca.in', '+91-9876543214',
     'Employee Address, Hyderabad', 'Jane Emergency', '+91-9876543215',
     '2024-03-01', 'HR Executive', 'HR', 40000.00, 'employee', 'Active')
ON CONFLICT (employee_id) DO NOTHING;

-- 4. Verify employee creation
SELECT 'Employees Created:' as status, COUNT(*) as count FROM employees;
SELECT employee_id, first_name, last_name, email, role, status FROM employees;

-- STEP 2: Create Auth Users in Supabase Dashboard
-- Go to Authentication → Users and create these users:
-- 1. admin@dmhca.in (Password: Admin@123)
-- 2. santoshg@dmhca.in (Password: Admin@123) 
-- 3. john.doe@dmhca.in (Password: Employee@123)
-- 4. jane.smith@dmhca.in (Password: Employee@123)

SELECT 'Next: Create auth users in Supabase Dashboard with above emails' as instruction;