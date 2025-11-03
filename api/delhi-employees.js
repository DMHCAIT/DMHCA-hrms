// Delhi Branch Employee Sync API
// /api/delhi-employees.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dmhcahrmssystem.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtaGNhaHJtc3N5c3RlbSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzMwNDU0MTY4LCJleHAiOjIwNDYwMzAxNjh9.XYTaF5vRhPGiT60jBT40qEyNQzo8t0R4Lv5FDl7WNqI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Delhi Branch Employee Data from your CSV
const delhiEmployees = [
  { cardno: 37, empname: 'sajid', branch: 'Sultanpur New Delhi', empcode: 'DEL0037' },
  { cardno: 1745, empname: 'anju', branch: 'Sultanpur New Delhi', empcode: 'DEL1745' },
  { cardno: 870, empname: 'sajid it', branch: 'Sultanpur New Delhi', empcode: 'DEL0870' },
  { cardno: 6663, empname: 'angela', branch: 'Sultanpur New Delhi', empcode: 'DEL6663' },
  { cardno: 7947, empname: 'chhatarpal', branch: 'Sultanpur New Delhi', empcode: 'DEL7947' },
  { cardno: 38, empname: 'chandan', branch: 'Sultanpur New Delhi', empcode: 'DEL0038' },
  { cardno: 399, empname: 'kartij', branch: 'Sultanpur New Delhi', empcode: 'DEL0399' },
  { cardno: 4604, empname: 'poonam', branch: 'Sultanpur New Delhi', empcode: 'DEL4604' },
  { cardno: 3091, empname: 'sohail', branch: 'Sultanpur New Delhi', empcode: 'DEL3091' },
  { cardno: 3093, empname: 'meekad', branch: 'Sultanpur New Delhi', empcode: 'DEL3093' },
  { cardno: 4402, empname: 'shagun', branch: 'Sultanpur New Delhi', empcode: 'DEL4402' },
  { cardno: 2362, empname: 'loveleen', branch: 'Sultanpur New Delhi', empcode: 'DEL2362' },
  { cardno: 9727, empname: 'akshay', branch: 'Sultanpur New Delhi', empcode: 'DEL9727' },
  { cardno: 6231, empname: 'momin', branch: 'Sultanpur New Delhi', empcode: 'DEL6231' },
  { cardno: 2782, empname: 'rabiya', branch: 'Sultanpur New Delhi', empcode: 'DEL2782' },
  { cardno: 6469, empname: 'fasiuddin', branch: 'Sultanpur New Delhi', empcode: 'DEL6469' },
  { cardno: 2645, empname: 'sahil', branch: 'Sultanpur New Delhi', empcode: 'DEL2645' },
  { cardno: 6820, empname: 'lahareesh', branch: 'Sultanpur New Delhi', empcode: 'DEL6820' },
  { cardno: 2644, empname: 'iqrar', branch: 'Sultanpur New Delhi', empcode: 'DEL2644' },
  { cardno: 9218, empname: 'shilpi', branch: 'Sultanpur New Delhi', empcode: 'DEL9218' },
  { cardno: 6520, empname: 'keshav', branch: 'Sultanpur New Delhi', empcode: 'DEL6520' },
  { cardno: 7719, empname: 'rajesh', branch: 'Sultanpur New Delhi', empcode: 'DEL7719' },
  { cardno: 5020, empname: 'avnisha', branch: 'Sultanpur New Delhi', empcode: 'DEL5020' },
  { cardno: 120, empname: 'manisha', branch: 'Sultanpur New Delhi', empcode: 'DEL0120' },
  { cardno: 7135, empname: 'ashwani', branch: 'Sultanpur New Delhi', empcode: 'DEL7135' },
  { cardno: 9904, empname: 'soniya', branch: 'Sultanpur New Delhi', empcode: 'DEL9904' },
  { cardno: 5395, empname: 'santhosh', branch: 'Sultanpur New Delhi', empcode: 'DEL5395' }
];

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;

    switch (action) {
      case 'list':
        return handleListEmployees(req, res);
      case 'sync':
        return handleSyncEmployees(req, res);
      case 'csv':
        return handleExportCSV(req, res);
      case 'rs9w':
        return handleRS9WFormat(req, res);
      default:
        return handleListEmployees(req, res);
    }
  } catch (error) {
    console.error('Delhi Employees API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// List all Delhi employees
async function handleListEmployees(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Delhi branch employees retrieved successfully',
    branch: 'Sultanpur New Delhi',
    total_employees: delhiEmployees.length,
    employees: delhiEmployees,
    rs9w_machines: [
      { serial: 'RS2203601333B8', location: 'Sultanpur New Delhi - Main' },
      { serial: 'RS2203601333B', location: 'Sultanpur New Delhi - Branch' },
      { serial: 'RS2203601333B6', location: 'Sultanpur New Delhi - Backup' }
    ]
  });
}

// Sync employees to Supabase database
async function handleSyncEmployees(req, res) {
  try {
    const employeesToSync = delhiEmployees.map(emp => ({
      employee_id: emp.empcode,
      card_number: emp.cardno.toString(),
      first_name: emp.empname.split(' ')[0] || emp.empname,
      last_name: emp.empname.split(' ').slice(1).join(' ') || '',
      email: `${emp.empname.replace(/\s+/g, '').toLowerCase()}@dmhca.com`,
      phone: `+91${9000000000 + emp.cardno}`, // Generate sample phone numbers
      department: 'General',
      position: 'Staff',
      branch: emp.branch,
      status: 'Active',
      hire_date: '2024-01-01',
      created_at: new Date().toISOString()
    }));

    // Insert employees into Supabase
    const { data, error } = await supabase
      .from('employees')
      .upsert(employeesToSync, { 
        onConflict: 'employee_id',
        ignoreDuplicates: false 
      });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Delhi employees synced to database successfully',
      synced_count: employeesToSync.length,
      employees: employeesToSync
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to sync employees to database',
      error: error.message
    });
  }
}

// Export as CSV for RS9W machine import
async function handleExportCSV(req, res) {
  let csvContent = 'CardNo,EmpName,Branch,EmpCode,Email,Phone\n';
  
  delhiEmployees.forEach(emp => {
    csvContent += `${emp.cardno},"${emp.empname}","${emp.branch}","${emp.empcode}","${emp.empname.replace(/\s+/g, '').toLowerCase()}@dmhca.com","+91${9000000000 + emp.cardno}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="delhi_employees.csv"');
  return res.status(200).send(csvContent);
}

// Format for RS9W machine enrollment
async function handleRS9WFormat(req, res) {
  const rs9wFormat = delhiEmployees.map(emp => ({
    ID: emp.cardno,
    Name: emp.empname,
    Card: emp.cardno,
    Privilege: 0, // Normal user
    Password: '', // No password required
    Group: 1, // Default group
    TimeZone: 1, // Default timezone
    Verify: 15 // Fingerprint + Card verification
  }));

  return res.status(200).json({
    success: true,
    message: 'Delhi employees formatted for RS9W enrollment',
    format: 'RS9W Machine Import Format',
    total_employees: rs9wFormat.length,
    employees: rs9wFormat,
    import_instructions: [
      '1. Download this JSON data',
      '2. Convert to your RS9W machine format if needed',
      '3. Import employees into each RS9W machine',
      '4. Enroll fingerprints for each employee',
      '5. Test attendance with sample employee'
    ]
  });
}