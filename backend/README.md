# HR Software Backend API

This is the backend API server for the HR Software system, built with Node.js, Express, and Supabase.

## Features

- **Employee Management**: CRUD operations for employees
- **Attendance System**: RS9W biometric machine integration
- **Authentication**: Token-based API authentication
- **Database**: Supabase PostgreSQL integration
- **CORS**: Configured for frontend communication

## API Endpoints

### Attendance
- `POST /api/attendance` - Record attendance data from RS9W machines
- `GET /api/attendance` - Fetch attendance records
- `GET /api/attendance/health` - Health check

### Employees  
- `GET /api/employees` - Get all employees (with pagination and search)
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `POST /api/employees/sync` - Sync employees from external source

### Health Check
- `GET /health` - Server health check

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your Supabase credentials

4. Start development server:
   ```bash
   npm run dev
   ```

5. Start production server:
   ```bash
   npm start
   ```

## Environment Variables

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key  
- `ATTENDANCE_API_TOKEN` - Bearer token for attendance API
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS

## RS9W Integration

The attendance endpoint accepts data from Realtime RS9W biometric machines:

```json
{
  "employee_id": "123",
  "card_number": "12345",
  "punch_time": "2025-11-04T10:00:00Z",
  "punch_type": "in",
  "machine_id": "RS2203601333B8"
}
```

Authentication required: `Authorization: Bearer dmhca_attendance_token_2025`