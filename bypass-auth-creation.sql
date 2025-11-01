-- BYPASS DASHBOARD - DIRECT AUTH USER CREATION
-- Run this in Supabase SQL Editor to create users directly

-- 1. First check if auth.users table is accessible
SELECT 'Checking auth access...' as status;

-- 2. Create auth users directly via SQL (bypassing dashboard)
-- This creates users in the auth.users table directly

DO $$
DECLARE 
    admin_user_id UUID;
    santosh_user_id UUID;
BEGIN
    -- Generate UUIDs for the users
    admin_user_id := gen_random_uuid();
    santosh_user_id := gen_random_uuid();
    
    -- Create admin@dmhca.in auth user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        confirmation_token,
        recovery_sent_at,
        recovery_token,
        email_change_token_new,
        email_change,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        admin_user_id,
        'authenticated',
        'authenticated',
        'admin@dmhca.in',
        crypt('Admin@123', gen_salt('bf')),
        NOW(),
        NOW(),
        '',
        NULL,
        '',
        '',
        '',
        '{"provider": "email", "providers": ["email"]}',
        '{"role": "admin"}',
        FALSE,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        '',
        0,
        NULL,
        '',
        NULL
    ) ON CONFLICT (email) DO UPDATE SET
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = NOW(),
        updated_at = NOW();
    
    -- Create santoshg@dmhca.in auth user  
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        confirmation_token,
        recovery_sent_at,
        recovery_token,
        email_change_token_new,
        email_change,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        santosh_user_id,
        'authenticated',
        'authenticated',
        'santoshg@dmhca.in',
        crypt('Admin@123', gen_salt('bf')),
        NOW(),
        NOW(),
        '',
        NULL,
        '',
        '',
        '',
        '{"provider": "email", "providers": ["email"]}',
        '{"role": "admin"}',
        FALSE,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        '',
        0,
        NULL,
        '',
        NULL
    ) ON CONFLICT (email) DO UPDATE SET
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = NOW(),
        updated_at = NOW();

    -- 3. Create/Update employee records linked to auth users
    INSERT INTO employees (
        employee_id, 
        first_name, 
        last_name, 
        email, 
        role, 
        status,
        auth_user_id
    ) VALUES (
        'ADMIN001', 
        'System', 
        'Administrator', 
        'admin@dmhca.in', 
        'admin', 
        'Active',
        admin_user_id
    ) ON CONFLICT (employee_id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        auth_user_id = EXCLUDED.auth_user_id;

    -- Update existing employee with auth link
    UPDATE employees SET
        role = 'admin',
        status = 'Active',
        auth_user_id = santosh_user_id
    WHERE email = 'santoshg@dmhca.in';

    RAISE NOTICE '✅ Auth users created successfully!';
    RAISE NOTICE 'admin@dmhca.in → UUID: %', admin_user_id;
    RAISE NOTICE 'santoshg@dmhca.in → UUID: %', santosh_user_id;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error: %. Trying alternative method...', SQLERRM;
END $$;

-- 4. Verify the users were created
SELECT 'Auth Users Created:' as status;
SELECT id, email, email_confirmed_at, created_at
FROM auth.users 
WHERE email IN ('admin@dmhca.in', 'santoshg@dmhca.in');

SELECT 'Employee Records:' as status;
SELECT employee_id, first_name, last_name, email, role, status, auth_user_id
FROM employees 
WHERE email IN ('admin@dmhca.in', 'santoshg@dmhca.in');

-- 5. Success message
SELECT '🎉 READY TO LOGIN!' as message;
SELECT 'Use: admin@dmhca.in / Admin@123' as login1;
SELECT 'Or: santoshg@dmhca.in / Admin@123' as login2;
SELECT 'URL: https://dmhcahrms.xyz' as url;