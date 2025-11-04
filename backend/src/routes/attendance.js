import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://ocvtacsuwkwzbpwnmlsd.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdnRhY3N1d2t3emJwd25tbHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDc3MjYsImV4cCI6MjA3Njg4MzcyNn0.JJTuluIEZfVhFTonnaXCkiuzoD5AHZs0S_MjqdEn1DA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Expected Bearer token for authentication
const EXPECTED_TOKEN = process.env.ATTENDANCE_API_TOKEN || 'dmhca_attendance_token_2025';

// Middleware for token authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  if (token !== EXPECTED_TOKEN) {
    return res.status(403).json({
      success: false,
      message: 'Invalid access token'
    });
  }

  next();
};

// POST /api/attendance - Receive attendance data from RS9W machine
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('📨 Attendance data received:', req.body);

    const {
      employee_id,
      card_number,
      punch_time,
      punch_type,
      machine_id,
      device_serial
    } = req.body;

    // Validate required fields
    if (!employee_id && !card_number) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID or card number is required'
      });
    }

    if (!punch_time) {
      return res.status(400).json({
        success: false,
        message: 'Punch time is required'
      });
    }

    // Find employee by card number or employee ID
    let employee = null;
    
    if (card_number) {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('card_number', card_number)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      employee = data;
    }

    if (!employee && employee_id) {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employee_id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      employee = data;
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Insert attendance record
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .insert([
        {
          employee_id: employee.id,
          check_in: punch_type === 'in' ? punch_time : null,
          check_out: punch_type === 'out' ? punch_time : null,
          date: new Date(punch_time).toISOString().split('T')[0],
          machine_id: machine_id || device_serial,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (attendanceError) {
      throw attendanceError;
    }

    console.log('✅ Attendance recorded successfully:', attendanceData);

    res.json({
      success: true,
      message: 'Attendance recorded successfully',
      data: {
        employee: employee.name,
        punch_time,
        punch_type,
        machine_id: machine_id || device_serial
      }
    });

  } catch (error) {
    console.error('❌ Attendance recording error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record attendance',
      error: error.message
    });
  }
});

// GET /api/attendance - Get attendance records
router.get('/', async (req, res) => {
  try {
    const { employee_id, date, limit = 50 } = req.query;

    let query = supabase
      .from('attendance')
      .select(`
        *,
        employee:employees(name, employee_code)
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (employee_id) {
      query = query.eq('employee_id', employee_id);
    }

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
      count: data ? data.length : 0
    });

  } catch (error) {
    console.error('❌ Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message
    });
  }
});

// GET /api/attendance/health - Health check for attendance API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Attendance API is healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      'POST /api/attendance': 'Record attendance data',
      'GET /api/attendance': 'Fetch attendance records',
      'GET /api/attendance/health': 'Health check'
    }
  });
});

export default router;