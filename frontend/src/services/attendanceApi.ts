// Attendance API Service for Realtime RS9W Integration
import { supabase } from '../lib/supabase';

export interface AttendanceLogEntry {
  employee_code: string;
  log_datetime: string; // YYYY-MM-DD HH:mm:ss
  log_time: string; // HH:mm:ss
  downloaded_at?: string; // YYYY-MM-DD HH:mm:ss
  device_sn: string;
  log_type?: 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT';
}

export interface AttendanceApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Process incoming attendance data from Realtime RS9W machine
 */
export const processAttendanceData = async (attendanceData: AttendanceLogEntry): Promise<AttendanceApiResponse> => {
  try {
    // Validate required fields
    if (!attendanceData.employee_code || !attendanceData.log_datetime || !attendanceData.device_sn) {
      return {
        success: false,
        message: 'Missing required fields: employee_code, log_datetime, or device_sn'
      };
    }

    // Parse the datetime
    const logDateTime = new Date(attendanceData.log_datetime);
    const logDate = logDateTime.toISOString().split('T')[0];
    const logTime = attendanceData.log_time || logDateTime.toTimeString().split(' ')[0];

    // Determine if this is check-in or check-out based on existing records
    const { data: existingLogs } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', attendanceData.employee_code)
      .eq('date', logDate)
      .order('created_at', { ascending: false })
      .limit(1);

    let logType: 'IN' | 'OUT' = 'IN';
    if (existingLogs && existingLogs.length > 0) {
      const lastLog = existingLogs[0];
      logType = lastLog.time_out ? 'IN' : 'OUT';
    }

    // Prepare attendance record
    const attendanceRecord = {
      employee_id: attendanceData.employee_code,
      date: logDate,
      time_in: logType === 'IN' ? logTime : null,
      time_out: logType === 'OUT' ? logTime : null,
      device_serial: attendanceData.device_sn,
      sync_datetime: attendanceData.downloaded_at || new Date().toISOString(),
      status: 'Present',
      created_at: new Date().toISOString()
    };

    // If it's a check-out, update existing record
    if (logType === 'OUT' && existingLogs && existingLogs.length > 0) {
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          time_out: logTime,
          sync_datetime: attendanceData.downloaded_at || new Date().toISOString()
        })
        .eq('id', existingLogs[0].id);

      if (updateError) {
        throw updateError;
      }

      return {
        success: true,
        message: `Check-out recorded for employee ${attendanceData.employee_code} at ${logTime}`
      };
    } else {
      // Insert new check-in record
      const { error: insertError } = await supabase
        .from('attendance')
        .insert([attendanceRecord]);

      if (insertError) {
        throw insertError;
      }

      return {
        success: true,
        message: `Check-in recorded for employee ${attendanceData.employee_code} at ${logTime}`
      };
    }

  } catch (error) {
    console.error('Error processing attendance data:', error);
    return {
      success: false,
      message: `Failed to process attendance data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Batch process multiple attendance entries
 */
export const batchProcessAttendance = async (attendanceEntries: AttendanceLogEntry[]): Promise<AttendanceApiResponse> => {
  try {
    const results = await Promise.all(
      attendanceEntries.map(entry => processAttendanceData(entry))
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      success: failed === 0,
      message: `Processed ${successful} entries successfully${failed > 0 ? `, ${failed} failed` : ''}`,
      data: { successful, failed, results }
    };
  } catch (error) {
    return {
      success: false,
      message: `Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Validate attendance data format
 */
export const validateAttendanceData = (data: any): data is AttendanceLogEntry => {
  return (
    typeof data === 'object' &&
    typeof data.employee_code === 'string' &&
    typeof data.log_datetime === 'string' &&
    typeof data.device_sn === 'string' &&
    (data.log_time === undefined || typeof data.log_time === 'string') &&
    (data.downloaded_at === undefined || typeof data.downloaded_at === 'string')
  );
};

/**
 * Generate Bearer Token for API authentication
 */
export const generateApiToken = (): string => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2);
  return `dmhca_${timestamp}_${randomPart}`;
};

// API Configuration for Realtime RS9W
export const REALTIME_API_CONFIG = {
  requestMethod: 'POST',
  authType: 'Bearer Token',
  contentType: 'application/json',
  dataFormat: 'Body',
  apiUrl: 'https://dmhcahrms.xyz/api/attendance',
  samplePayload: {
    employee_code: "E1023",
    log_datetime: "2025-11-01 08:45:00",
    log_time: "08:45:00",
    downloaded_at: "2025-11-01 08:46:00",
    device_sn: "RS9W-001"
  }
};