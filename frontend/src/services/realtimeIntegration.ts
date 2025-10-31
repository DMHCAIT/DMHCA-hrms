/**
 * Realtime Biometrics API Integration Endpoint
 * Receives attendance data from OnlineRealSoft and stores in HR Software
 */

import { supabase } from '../lib/supabase';

export interface RealtimeAttendanceLog {
  EmployeeCode: string;
  LogDateTime: string;
  DeviceNo: string;
  DeviceName?: string;
  LogType?: string;
}

export interface AttendanceLogResponse {
  success: boolean;
  message: string;
  logId?: number;
}

/**
 * Process attendance log from Realtime Biometrics system
 */
export async function processRealtimeAttendanceLog(
  log: RealtimeAttendanceLog
): Promise<AttendanceLogResponse> {
  try {
    console.log('📥 Received attendance log from Realtime:', log);

    // Validate required fields
    if (!log.EmployeeCode || !log.LogDateTime || !log.DeviceNo) {
      throw new Error('Missing required fields: EmployeeCode, LogDateTime, or DeviceNo');
    }

    // Parse the datetime from Realtime format
    const logDateTime = new Date(log.LogDateTime);
    if (isNaN(logDateTime.getTime())) {
      throw new Error('Invalid LogDateTime format');
    }

    // Determine log type based on time or existing logic
    const logType = await determineLogType(log.EmployeeCode, logDateTime);

    // Insert into attendance_machine_logs table
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

    if (error) throw error;

    // Also update the main attendance table for daily records
    await updateDailyAttendanceRecord(log.EmployeeCode, logDateTime, logType);

    console.log('✅ Attendance log processed successfully:', data.id);

    return {
      success: true,
      message: 'Attendance log processed successfully',
      logId: data.id
    };

  } catch (error) {
    console.error('❌ Failed to process attendance log:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Determine log type based on employee's last punch and current time
 */
async function determineLogType(employeeCode: string, logDateTime: Date): Promise<string> {
  try {
    // Get the last log for this employee today
    const today = logDateTime.toISOString().split('T')[0];
    
    const { data: lastLog } = await supabase
      .from('attendance_machine_logs')
      .select('log_type, timestamp')
      .eq('user_id', employeeCode)
      .gte('timestamp', `${today}T00:00:00`)
      .lt('timestamp', `${today}T23:59:59`)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // If no previous log today, this is IN
    if (!lastLog) {
      return 'IN';
    }

    // Toggle between IN/OUT based on last punch
    switch (lastLog.log_type) {
      case 'IN':
      case 'BREAK_IN':
        return 'OUT';
      case 'OUT':
      case 'BREAK_OUT':
        return 'IN';
      default:
        return 'IN';
    }

  } catch (error) {
    console.error('Failed to determine log type, defaulting to IN:', error);
    return 'IN';
  }
}

/**
 * Update daily attendance record
 */
async function updateDailyAttendanceRecord(
  employeeCode: string, 
  logDateTime: Date, 
  logType: string
): Promise<void> {
  try {
    const dateString = logDateTime.toISOString().split('T')[0];
    
    // Get employee ID from employee code
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_id', employeeCode)
      .single();

    if (!employee) {
      console.warn(`Employee not found for code: ${employeeCode}`);
      return;
    }

    // Get or create daily attendance record
    const { data: existingRecord } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', dateString)
      .single();

    const timeString = logDateTime.toTimeString().split(' ')[0];

    if (existingRecord) {
      // Update existing record
      const updates: any = {};
      
      if (logType === 'IN' && !existingRecord.check_in) {
        updates.check_in = timeString;
        updates.status = 'present';
      } else if (logType === 'OUT') {
        updates.check_out = timeString;
        
        // Calculate total hours if both check_in and check_out exist
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
      // Create new attendance record
      await supabase
        .from('attendance')
        .insert({
          employee_id: employee.id,
          date: dateString,
          check_in: logType === 'IN' ? timeString : null,
          check_out: logType === 'OUT' ? timeString : null,
          status: logType === 'IN' ? 'present' : 'absent',
          notes: `Auto-generated from Realtime Biometrics device: ${logDateTime.toLocaleString()}`
        });
    }

  } catch (error) {
    console.error('Failed to update daily attendance record:', error);
  }
}

/**
 * API endpoint handler for Express.js / Next.js API routes
 */
export async function handleRealtimeWebhook(req: any, res: any) {
  // Enable CORS for OnlineRealSoft
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await processRealtimeAttendanceLog(req.body);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}