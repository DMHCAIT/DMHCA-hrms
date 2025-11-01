// Vercel Serverless Function: /api/sync-employees.js
// Provides employee data for RS9W machine synchronization

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dmhcahrmssystem.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtaGNhaHJtc3N5c3RlbSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzMwNDU0MTY4LCJleHAiOjIwNDYwMzAxNjh9.XYTaF5vRhPGiT60jBT40qEyNQzo8t0R4Lv5FDl7WNqI';

const supabase = createClient(supabaseUrl, supabaseKey);
const EXPECTED_TOKEN = process.env.ATTENDANCE_API_TOKEN || 'dmhca_attendance_token_2025';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET for employee data
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use GET to fetch employee data.'
    });
  }

  try {
    // Verify Bearer Token (optional for GET, but recommended)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid authorization header format'
        });
      }
      
      const token = authHeader.substring(7);
      if (token !== EXPECTED_TOKEN) {
        return res.status(401).json({
          success: false,
          message: 'Invalid API token'
        });
      }
    }

    // Fetch all active employees from database
    const { data: employees, error } = await supabase
      .from('employees')
      .select(`
        employee_id,
        first_name,
        last_name,
        email,
        department,
        designation,
        phone,
        status,
        hire_date
      `)
      .eq('status', 'Active')
      .order('employee_id');

    if (error) {
      throw error;
    }

    // Format employees for RS9W machine consumption
    const formattedEmployees = employees.map(emp => ({
      employee_code: emp.employee_id,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      department: emp.department,
      designation: emp.designation,
      phone: emp.phone,
      hire_date: emp.hire_date,
      status: emp.status
    }));

    // Return employee data
    return res.status(200).json({
      success: true,
      message: `Retrieved ${employees.length} active employees`,
      timestamp: new Date().toISOString(),
      total_employees: employees.length,
      employees: formattedEmployees,
      machine_instructions: {
        sync_url: 'https://dmhcahrms.xyz/api/sync-employees',
        attendance_url: 'https://dmhcahrms.xyz/api/attendance',
        auth_token: 'dmhca_attendance_token_2025'
      }
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employee data',
      error: error.message
    });
  }
}