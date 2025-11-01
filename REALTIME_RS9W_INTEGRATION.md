# Realtime RS9W Biometric Attendance Integration Guide

## Overview
This guide explains how to integrate your Realtime RS9W attendance machine with your HR system to automatically sync attendance data.

## 🔧 Configuration Settings for Realtime RS9W

### 1. Third-Party API Integration Setup

**Request Method:** `POST`
**Authorization Type:** `Bearer Token` 
**Content-Type:** `application/json`
**Data Format:** `Body`
**API Endpoint URL:** `https://dmhcahrms.xyz/api/attendance`

### 2. Authentication Configuration

**Bearer Token:** `dmhca_attendance_token_2025`
- Add this in your Realtime RS9W machine configuration
- Header format: `Authorization: Bearer dmhca_attendance_token_2025`

### 3. Required Parameters Configuration

| Field | Parameter Name | Required | Format | Example |
|-------|----------------|----------|---------|---------|
| Employee Code | `employee_code` | ✅ Yes | String/Int | "E1023" |
| Log DateTime | `log_datetime` | ✅ Yes | YYYY-MM-DD HH:mm:ss | "2025-11-01 08:45:00" |
| Log Time | `log_time` | ✅ Yes | HH:mm:ss | "08:45:00" |
| Download DateTime | `downloaded_at` | ❌ Optional | YYYY-MM-DD HH:mm:ss | "2025-11-01 08:46:00" |
| Device Serial | `device_sn` | ✅ Yes | String | "RS9W-001" |

### 4. Sample JSON Payload

```json
{
  "employee_code": "E1023",
  "log_datetime": "2025-11-01 08:45:00",
  "log_time": "08:45:00",
  "downloaded_at": "2025-11-01 08:46:00",
  "device_sn": "RS9W-001"
}
```

## 🚀 Step-by-Step Setup Instructions

### Step 1: Configure Your Realtime RS9W Machines

Since you have **3 machines**, configure each one with these exact settings:

#### **🔧 Common Settings (Same for all 3 machines):**

**Request Method:** `POST` (Select from dropdown)
**Authorization Auth Type:** `Bearer token` (Select from dropdown)  
**Token:** `dmhca_attendance_token_2025` (Enter this EXACT token)
**Content-Type:** `application/json` (Select from dropdown)
**Data Sending Format:** `Body` (Select from dropdown)
**API URL:** `https://dmhcahrms.xyz/api/attendance` (Enter this EXACT URL)

#### **📋 Field Mapping Configuration (Check all these boxes):**

✅ **Employee Name:** 
- ☑️ Check the box
- Data Type: `int` (for employee IDs) or `text` (for names)
- Maps to API field: `employee_code`

✅ **Log Date Time:**
- ☑️ Check the box  
- Format: `YYYY-MM-DD HH:mm:ss` (e.g., 2025-11-01 08:45:00)
- Maps to API field: `log_datetime`

✅ **Log Date:**
- ☑️ Check the box
- Format: `YYYY-MM-DD` (e.g., 2025-11-01)
- Maps to API field: `log_date`

✅ **Log Time:**
- ☑️ Check the box
- Format: `HH:mm:ss` (e.g., 08:45:00)
- Maps to API field: `log_time`

✅ **Download Date Time:**
- ☑️ Check the box
- Format: `YYYY-MM-DD HH:mm:ss` (e.g., 2025-11-01 08:46:00)
- Maps to API field: `downloaded_at`

✅ **Device Serial No:**
- ☑️ Check the box
- Data Type: `text`

#### **🏢 Unique Settings per Machine:**

**Machine 1:**
- Device No: `RS9W-001` (Enter in Device Serial field)
- Location: Main Entrance

**Machine 2:** 
- Device No: `RS9W-002` (Enter in Device Serial field)
- Location: Office Floor

**Machine 3:**
- Device No: `RS9W-003` (Enter in Device Serial field)
- Location: Exit Gate

### Step 2: Sync Employee Data to Machines

Before attendance tracking works, you need to sync all employees to each machine:

#### **📥 Employee Sync Endpoint:**
**URL:** `https://dmhcahrms.xyz/api/sync-employees`
**Method:** GET
**Auth:** Bearer dmhca_attendance_token_2025 (Optional)

#### **🔄 How to Sync Employees:**

**Option 1: Automatic Sync (Recommended)**
- Configure your RS9W machines to periodically fetch employee list
- Set sync schedule: Daily at 6:00 AM
- Use the employee sync URL above

