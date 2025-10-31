-- Enhanced Leave Management System Database Schema
-- Run this in your Supabase SQL editor

-- Leave Policies Table
CREATE TABLE IF NOT EXISTS leave_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leave_type VARCHAR(100) NOT NULL,
  annual_allocation INTEGER NOT NULL DEFAULT 0,
  max_consecutive_days INTEGER DEFAULT NULL,
  min_notice_days INTEGER DEFAULT 1,
  carry_forward_limit INTEGER DEFAULT 0,
  carry_forward_expiry_months INTEGER DEFAULT 12,
  description TEXT,
  color VARCHAR(7) DEFAULT '#1976d2',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(leave_type)
);

-- Employee Leave Balances Table
CREATE TABLE IF NOT EXISTS employee_leave_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL,
  leave_type VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  total_allocated INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0,
  pending INTEGER NOT NULL DEFAULT 0,
  available INTEGER GENERATED ALWAYS AS (total_allocated - used - pending) STORED,
  carry_forward_from_previous INTEGER DEFAULT 0,
  carry_forward_to_next INTEGER DEFAULT 0,
  expires_on DATE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type) REFERENCES leave_policies(leave_type) ON DELETE CASCADE,
  UNIQUE(employee_id, leave_type, year)
);

-- Leave Requests Table (Enhanced)
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL,
  leave_type VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested INTEGER NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  applied_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by VARCHAR(50) DEFAULT NULL,
  approved_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  rejected_by VARCHAR(50) DEFAULT NULL,
  rejected_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  comments TEXT,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type) REFERENCES leave_policies(leave_type) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES employees(employee_id),
  FOREIGN KEY (rejected_by) REFERENCES employees(employee_id)
);

-- Leave Calendar Table (for holiday management)
CREATE TABLE IF NOT EXISTS leave_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(50) DEFAULT 'public_holiday' CHECK (type IN ('public_holiday', 'company_holiday', 'optional_holiday')),
  description TEXT,
  is_mandatory BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, name)
);

-- Insert default leave policies
INSERT INTO leave_policies (leave_type, annual_allocation, max_consecutive_days, min_notice_days, carry_forward_limit, carry_forward_expiry_months, description, color) VALUES
('Annual Leave', 21, 14, 7, 5, 3, 'Annual vacation leave for rest and recreation', '#4CAF50'),
('Sick Leave', 12, 30, 0, 0, 0, 'Medical leave for illness or medical appointments', '#FF9800'),
('Personal Leave', 5, 3, 2, 0, 0, 'Personal time off for personal matters', '#2196F3'),
('Maternity Leave', 90, 90, 30, 0, 0, 'Maternity leave for new mothers', '#E91E63'),
('Paternity Leave', 7, 7, 30, 0, 0, 'Paternity leave for new fathers', '#9C27B0'),
('Emergency Leave', 3, 1, 0, 0, 0, 'Emergency leave for urgent family matters', '#F44336'),
('Study Leave', 10, 5, 14, 0, 0, 'Educational leave for training and development', '#FF5722'),
('Compassionate Leave', 5, 5, 0, 0, 0, 'Bereavement leave for family loss', '#795548')
ON CONFLICT (leave_type) DO NOTHING;

-- Insert sample public holidays for current year
INSERT INTO leave_calendar (name, date, type, description) VALUES
('New Year''s Day', '2025-01-01', 'public_holiday', 'New Year celebration'),
('Republic Day', '2025-01-26', 'public_holiday', 'Indian Republic Day'),
('Independence Day', '2025-08-15', 'public_holiday', 'Indian Independence Day'),
('Gandhi Jayanti', '2025-10-02', 'public_holiday', 'Mahatma Gandhi''s Birthday'),
('Christmas Day', '2025-12-25', 'public_holiday', 'Christmas celebration')
ON CONFLICT (date, name) DO NOTHING;

-- Function to initialize leave balances for new employees
CREATE OR REPLACE FUNCTION initialize_employee_leave_balances(
  p_employee_id VARCHAR(50),
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())
)
RETURNS VOID AS $$
BEGIN
  -- Insert leave balances for all active leave policies
  INSERT INTO employee_leave_balances (
    employee_id, 
    leave_type, 
    year, 
    total_allocated,
    used,
    pending,
    carry_forward_from_previous
  )
  SELECT 
    p_employee_id,
    lp.leave_type,
    p_year,
    lp.annual_allocation,
    0,
    0,
    0
  FROM leave_policies lp
  WHERE lp.status = 'active'
  ON CONFLICT (employee_id, leave_type, year) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate carry forward for year-end
CREATE OR REPLACE FUNCTION calculate_carry_forward(
  p_employee_id VARCHAR(50),
  p_from_year INTEGER,
  p_to_year INTEGER
)
RETURNS VOID AS $$
DECLARE
  balance_record RECORD;
  carry_forward_days INTEGER;
  policy_record RECORD;
