-- PERFECT DEMO SETUP - Based on your actual database schema
-- This works with your exact table structure

-- Step 1: Show current employee structure
SELECT 
    'CURRENT EMPLOYEE DATA' as info,
    employee_id,
    first_name,
    last_name,
    email,
    role,
    status,
    department,
    position,
    auth_user_id
FROM employees 
WHERE employee_id = 'EMP001';

-- Step 2: Update existing employee to admin (using correct status values)
UPDATE employees 
SET 
    role = 'admin',
    status = 'Active',  -- Valid: Active, Inactive, On Leave
    department = 'Administration',
    position = 'System Administrator'
WHERE employee_id = 'EMP001';

-- Step 3: Create additional demo employees with proper schema
INSERT INTO employees (
    employee_id, 
    first_name, 
    last_name, 
    email, 
    phone, 
    position, 
    salary, 
    date_of_joining, 
    status, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    emergency_contact_relationship,
    role,
    department
) VALUES 
(
    'ADMIN001', 
    'Demo', 
    'Admin', 
    'admin@dmhca.in', 
    '+91-9876543210', 
    'System Administrator', 
    50000.00, 
    CURRENT_DATE, 
    'Active', 
    'Hyderabad, Telangana', 
    'Emergency Contact', 
    '+91-9876543299', 
    'Family',
    'admin',
    'Administration'
),
(
    'EMP002', 
    'John', 
    'Doe', 
    'john.doe@dmhca.in', 
    '+91-9876543211', 
    'Software Developer', 
    35000.00, 
    CURRENT_DATE, 
    'Active', 
    'Hyderabad, Telangana', 
    'Jane Doe', 
    '+91-9876543298', 
    'Spouse',
    'employee',
    'IT'
),
(
    'EMP003', 
    'Jane', 
    'Smith', 
    'jane.smith@dmhca.in', 
    '+91-9876543212', 
    'HR Manager', 
    40000.00, 
    CURRENT_DATE, 
    'Active', 
    'Hyderabad, Telangana', 
    'John Smith', 
    '+91-9876543297', 
    'Spouse',
    'employee',
    'HR'
),
(
    'EMP004', 
    'Mike', 
    'Johnson', 
    'manager@dmhca.in', 
    '+91-9876543213', 
    'Project Manager', 
    45000.00, 
    CURRENT_DATE, 
    'Active', 
    'Hyderabad, Telangana', 
    'Sarah Johnson', 
    '+91-9876543296', 
    'Spouse',
    'employee',
    'IT'
)
ON CONFLICT (employee_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    position = EXCLUDED.position,
    salary = EXCLUDED.salary,
    status = EXCLUDED.status,
    role = EXCLUDED.role,
    department = EXCLUDED.department;

-- Step 4: Link auth users to employees
DO $$
DECLARE
    user_email TEXT;
    user_id UUID;
    emp_id TEXT;
BEGIN
    RAISE NOTICE '🔗 LINKING AUTH USERS TO EMPLOYEES';
    RAISE NOTICE '===================================';
    
    -- Link existing and new employees to auth users
    FOR user_email, emp_id IN VALUES 
        ('santoshg@dmhca.in', 'EMP001'),
        ('admin@dmhca.in', 'ADMIN001'),
        ('john.doe@dmhca.in', 'EMP002'),
        ('jane.smith@dmhca.in', 'EMP003'),
        ('manager@dmhca.in', 'EMP004')
    LOOP
        SELECT id INTO user_id FROM auth.users WHERE email = user_email;
        
        IF user_id IS NOT NULL THEN
            UPDATE employees 
            SET auth_user_id = user_id 
            WHERE employee_id = emp_id;
            RAISE NOTICE '✅ Linked % to %', user_email, emp_id;
        ELSE
            RAISE NOTICE '❌ Auth user not found: %', user_email;
            RAISE NOTICE '   Create this user in Supabase Dashboard';
        END IF;
    END LOOP;
END $$;

-- Step 5: Show all demo users with their status
SELECT 
    '🎭 DEMO USERS READY' as info,
    e.employee_id,
    e.first_name || ' ' || e.last_name as full_name,
    e.email,
    e.role,
    e.department,
    e.position,
    e.status,
    CASE 
        WHEN e.auth_user_id IS NOT NULL THEN '✅ Ready to Login'
        ELSE '❌ Need Auth User'
    END as login_status
FROM employees e
WHERE e.employee_id IN ('EMP001', 'ADMIN001', 'EMP002', 'EMP003', 'EMP004')
ORDER BY 
    CASE WHEN e.role = 'admin' THEN 1 ELSE 2 END, 
    e.employee_id;

-- Step 6: Setup instructions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 DEMO LOGIN CREDENTIALS';
    RAISE NOTICE '========================';
    RAISE NOTICE '';
    RAISE NOTICE '👨‍💼 PRIMARY ADMIN (Ready Now):';
    RAISE NOTICE '   📧 Email: santoshg@dmhca.in';
    RAISE NOTICE '   🔐 Password: Set in Supabase Dashboard';
    RAISE NOTICE '   👤 Role: admin';
    RAISE NOTICE '';
    RAISE NOTICE '👨‍💼 DEMO ADMIN:';
    RAISE NOTICE '   📧 Email: admin@dmhca.in';
    RAISE NOTICE '   🔐 Password: Admin123!';
    RAISE NOTICE '   👤 Role: admin';
    RAISE NOTICE '';
    RAISE NOTICE '👨‍💻 SOFTWARE DEVELOPER:';
    RAISE NOTICE '   📧 Email: john.doe@dmhca.in';
    RAISE NOTICE '   🔐 Password: Employee123!';
    RAISE NOTICE '   👤 Role: employee';
    RAISE NOTICE '';
    RAISE NOTICE '👩‍💼 HR MANAGER:';
    RAISE NOTICE '   📧 Email: jane.smith@dmhca.in';
    RAISE NOTICE '   🔐 Password: Employee123!';
    RAISE NOTICE '   👤 Role: employee';
    RAISE NOTICE '';
    RAISE NOTICE '👨‍💼 PROJECT MANAGER:';
    RAISE NOTICE '   📧 Email: manager@dmhca.in';
    RAISE NOTICE '   🔐 Password: Manager123!';
    RAISE NOTICE '   👤 Role: employee';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT STEPS:';
    RAISE NOTICE '1. Create auth users in Supabase Dashboard with above emails/passwords';
    RAISE NOTICE '2. Run this script again to link them automatically';
    RAISE NOTICE '3. Login to your app with any of the credentials above';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Database setup complete!';
END $$;