-- Attendance Machines Table
-- This table stores configuration for attendance devices
CREATE TABLE IF NOT EXISTS attendance_machines (
    id SERIAL PRIMARY KEY,
    machine_id VARCHAR(50) UNIQUE NOT NULL,
    ip_address VARCHAR(15),
    port INTEGER DEFAULT 4370,
    protocol VARCHAR(10) DEFAULT 'TCP', -- TCP, UDP, HTTP, CLOUD
    location VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    serial_number VARCHAR(50),
    cloud_id VARCHAR(50),
    cloud_service VARCHAR(50),
    device_password VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance Machine Logs Table  
-- This table stores all attendance records from machines
CREATE TABLE IF NOT EXISTS attendance_machine_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    machine_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    log_type VARCHAR(20) NOT NULL, -- IN, OUT, BREAK_IN, BREAK_OUT
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraints
    FOREIGN KEY (machine_id) REFERENCES attendance_machines(machine_id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_machine_logs_user_id ON attendance_machine_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_machine_logs_machine_id ON attendance_machine_logs(machine_id);
CREATE INDEX IF NOT EXISTS idx_attendance_machine_logs_timestamp ON attendance_machine_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_machine_logs_log_type ON attendance_machine_logs(log_type);

-- RLS (Row Level Security) policies
ALTER TABLE attendance_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_machine_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read attendance machines
CREATE POLICY IF NOT EXISTS "Allow authenticated read access to attendance_machines"
    ON attendance_machines FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert/update attendance machines
CREATE POLICY IF NOT EXISTS "Allow authenticated write access to attendance_machines"
    ON attendance_machines FOR ALL
    TO authenticated
    USING (true);

-- Allow authenticated users to read attendance logs
CREATE POLICY IF NOT EXISTS "Allow authenticated read access to attendance_machine_logs"
    ON attendance_machine_logs FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert attendance logs
CREATE POLICY IF NOT EXISTS "Allow authenticated insert access to attendance_machine_logs"
    ON attendance_machine_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Sample data for testing
INSERT INTO attendance_machines (machine_id, ip_address, port, protocol, location, is_active) 
VALUES 
    ('MAIN_OFFICE_001', '192.168.1.100', 4370, 'TCP', 'Main Office - Entrance', true),
    ('BRANCH_001', '192.168.1.101', 4370, 'TCP', 'Branch Office - Reception', true),
    ('CLOUD_DEVICE_001', null, null, 'CLOUD', 'Remote Office', true)
ON CONFLICT (machine_id) DO NOTHING;

-- Insert sample attendance log
INSERT INTO attendance_machine_logs (user_id, machine_id, timestamp, log_type) 
VALUES 
    ('EMP001', 'MAIN_OFFICE_001', NOW(), 'IN'),
    ('EMP002', 'MAIN_OFFICE_001', NOW() - INTERVAL '1 hour', 'IN'),
    ('EMP001', 'MAIN_OFFICE_001', NOW() - INTERVAL '8 hours', 'OUT')
ON CONFLICT DO NOTHING;