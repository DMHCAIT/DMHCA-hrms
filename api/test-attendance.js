// Vercel Serverless Function: /api/test-attendance.js
// Test endpoint for Realtime RS9W integration

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'Attendance API is working correctly',
      timestamp: new Date().toISOString(),
      endpoints: {
        attendance: {
          url: 'https://dmhcahrms.xyz/api/attendance',
          method: 'POST',
          auth: 'Bearer dmhca_attendance_token_2025',
          contentType: 'application/json'
        }
      },
      samplePayload: {
        employee_code: "E001",
        log_datetime: "2025-11-01 09:00:00",
        log_time: "09:00:00",
        device_sn: "RS9W-001",
        downloaded_at: "2025-11-01 09:01:00"
      },
      testInstructions: [
        "1. Configure your RS9W machine with the endpoint URL above",
        "2. Set Authorization header: Bearer dmhca_attendance_token_2025", 
        "3. Set Content-Type: application/json",
        "4. Map your employee IDs to employee_code field",
        "5. Test with a sample punch to verify connection"
      ]
    });
  }

  // For POST, simulate attendance processing
  if (req.method === 'POST') {
    const testData = {
      employee_code: req.body?.employee_code || 'TEST001',
      log_datetime: req.body?.log_datetime || new Date().toISOString().replace('T', ' ').substring(0, 19),
      log_time: req.body?.log_time || new Date().toTimeString().substring(0, 8),
      device_sn: req.body?.device_sn || 'RS9W-TEST'
    };

    return res.status(200).json({
      success: true,
      message: 'Test attendance data received successfully',
      receivedData: testData,
      note: 'This is a test endpoint. Use /api/attendance for actual data submission.'
    });
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}