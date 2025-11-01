# HR Management System

A comprehensive Human Resources management system built with React, TypeScript, and Supabase. This system provides complete employee management, attendance tracking, leave management, and administrative controls.

## Features

- **Employee Management**: Complete employee profiles with personal and professional information
- **Attendance Tracking**: OnlineRealSoft webhook integration for automatic attendance logging
- **Leave Management**: Comprehensive leave request system with policies, balances, and approvals
- **Role-Based Access**: Secure authentication with admin and employee roles
- **Real-time Updates**: Live data synchronization using Supabase
- **Responsive Design**: Mobile-friendly interface built with Material-UI

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Material-UI (MUI)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Integration**: OnlineRealSoft webhook for attendance
- **Deployment**: Vercel (frontend) + Render (backend webhook)

## Database Setup

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. Go to the SQL editor in your Supabase dashboard
3. **Important:** Run the database scripts in this exact order:
   - **First**: `fix-employees-table.sql` (quick fix for missing columns - run this immediately if you get column errors)
   - **Second**: `database-schema-fix.sql` (ensures proper data types)
   - **Third**: `database-auth-migration.sql` (creates authentication system)
   - **Fourth**: `database-leave-management.sql` (creates leave management system)
4. Update the environment variables in your deployment platforms with your Supabase credentials

### Database Migration Files

- **fix-employees-table.sql**: Quick fix for missing columns (run first if you have errors)
- **database-schema-fix.sql**: Type safety fixes for PostgreSQL compatibility
- **database-auth-migration.sql**: Authentication system with RLS policies
- **database-leave-management.sql**: Complete leave management system

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hr-software
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## Production Deployment

### Frontend (Vercel)
- Repository: Connected to GitHub for automatic deployments
- Environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- Build command: `npm run build`
- Output directory: `dist`

### Backend Webhook (Render)
- Repository: Deploy `backend/` directory
- Environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY
- Start command: `node server.js`

## Features Overview

### Employee Management
- Complete employee profiles with contact information
- Department and position tracking
- Hire date and salary management
- Employee status (active/inactive/terminated)

### Attendance System
- OnlineRealSoft webhook integration
- Automatic attendance logging
- Check-in/check-out tracking
- Hours worked calculation

### Leave Management
- Multiple leave types (Annual, Sick, Personal, Maternity, etc.)
- Leave policies with allocation and carry-forward rules
- Employee leave balances tracking
- Leave request workflow (submit, approve, reject)
- Leave calendar visualization

### Authentication & Security
- JWT-based authentication
- Role-based access control (Admin/Employee)
- Row Level Security (RLS) policies
- Secure API endpoints

## Project Structure

```
hr-software/
├── frontend/src/           # React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Application pages
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── backend/               # Webhook server
│   ├── server.js          # Express server for OnlineRealSoft
│   └── package.json       # Backend dependencies
├── database-schema-fix.sql      # Database type fixes
├── database-auth-migration.sql  # Authentication setup
└── database-leave-management.sql # Leave management setup
```

## API Integration

### OnlineRealSoft Webhook
- Endpoint: `/api/attendance-webhook`
- Method: POST
- Purpose: Receives attendance data from OnlineRealSoft systems
- Processing: Automatic employee attendance logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
