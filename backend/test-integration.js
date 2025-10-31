#!/usr/bin/env node
// 🧪 Test Script for OnlineRealSoft Integration

const http = require('http');

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${COLORS.reset}`);
}

async function testEndpoint(url, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 'ERROR',
        data: error.message
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log(`${COLORS.bold}🧪 OnlineRealSoft Integration Test Suite${COLORS.reset}\n`);

  const baseUrl = 'http://localhost:4000';
  
  // Test 1: Server Health Check
  log(COLORS.blue, '📡 Test 1: Server Health Check');
  const healthCheck = await testEndpoint(`${baseUrl}/api/test`);
  
  if (healthCheck.status === 200) {
    log(COLORS.green, '✅ Server is running and responding');
    try {
      const parsed = JSON.parse(healthCheck.data);
      log(COLORS.green, `   📅 Server time: ${parsed.timestamp}`);
    } catch (e) {
      log(COLORS.yellow, '⚠️  Response not JSON format');
    }
  } else if (healthCheck.status === 'ERROR') {
    log(COLORS.red, `❌ Server not running: ${healthCheck.data}`);
    log(COLORS.yellow, '   💡 Start server with: node realtime-server.js');
    return;
  } else {
    log(COLORS.red, `❌ Unexpected response: ${healthCheck.status}`);
  }

  console.log('');

  // Test 2: Webhook Endpoint
  log(COLORS.blue, '📡 Test 2: Webhook Endpoint Test');
  const testData = {
    EmployeeCode: 'TEST001',
    LogDateTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
    DeviceNo: 'RS9W-TEST',
    DeviceName: 'Test Device'
  };

  const webhookTest = await testEndpoint(`${baseUrl}/api/attendance/realtime`, 'POST', testData);
  
  if (webhookTest.status === 200) {
    log(COLORS.green, '✅ Webhook endpoint accepting data');
    try {
      const parsed = JSON.parse(webhookTest.data);
      if (parsed.success) {
        log(COLORS.green, `   📝 Log created with ID: ${parsed.logId}`);
        log(COLORS.green, `   🏷️  Log type detected: ${parsed.logType}`);
      } else {
        log(COLORS.yellow, `   ⚠️  ${parsed.message}`);
      }
    } catch (e) {
      log(COLORS.yellow, '⚠️  Response format unexpected');
    }
  } else {
    log(COLORS.red, `❌ Webhook test failed: ${webhookTest.status}`);
    log(COLORS.red, `   Error: ${webhookTest.data}`);
  }

  console.log('');

  // Test 3: Configuration Summary
  log(COLORS.blue, '🔧 Test 3: Configuration Summary');
  log(COLORS.green, '✅ Use these settings in OnlineRealSoft:');
  console.log(`
┌─────────────────────────────────────────────────┐
│ API URL: ${baseUrl}/api/attendance/realtime     │
│ Method: POST                                    │
│ Content-Type: application/json                  │
│ Auth: No Auth                                   │
│                                                 │
│ Field Mapping:                                  │
│ • EmployeeCode → Employee Name/Code             │
│ • LogDateTime → Log Date Time                   │
│ • DeviceNo → Device Serial No                   │
│ • DeviceName → Device Name (optional)           │
└─────────────────────────────────────────────────┘
  `);

  // Test 4: Sample Data Format
  log(COLORS.blue, '📋 Test 4: Expected Data Format');
  console.log(`
Sample payload OnlineRealSoft should send:
${COLORS.yellow}${JSON.stringify(testData, null, 2)}${COLORS.reset}
  `);

  console.log('');
  log(COLORS.bold, '🎉 Test Complete!');
  
  if (healthCheck.status === 200 && webhookTest.status === 200) {
    log(COLORS.green, '✅ Integration server is ready for OnlineRealSoft connection!');
    log(COLORS.blue, '📖 Next: Configure OnlineRealSoft Third-Party API settings');
  } else {
    log(COLORS.red, '❌ Some tests failed. Check server and try again.');
  }
}

// Run tests
runTests().catch(console.error);