**Option 2: Manual Sync**
1. Visit: `https://dmhcahrms.xyz/api/sync-employees` 
2. Copy the employee data
3. Import to each RS9W machine via admin panel
4. Repeat for all 3 machines

**Employee Data Format Returned:**
```json
{
  "employees": [
    {
      "employee_code": "E001",
      "employee_name": "John Smith", 
      "department": "IT",
      "designation": "Developer"
    }
  ]
}
```

### Step 3: Set Sync Schedule

- **Real-time:** Immediate sync after each punch (Recommended)
- **Scheduled:** Every 5-15 minutes
- **Manual:** On-demand sync
- **Employee Sync:** Daily at 6:00 AM

## 📊 What Happens After Integration

### Automatic Data Flow:
1. Employee punches in/out on RS9W machine
2. Machine sends data to your HR system API
3. System automatically creates attendance records
4. Data appears in your Leave Management dashboard

### Data Processing:
- **First punch of day:** Creates check-in record
- **Second punch:** Updates with check-out time
- **Multiple punches:** Tracks breaks and overtime
- **Invalid data:** Logged for review

## ⚙️ Testing the Integration

### Test Payload (use in Postman or similar):

**URL:** `https://dmhcahrms.xyz/api/attendance`
**Method:** POST
**Headers:**
```
Authorization: Bearer dmhca_attendance_token_2025
Content-Type: application/json
```

**Body:**
```json
{
  "employee_code": "TEST001",
  "log_datetime": "2025-11-01 09:00:00",
  "log_time": "09:00:00",
  "device_sn": "RS9W-001"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Check-in recorded for employee TEST001 at 09:00:00"
}
```

## 🏢 Multiple Machine Management (Your 3 Machines)

### Machine Identification

Each of your 3 machines will send data with unique device serial numbers:
- **Machine 1:** `RS9W-001` (Main Entrance)
- **Machine 2:** `RS9W-002` (Office Floor)  
- **Machine 3:** `RS9W-003` (Exit Gate)

### Data Flow from 3 Machines

```
Machine RS9W-001 → API → Database (device_serial: RS9W-001)
Machine RS9W-002 → API → Database (device_serial: RS9W-002) 
Machine RS9W-003 → API → Database (device_serial: RS9W-003)
```

### Employee Management Across Machines

All 3 machines need the same employee list:
1. **Sync employees** to all machines using: `https://dmhcahrms.xyz/api/sync-employees`
2. **Employee codes** must be identical across all machines
3. **New employees** require sync to all 3 machines

### Tracking Location-Based Attendance

Your system will automatically track which machine was used:
- Check-in at Main Entrance (RS9W-001)
- Check-out at Exit Gate (RS9W-003)
- Break punches at Office Floor (RS9W-002)

## 🔍 Troubleshooting

### Common Issues:

1. **Authentication Failed**
   - Verify Bearer token is correctly configured
   - Check token format: `Bearer dmhca_attendance_token_2025`

2. **Data Not Appearing**
   - Verify API URL is correct
   - Check employee codes match your system
   - Ensure datetime format is correct

3. **Connection Timeout**
   - Check internet connectivity on RS9W machine
   - Verify firewall allows outbound connections
   - Test API endpoint manually

### Error Responses:

- `401 Unauthorized`: Check Bearer token
- `400 Bad Request`: Check data format
- `500 Server Error`: Contact system administrator

## 📱 Monitoring & Logs

After setup, monitor:
- **Success Rate:** Track successful vs failed syncs
- **Data Accuracy:** Verify times match actual punches  
- **Employee Coverage:** Ensure all employees are syncing
- **Error Patterns:** Identify recurring issues

## 🎯 Benefits After Integration

✅ **Real-time Attendance:** Instant sync from machine to system
✅ **Automated Processing:** No manual data entry required
✅ **Accurate Records:** Eliminates human error
✅ **Leave Integration:** Automatic leave deduction
✅ **Payroll Ready:** Data formatted for payroll processing
✅ **Analytics:** Real-time attendance analytics

## 🔐 Security Considerations

- Keep Bearer token secure and confidential
- Use HTTPS for all API communications  
- Regularly rotate authentication tokens
- Monitor API access logs
- Implement rate limiting if needed

## 📞 Support

If you encounter issues:
1. Check this documentation first
2. Test API manually with Postman
3. Verify RS9W machine configuration
4. Contact technical support with error logs

---

**Note:** This integration requires your HR system to have the API endpoint deployed. Contact your system administrator to ensure the attendance API is properly configured and running.