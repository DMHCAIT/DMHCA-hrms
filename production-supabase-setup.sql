-- PRODUCTION SUPABASE CONFIGURATION
-- Run this in Supabase SQL Editor for production setup

-- 1. First, check the actual employees table schema
SELECT 'Employees Table Schema:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;

-- 2. Verify employee records exist
SELECT 'Production Employee Check:' as status;
SELECT employee_id, first_name, last_name, email, role, status 
FROM employees 
WHERE role = 'admin' 
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check auth users
SELECT 'Auth Users Check:' as status;
SELECT email, created_at, email_confirmed_at
FROM auth.users 
WHERE email IN ('admin@dmhca.in', 'santoshg@dmhca.in')
ORDER BY created_at DESC;

-- 4. Create admin employee with minimal required fields
-- Using only the columns that definitely exist

INSERT INTO employees (
    employee_id, 
    first_name, 
    last_name, 
    email, 
    role, 
    status
) VALUES (
    'ADMIN001', 
    'System', 
    'Administrator', 
    'admin@dmhca.in', 
    'admin', 
    'Active'
) ON CONFLICT (employee_id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

-- Update existing employee if exists (using minimal columns)
UPDATE employees SET
    role = 'admin',
    status = 'Active'
WHERE email = 'santoshg@dmhca.in';

-- 5. Add additional fields if the columns exist
DO $$
BEGIN
    -- Try to add optional fields if columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'position') THEN
        UPDATE employees SET position = 'System Administrator' WHERE employee_id = 'ADMIN001';
        UPDATE employees SET position = 'HR Manager' WHERE email = 'santoshg@dmhca.in';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'department') THEN
        UPDATE employees SET department = 'Administration' WHERE employee_id = 'ADMIN001';
        UPDATE employees SET department = 'Administration' WHERE email = 'santoshg@dmhca.in';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'salary') THEN
        UPDATE employees SET salary = 75000.00 WHERE employee_id = 'ADMIN001';
        UPDATE employees SET salary = 65000.00 WHERE email = 'santoshg@dmhca.in';
    END IF;

    RAISE NOTICE 'Employee records updated with available fields';
END $$;

-- 6. Final verification
SELECT 'Final Employee Check:' as status;
SELECT employee_id, first_name, last_name, email, role, status 
FROM employees 
WHERE role = 'admin';

SELECT 'Production setup complete! Now create auth users in Supabase Dashboard:' as message;
SELECT '1. Go to Authentication → Users' as step1;
SELECT '2. Create user: admin@dmhca.in (Password: Admin@123)' as step2;
SELECT '3. Create user: santoshg@dmhca.in (Password: Admin@123)' as step3;
SELECT '4. Check "Auto Confirm User" for both' as step4;