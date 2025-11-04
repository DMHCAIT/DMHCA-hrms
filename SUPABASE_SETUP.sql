-- Run this SQL in your Supabase SQL Editor to create the required tables
-- First, let's check if the table exists and what columns it has

-- Drop existing table if it has wrong structure (optional - uncomment if needed)
-- DROP TABLE IF EXISTS public.employees CASCADE;
-- DROP TABLE IF EXISTS public.attendance CASCADE;

-- Create employees table with all required columns
CREATE TABLE IF NOT EXISTS public.employees (
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

-- Add hire_date column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='hire_date') THEN
        ALTER TABLE public.employees ADD COLUMN hire_date DATE;
    END IF;
END $$;

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can restrict this later)
CREATE POLICY "Enable read access for all users" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.employees FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.attendance FOR UPDATE USING (true);

-- Insert some sample data (safe insert that handles missing columns)
DO $$
BEGIN
    -- Check if hire_date column exists before inserting
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='hire_date') THEN
        INSERT INTO public.employees (employee_id, first_name, last_name, email, department, position, hire_date, salary) 
        VALUES 
        ('EMP001', 'John', 'Doe', 'john.doe@dmhca.com', 'IT', 'Software Developer', '2024-01-15', 75000.00),
        ('EMP002', 'Jane', 'Smith', 'jane.smith@dmhca.com', 'HR', 'HR Manager', '2024-01-10', 65000.00)
        ON CONFLICT (employee_id) DO NOTHING;
    ELSE
        -- Insert without hire_date if column doesn't exist
        INSERT INTO public.employees (employee_id, first_name, last_name, email, department, position, salary) 
        VALUES 
        ('EMP001', 'John', 'Doe', 'john.doe@dmhca.com', 'IT', 'Software Developer', 75000.00),
        ('EMP002', 'Jane', 'Smith', 'jane.smith@dmhca.com', 'HR', 'HR Manager', 65000.00)
        ON CONFLICT (employee_id) DO NOTHING;
    END IF;
END $$;