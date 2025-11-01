// API Route: /api/attendance
// This will be deployed on your backend to receive attendance data

import { Request, Response } from 'express';
import { processAttendanceData, batchProcessAttendance, validateAttendanceData, AttendanceLogEntry } from '../services/attendanceApi';

/**
 * POST /api/attendance
 * Receives attendance data from Realtime RS9W machine
 */
export const receiveAttendanceData = async (req: Request, res: Response) => {
  try {
    // Log the incoming request for debugging
    console.log('Received attendance data:', {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Verify Bearer Token (you should store this securely)
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.ATTENDANCE_API_TOKEN || 'dmhca_attendance_token_2025';
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (token !== expectedToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API token'
      });
    }

    // Parse request body
    const requestData = req.body;

    // Handle single entry or batch of entries
    if (Array.isArray(requestData)) {
      // Batch processing
      const validEntries = requestData.filter(validateAttendanceData);
      
      if (validEntries.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid attendance entries found'
        });
      }

      const result = await batchProcessAttendance(validEntries);
      return res.status(result.success ? 200 : 400).json(result);

    } else {
      // Single entry processing
      if (!validateAttendanceData(requestData)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid attendance data format'
        });
      }

      const result = await processAttendanceData(requestData as AttendanceLogEntry);
      return res.status(result.success ? 200 : 400).json(result);
    }

  } catch (error) {
    console.error('API Error processing attendance data:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing attendance data'
    });
  }
};

/**
 * GET /api/attendance/test
 * Test endpoint to verify API is working
 */
export const testAttendanceApi = (req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Attendance API is working',
    timestamp: new Date().toISOString(),
    config: {
      endpoint: '/api/attendance',
      method: 'POST',
      authRequired: 'Bearer Token',
      contentType: 'application/json'
    }
  });
};

/**
 * POST /api/attendance/manual
 * Manual attendance entry for testing
 */
export const manualAttendanceEntry = async (req: Request, res: Response) => {
  try {
    const sampleData: AttendanceLogEntry = {
      employee_code: req.body.employee_code || 'E001',
      log_datetime: req.body.log_datetime || new Date().toISOString().replace('T', ' ').substring(0, 19),
      log_time: req.body.log_time || new Date().toTimeString().substring(0, 8),
      device_sn: req.body.device_sn || 'RS9W-TEST',
      downloaded_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    const result = await processAttendanceData(sampleData);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process manual entry'
    });
  }
};