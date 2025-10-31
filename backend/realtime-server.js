/**
 * Realtime Biometrics Integration Server
 * Simple Express server to receive webhooks from OnlineRealSoft
 */

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 4000;

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ocvtacsuwkwzbpwnmlsd.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdnRhY3N1d2t3emJwd25tbHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDc3MjYsImV4cCI6MjA3Njg4MzcyNn0.JJTuluIEZfVhFTonnaXCkiuzoD5AHZs0S_MjqdEn1DA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Realtime Integration Server is running!', 
    timestamp: new Date().toISOString() 
  });
});

// Main webhook endpoint for Realtime Biometrics
app.post('/api/attendance/realtime', async (req, res) => {
  console.log('📥 Received webhook from Realtime Biometrics:', req.body);
  
  try {
    const log = req.body;

    // Validate required fields
    if (!log.EmployeeCode || !log.LogDateTime || !log.DeviceNo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: EmployeeCode, LogDateTime, or DeviceNo'
      });
    }

    // Parse datetime
    const logDateTime = new Date(log.LogDateTime);
    if (isNaN(logDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid LogDateTime format'
      });
    }

    // Determine log type (simple alternating logic)
    const logType = await determineLogType(log.EmployeeCode, logDateTime);

    // Insert into attendance_machine_logs
    const { data, error } = await supabase
      .from('attendance_machine_logs')
      .insert({
        user_id: log.EmployeeCode,
        machine_id: log.DeviceNo,
        timestamp: logDateTime.toISOString(),
        log_type: logType,
        raw_data: {
          deviceName: log.DeviceName,
          originalLog: log,
          source: 'realtime_biometrics',
          receivedAt: new Date().toISOString()
        }
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: ' + error.message
      });
    }

    // Update daily attendance record
    await updateDailyAttendance(log.EmployeeCode, logDateTime, logType);

    console.log('✅ Attendance log processed:', data.id);

    res.json({
      success: true,
      message: 'Attendance log processed successfully',
      logId: data.id,
      logType: logType
    });

  } catch (error) {
    console.error('❌ Processing error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Helper function to determine log type
async function determineLogType(employeeCode, logDateTime) {
  try {
    const today = logDateTime.toISOString().split('T')[0];
    
    const { data: lastLog } = await supabase
      .from('attendance_machine_logs')
      .select('log_type')
      .eq('user_id', employeeCode)
      .gte('timestamp', `${today}T00:00:00`)
      .lt('timestamp', `${today}T23:59:59`)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // If no previous log today, this is IN
    if (!lastLog) return 'IN';

    // Toggle between IN/OUT
    return lastLog.log_type === 'IN' ? 'OUT' : 'IN';

  } catch (error) {
    console.log('No previous logs found, defaulting to IN');
    return 'IN';
  }
}

// Helper function to update daily attendance
async function updateDailyAttendance(employeeCode, logDateTime, logType) {
  try {
    const dateString = logDateTime.toISOString().split('T')[0];
    const timeString = logDateTime.toTimeString().split(' ')[0];

    // Get employee by employee_id (code)
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_id', employeeCode)
      .single();

    if (!employee) {
      console.warn(`Employee not found: ${employeeCode}`);
      return;
    }

    // Get existing attendance record
    const { data: existingRecord } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', dateString)
      .single();

    if (existingRecord) {
      // Update existing record
      const updates = {};
      
      if (logType === 'IN' && !existingRecord.check_in) {
        updates.check_in = timeString;
        updates.status = 'present';
      } else if (logType === 'OUT') {
        updates.check_out = timeString;
        
        // Calculate total hours
        if (existingRecord.check_in) {
          const checkIn = new Date(`${dateString}T${existingRecord.check_in}`);
          const checkOut = new Date(`${dateString}T${timeString}`);
          const totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          updates.total_hours = Math.round(totalHours * 100) / 100;
        }
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('attendance')
          .update(updates)
          .eq('id', existingRecord.id);
      }
    } else {
      // Create new record
      await supabase
        .from('attendance')
        .insert({
          employee_id: employee.id,
          date: dateString,
          check_in: logType === 'IN' ? timeString : null,
          check_out: logType === 'OUT' ? timeString : null,
          status: 'present',
          notes: `Realtime device: ${logDateTime.toLocaleString()}`
        });
    }

  } catch (error) {
    console.error('Failed to update daily attendance:', error);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Realtime Integration Server running on port ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/api/attendance/realtime`);
  console.log(`🧪 Test URL: http://localhost:${PORT}/api/test`);
});