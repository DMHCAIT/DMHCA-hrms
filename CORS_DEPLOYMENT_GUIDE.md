# CORS Configuration and Backend Deployment Guide

## Current Issue
The frontend at `https://www.dmhcahrms.xyz` is being blocked by CORS policy when trying to access the backend at `https://dmhca-hrms.onrender.com`.

## CORS Configuration Fixed ✅

The backend now includes the following CORS origins:
- `https://www.dmhcahrms.xyz` (your production domain)
- `https://dmhcahrms.xyz` (without www)
- `https://dmhca-hrms.vercel.app` (Vercel deployment)
- `http://localhost:5173` (development)
- `http://localhost:3000` (development)

## Backend Environment Variables for Render

Make sure your Render backend service has these environment variables set:

```bash
# Node.js Configuration
NODE_ENV=production
PORT=3001

# Supabase Database Configuration
SUPABASE_URL=https://ocvtacsuwkwzbpwnmlsd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdnRhY3N1d2t3emJwd25tbHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDc3MjYsImV4cCI6MjA3Njg4MzcyNn0.JJTuluIEZfVhFTonnaXCkiuzoD5AHZs0S_MjqdEn1DA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdnRhY3N1d2t3emJwd25tbHNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMwNzcyNiwiZXhwIjoyMDc2ODgzNzI2fQ.Y15n2Y1X2dxdAnaA8iasIqYsWHc0zQF8czQNXxOCv7g

# CORS Configuration - CRITICAL FOR FRONTEND CONNECTION
CORS_ORIGIN=https://www.dmhcahrms.xyz,https://dmhcahrms.xyz,https://dmhca-hrms.vercel.app,http://localhost:5173,http://localhost:3000

# API Authentication
ATTENDANCE_API_TOKEN=dmhca_attendance_token_2025

# Security Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
BCRYPT_SALT_ROUNDS=12

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/combined.log
```

## API Endpoints Available

- `GET /` - Root endpoint with API information
- `GET /health` - Health check endpoint
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create new employee
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Create attendance record

## Testing the Backend

You can test if the backend is running correctly:

```bash
# Test root endpoint
curl https://dmhca-hrms.onrender.com/

# Test health check
curl https://dmhca-hrms.onrender.com/health

# Test CORS preflight (simulate browser request)
curl -X OPTIONS -H "Origin: https://www.dmhcahrms.xyz" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -v https://dmhca-hrms.onrender.com/health
```

## Render Deployment Steps

1. **Update Environment Variables**: 
   - Go to your Render dashboard
   - Select your backend service
   - Go to Environment tab
   - Add/update all the variables listed above

2. **Redeploy the Service**:
   - Push the updated code to your repository
   - Render should automatically deploy
   - Or manually trigger a deploy in the Render dashboard

3. **Verify CORS Headers**:
   - The backend should now respond with proper CORS headers
   - `Access-Control-Allow-Origin: https://www.dmhcahrms.xyz`
   - `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`

## Frontend Configuration

The frontend is configured to use:
- **Development**: `http://localhost:3001`
- **Production**: `https://dmhca-hrms.onrender.com`

## Database Setup

Don't forget to set up your Supabase database tables:
1. Go to https://ocvtacsuwkwzbpwnmlsd.supabase.co
2. Run the SQL schema from `/database/schema.sql`
3. Apply RLS policies from `/database/security.sql`

## Troubleshooting

If CORS issues persist:
1. Check Render logs for CORS-related messages
2. Verify environment variables are set correctly
3. Ensure the backend service is running (not sleeping)
4. Test the health endpoint directly
5. Check if the domain exactly matches (www vs non-www)