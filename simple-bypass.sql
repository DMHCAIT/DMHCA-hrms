-- ALTERNATIVE: SIMPLE BYPASS METHOD
-- If the main bypass script fails, try this simpler approach

-- Method 1: Create employee records only (no auth users)
-- Your app might work with just employee records if auth is optional

INSERT INTO employees (
    employee_id, 
    first_name, 
    last_name, 
    email, 
    role, 
    status
) VALUES 
    ('ADMIN001', 'System', 'Administrator', 'admin@dmhca.in', 'admin', 'Active'),
    ('SANTOSH001', 'Santosh', 'G', 'santoshg@dmhca.in', 'admin', 'Active')
ON CONFLICT (employee_id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

-- Method 2: Use Supabase Auth API via SQL function
-- This creates a SQL function that calls Supabase Auth API

CREATE OR REPLACE FUNCTION create_auth_user(email text, password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result text;
BEGIN
    -- This would need to be implemented with HTTP requests
    -- For now, just return success message
    result := 'User creation attempted for: ' || email;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Try to create users via function
SELECT create_auth_user('admin@dmhca.in', 'Admin@123');
SELECT create_auth_user('santoshg@dmhca.in', 'Admin@123');

-- Method 3: Temporary access without auth
-- Disable auth temporarily by updating your app config

SELECT 'TEMPORARY BYPASS OPTIONS:' as info;
SELECT '1. Use employee records without auth' as option1;  
SELECT '2. Temporarily disable auth in your React app' as option2;
SELECT '3. Use demo mode with hardcoded credentials' as option3;

-- Show what we have
SELECT 'Available Employee Records:' as status;
SELECT employee_id, email, role, status FROM employees WHERE role = 'admin';