-- SCHEMA ANALYSIS & MISSING COMPONENTS SETUP
-- Based on your database schema, let's add what might be helpful

-- 1. CREATE SOME SAMPLE DEPARTMENTS IF MISSING
INSERT INTO departments (name, head, employee_count) 
VALUES 
    ('Administration', 'System Administrator', 2),
    ('IT', 'Tech Lead', 2), 
    ('HR', 'HR Manager', 1),
    ('Finance', 'Finance Manager', 0)
ON CONFLICT (name) DO NOTHING;

-- 2. CREATE SOME SAMPLE BRANCHES IF MISSING  
INSERT INTO branches (name, location, manager)
VALUES 
    ('Head Office', 'Hyderabad, Telangana', 'System Administrator'),
    ('Branch Office', 'Bangalore, Karnataka', 'Branch Manager')
ON CONFLICT (name) DO NOTHING;

-- 3. CREATE BASIC LEAVE POLICIES
INSERT INTO leave_policies (leave_type, annual_allocation, max_consecutive_days, min_notice_days, description, color)
VALUES 
    ('Annual Leave', 21, 15, 7, 'Annual vacation leave', '#4CAF50'),
    ('Sick Leave', 12, 7, 1, 'Medical leave', '#FF9800'),
    ('Personal Leave', 5, 3, 2, 'Personal matters', '#2196F3'),
    ('Maternity Leave', 180, 180, 30, 'Maternity leave', '#E91E63'),
    ('Paternity Leave', 15, 15, 7, 'Paternity leave', '#9C27B0'),
    ('Emergency Leave', 3, 2, 0, 'Emergency situations', '#F44336')
ON CONFLICT (leave_type) DO NOTHING;

-- 4. CREATE SAMPLE ATTENDANCE MACHINES
INSERT INTO attendance_machines (machine_id, ip_address, port, location, device_model)
VALUES 
    ('MACHINE001', '192.168.1.100', 4370, 'Main Entrance', 'ZKTeco K40'),
    ('MACHINE002', '192.168.1.101', 4370, 'Back Entrance', 'ZKTeco K50'),
    ('MACHINE003', '192.168.1.102', 4370, 'IT Floor', 'ZKTeco F18')
ON CONFLICT (machine_id) DO NOTHING;

-- 5. LINK EMPLOYEES TO DEPARTMENTS AND BRANCHES
DO $$
DECLARE 
    admin_dept_id INTEGER;
    it_dept_id INTEGER;
    hr_dept_id INTEGER;
    main_branch_id INTEGER;
BEGIN
    -- Get department and branch IDs
    SELECT id INTO admin_dept_id FROM departments WHERE name = 'Administration' LIMIT 1;
    SELECT id INTO it_dept_id FROM departments WHERE name = 'IT' LIMIT 1;
    SELECT id INTO hr_dept_id FROM departments WHERE name = 'HR' LIMIT 1;
    SELECT id INTO main_branch_id FROM branches WHERE name = 'Head Office' LIMIT 1;
    
    -- Update employees with proper department and branch links
    UPDATE employees SET 
        department_id = admin_dept_id,
        branch_id = main_branch_id
    WHERE employee_id IN ('EMP001', 'ADMIN001');
    
    UPDATE employees SET 
        department_id = it_dept_id,
        branch_id = main_branch_id  
    WHERE employee_id IN ('EMP002', 'EMP004');
    
    UPDATE employees SET 
        department_id = hr_dept_id,
        branch_id = main_branch_id
    WHERE employee_id = 'EMP003';
    
    RAISE NOTICE '✅ Employees linked to departments and branches';
END $$;

-- 6. CREATE INITIAL LEAVE BALANCES FOR ALL EMPLOYEES
DO $$
DECLARE 
    emp_record RECORD;
    leave_type_record RECORD;
BEGIN
    -- For each employee, create leave balances for all leave types
    FOR emp_record IN SELECT employee_id FROM employees WHERE role IN ('admin', 'employee')
    LOOP
        FOR leave_type_record IN SELECT leave_type, annual_allocation FROM leave_policies
        LOOP
            INSERT INTO employee_leave_balances (
                employee_id,
                leave_type, 
                total_allocated,
                year
            ) VALUES (
                emp_record.employee_id,
                leave_type_record.leave_type,
                leave_type_record.annual_allocation,
                EXTRACT(YEAR FROM CURRENT_DATE)
            )
            ON CONFLICT (employee_id, leave_type, year) DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ Leave balances created for all employees';
END $$;

-- 7. ADD SOME SAMPLE HOLIDAYS TO LEAVE CALENDAR
INSERT INTO leave_calendar (name, date, type, description)
VALUES 
    ('New Year', '2025-01-01', 'public_holiday', 'New Year Day'),
    ('Republic Day', '2025-01-26', 'public_holiday', 'Republic Day of India'),
    ('Independence Day', '2025-08-15', 'public_holiday', 'Independence Day of India'),
    ('Gandhi Jayanti', '2025-10-02', 'public_holiday', 'Birth anniversary of Mahatma Gandhi'),
    ('Diwali', '2025-10-31', 'public_holiday', 'Festival of Lights')
ON CONFLICT (name, date) DO NOTHING;

-- 8. SHOW COMPLETE SETUP SUMMARY
SELECT '📊 SETUP SUMMARY' as info;

SELECT 'Employees Created' as category, COUNT(*) as count FROM employees;
SELECT 'Departments Created' as category, COUNT(*) as count FROM departments;
SELECT 'Branches Created' as category, COUNT(*) as count FROM branches;
SELECT 'Leave Policies Created' as category, COUNT(*) as count FROM leave_policies;  
SELECT 'Leave Balances Created' as category, COUNT(*) as count FROM employee_leave_balances;
SELECT 'Attendance Machines Created' as category, COUNT(*) as count FROM attendance_machines;
SELECT 'Holidays Created' as category, COUNT(*) as count FROM leave_calendar;

RAISE NOTICE '🎉 COMPLETE HR SYSTEM SETUP FINISHED!';
RAISE NOTICE 'Your database now has:';
RAISE NOTICE '- Demo employees with proper roles';
RAISE NOTICE '- Departments and branches';  
RAISE NOTICE '- Leave policies and balances';
RAISE NOTICE '- Attendance machines configured';
RAISE NOTICE '- Holiday calendar';
RAISE NOTICE '';
RAISE NOTICE '🚀 Ready for full HR system testing!';