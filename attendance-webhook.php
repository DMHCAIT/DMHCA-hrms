// Alternative Attendance Webhook for Realtime RS9W
// Place this in your existing Realtime system

<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests for attendance data
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use POST.'
    ]);
    exit();
}

try {
    // Get the raw POST data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    // Log the incoming request for debugging
    error_log("Attendance data received: " . $json);
    
    // Validate Bearer token
    $headers = getallheaders();
    $expectedToken = 'dmhca_attendance_token_2025';
    
    if (!isset($headers['Authorization']) || 
        !str_starts_with($headers['Authorization'], 'Bearer ')) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Missing or invalid authorization header'
        ]);
        exit();
    }
    
    $token = substr($headers['Authorization'], 7); // Remove 'Bearer ' prefix
    if ($token !== $expectedToken) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid API token'
        ]);
        exit();
    }
    
    // Validate required fields
    if (!isset($data['employee_code']) || !isset($data['log_datetime']) || !isset($data['device_sn'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: employee_code, log_datetime, device_sn'
        ]);
        exit();
    }
    
    // Forward to your HR system API
    $hrSystemUrl = 'https://dmhcahrms.xyz/api/attendance-webhook';
    
    $postData = [
        'employee_code' => $data['employee_code'],
        'log_datetime' => $data['log_datetime'],
        'log_time' => $data['log_time'] ?? date('H:i:s'),
        'device_sn' => $data['device_sn'],
        'downloaded_at' => $data['downloaded_at'] ?? date('Y-m-d H:i:s'),
        'source' => 'realtime_rs9w'
    ];
    
    // Send to HR system
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $hrSystemUrl);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer dmhca_attendance_token_2025'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => "Attendance recorded for employee {$data['employee_code']}",
        'data' => $postData,
        'hr_system_response' => $response,
        'hr_system_code' => $httpCode
    ]);
    
} catch (Exception $e) {
    error_log("Attendance API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error: ' . $e->getMessage()
    ]);
}
?>