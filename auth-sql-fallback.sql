-- ALTERNATIVE: Create auth users via SQL if Dashboard fails
-- Run this AFTER running quick-employee-setup.sql

-- Note: This bypasses normal Supabase auth registration
-- Use this only if Dashboard user creation is failing

-- 1. Create auth users directly (requires admin privileges)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated', 
    'admin@dmhca.in',
    crypt('Admin@123', gen_salt('bf')),
    NOW(),
    NOW(), 
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "admin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- 2. Link auth user to employee record
DO $$
DECLARE 
    auth_user_id UUID;
BEGIN
    -- Get the created auth user ID
    SELECT id INTO auth_user_id FROM auth.users WHERE email = 'admin@dmhca.in' LIMIT 1;
    
    -- Update employee record with auth user ID
    UPDATE employees SET auth_user_id = auth_user_id WHERE email = 'admin@dmhca.in';
    
    RAISE NOTICE 'Auth user created and linked: %', auth_user_id;
END $$;

SELECT 'Alternative auth setup complete!' as message;