-- STEP 1: Run this first to see what exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('employees', 'attendance') 
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- STEP 2: If the above shows missing columns or wrong structure, run this:
-- (CAUTION: This will delete existing data)
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;

-- STEP 3: Create fresh tables with correct structure
CREATE TABLE public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    position VARCHAR(100),
    hire_date DATE,
    salary DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    break_start TIME,
    break_end TIME,
    status VARCHAR(20) DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

-- STEP 4: Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.employees;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.employees;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.employees;

CREATE POLICY "Enable read access for all users" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.employees FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON public.attendance;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.attendance;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.attendance;

CREATE POLICY "Enable read access for all users" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.attendance FOR UPDATE USING (true);

-- STEP 6: Insert sample data
INSERT INTO public.employees (employee_id, first_name, last_name, email, department, position, hire_date, salary) 
VALUES 
('EMP001', 'John', 'Doe', 'john.doe@dmhca.com', 'IT', 'Software Developer', '2024-01-15', 75000.00),
('EMP002', 'Jane', 'Smith', 'jane.smith@dmhca.com', 'HR', 'HR Manager', '2024-01-10', 65000.00),
('EMP003', 'Mike', 'Johnson', 'mike.johnson@dmhca.com', 'Finance', 'Accountant', '2024-02-01', 55000.00);

-- STEP 7: Insert sample attendance data
INSERT INTO public.attendance (employee_id, date, check_in, check_out, status)
VALUES 
('EMP001', CURRENT_DATE, '09:00:00', '17:30:00', 'present'),
('EMP002', CURRENT_DATE, '08:45:00', '17:15:00', 'present'),
('EMP003', CURRENT_DATE, '09:15:00', NULL, 'partial');

-- STEP 8: Verify the setup
SELECT 'Employees Count' as table_name, COUNT(*) as count FROM public.employees
UNION ALL
SELECT 'Attendance Count', COUNT(*) FROM public.attendance;