BEGIN
  -- Loop through all leave balances for the employee
  FOR balance_record IN 
    SELECT * FROM employee_leave_balances 
    WHERE employee_id = p_employee_id AND year = p_from_year
  LOOP
    -- Get policy for this leave type
    SELECT * INTO policy_record 
    FROM leave_policies 
    WHERE leave_type = balance_record.leave_type;
    
    -- Calculate carry forward (unused days up to policy limit)
    carry_forward_days := LEAST(
      balance_record.available, 
      policy_record.carry_forward_limit
    );
    
    IF carry_forward_days > 0 THEN
      -- Update current year balance
      UPDATE employee_leave_balances 
      SET carry_forward_to_next = carry_forward_days
      WHERE id = balance_record.id;
      
      -- Create or update next year balance
      INSERT INTO employee_leave_balances (
        employee_id,
        leave_type,
        year,
        total_allocated,
        used,
        pending,
        carry_forward_from_previous,
        expires_on
      ) VALUES (
        p_employee_id,
        balance_record.leave_type,
        p_to_year,
        policy_record.annual_allocation,
        0,
        0,
        carry_forward_days,
        DATE(p_to_year || '-12-31') + INTERVAL '1 month' * policy_record.carry_forward_expiry_months
      )
      ON CONFLICT (employee_id, leave_type, year) 
      DO UPDATE SET
        carry_forward_from_previous = carry_forward_days,
        total_allocated = policy_record.annual_allocation + carry_forward_days,
        expires_on = DATE(p_to_year || '-12-31') + INTERVAL '1 month' * policy_record.carry_forward_expiry_months;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update leave balance when request is approved/rejected
CREATE OR REPLACE FUNCTION update_leave_balance_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When request moves from pending to approved
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    UPDATE employee_leave_balances
    SET 
      used = used + NEW.days_requested,
      pending = pending - NEW.days_requested,
      updated_at = NOW()
    WHERE employee_id = NEW.employee_id 
      AND leave_type = NEW.leave_type 
      AND year = EXTRACT(YEAR FROM NEW.start_date);
      
  -- When request moves from pending to rejected
  ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    UPDATE employee_leave_balances
    SET 
      pending = pending - NEW.days_requested,
      updated_at = NOW()
    WHERE employee_id = NEW.employee_id 
      AND leave_type = NEW.leave_type 
      AND year = EXTRACT(YEAR FROM NEW.start_date);
      
  -- When request moves from approved back to pending or rejected
  ELSIF OLD.status = 'approved' AND NEW.status IN ('pending', 'rejected') THEN
    UPDATE employee_leave_balances
    SET 
      used = used - NEW.days_requested,
      pending = CASE WHEN NEW.status = 'pending' THEN pending + NEW.days_requested ELSE pending END,
      updated_at = NOW()
    WHERE employee_id = NEW.employee_id 
      AND leave_type = NEW.leave_type 
      AND year = EXTRACT(YEAR FROM NEW.start_date);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to add pending days when leave request is created
CREATE OR REPLACE FUNCTION add_pending_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Add to pending balance when new request is created
  IF NEW.status = 'pending' THEN
    UPDATE employee_leave_balances
    SET 
      pending = pending + NEW.days_requested,
      updated_at = NOW()
    WHERE employee_id = NEW.employee_id 
      AND leave_type = NEW.leave_type 
      AND year = EXTRACT(YEAR FROM NEW.start_date);
      
    -- If no balance record exists, create one
    IF NOT FOUND THEN
      -- Get policy allocation
      INSERT INTO employee_leave_balances (
        employee_id,
        leave_type,
        year,
        total_allocated,
        used,
        pending
      )
      SELECT 
        NEW.employee_id,
        NEW.leave_type,
        EXTRACT(YEAR FROM NEW.start_date),
        COALESCE(lp.annual_allocation, 0),
        0,
        NEW.days_requested
      FROM leave_policies lp
      WHERE lp.leave_type = NEW.leave_type;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE OR REPLACE TRIGGER trigger_update_leave_balance_on_status_change
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balance_on_status_change();

CREATE OR REPLACE TRIGGER trigger_add_pending_leave_balance
  AFTER INSERT ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION add_pending_leave_balance();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_leave_balances_employee_year ON employee_leave_balances(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_status ON leave_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_calendar_date ON leave_calendar(date);

-- Enable RLS for leave management tables
ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_calendar ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leave_policies (everyone can read, only admins can modify)
CREATE POLICY "Everyone can view leave policies" ON leave_policies
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage leave policies" ON leave_policies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for employee_leave_balances
CREATE POLICY "Employees can view own leave balances" ON employee_leave_balances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employee_id = employee_leave_balances.employee_id 
      AND auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all leave balances" ON employee_leave_balances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for leave_requests
CREATE POLICY "Employees can view own leave requests" ON leave_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employee_id = leave_requests.employee_id 
      AND auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Employees can create own leave requests" ON leave_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employee_id = leave_requests.employee_id 
      AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all leave requests" ON leave_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for leave_calendar (everyone can read)
CREATE POLICY "Everyone can view leave calendar" ON leave_calendar
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage leave calendar" ON leave_calendar
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Initialize leave balances for existing employees
DO $$
DECLARE
  emp_record RECORD;
BEGIN
  FOR emp_record IN SELECT employee_id FROM employees WHERE status = 'active'
  LOOP
    PERFORM initialize_employee_leave_balances(emp_record.employee_id);
  END LOOP;
END $$;