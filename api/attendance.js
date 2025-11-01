// Vercel Serverless Function: /api/attendance.js
// Receives attendance data from Realtime RS9W machine

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dmhcahrmssystem.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtaGNhaHJtc3N5c3RlbSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzMwNDU0MTY4LCJleHAiOjIwNDYwMzAxNjh9.XYTaF5vRhPGiT60jBT40qEyNQzo8t0R4Lv5FDl7WNqI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Expected Bearer token for authentication
const EXPECTED_TOKEN = process.env.ATTENDANCE_API_TOKEN || 'dmhca_attendance_token_2025';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST for attendance data
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST to submit attendance data.'
    });
  }

  try {
    // Log incoming request for debugging
    console.log('Received attendance data:', {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Verify Bearer Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Missing or invalid authorization header. Use: Bearer dmhca_attendance_token_2025'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (token !== EXPECTED_TOKEN) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API token'
      });
    }

    // Validate required fields
    const { employee_code, log_datetime, log_time, device_sn, downloaded_at } = req.body;
    
    if (!employee_code || !log_datetime || !device_sn) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: employee_code, log_datetime, device_sn'
      });
    }

    // Parse the datetime
    const logDateTime = new Date(log_datetime);
    const logDate = logDateTime.toISOString().split('T')[0];
    const logTimeFormatted = log_time || logDateTime.toTimeString().split(' ')[0];

    // Check if employee exists
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('employee_id, first_name, last_name')
      .eq('employee_id', employee_code)
      .single();

    if (empError || !employee) {
      return res.status(404).json({
        success: false,
        message: `Employee with code ${employee_code} not found`
      });
    }

    // Check for existing attendance record for this date
    const { data: existingRecord } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee_code)
      .eq('date', logDate)
      .single();

    let result;
    let message;

    if (existingRecord) {
      // Update existing record with check-out time
      if (!existingRecord.time_out) {
        const { error: updateError } = await supabase
          .from('attendance')
          .update({
            time_out: logTimeFormatted,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);

        if (updateError) throw updateError;
        
        message = `Check-out recorded for ${employee.first_name} ${employee.last_name} at ${logTimeFormatted}`;
      } else {
        message = `Attendance already complete for ${employee.first_name} ${employee.last_name} on ${logDate}`;
      }
    } else {
      // Create new attendance record with check-in time
      const { error: insertError } = await supabase
        .from('attendance')
        .insert([{
          employee_id: employee_code,
          date: logDate,
          time_in: logTimeFormatted,
          status: 'Present',
          device_serial: device_sn,
          sync_datetime: downloaded_at || new Date().toISOString(),
          created_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;
      
      message = `Check-in recorded for ${employee.first_name} ${employee.last_name} at ${logTimeFormatted}`;
    }

    return res.status(200).json({
      success: true,
      message: message,
      data: {
        employee_code,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        date: logDate,
        time: logTimeFormatted,
        device: device_sn
      }
    });

  } catch (error) {
    console.error('API Error processing attendance data:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing attendance data',
      error: error.message
    });
  }
}