# HR Software Architecture Documentation

## Project Structure

The HR Software project has been restructured for proper separation between frontend and backend components:

```
hr-software/
├── frontend/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API service layer
│   │   └── hooks/              # Custom React hooks
│   ├── public/                 # Static assets
│   └── package.json           # Frontend dependencies
├── backend/                    # Node.js + Express backend
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   │   ├── attendance.js  # Attendance management API
│   │   │   └── employees.js   # Employee management API
│   │   └── server.js          # Express server entry point
│   ├── api/                   # Legacy API files (to be migrated)
│   └── package.json          # Backend dependencies
└── package.json              # Root workspace configuration
```

## Backend API Architecture

### Server Configuration
- **Framework**: Express.js
- **Port**: 3001 (development)
- **Database**: Supabase PostgreSQL
- **Authentication**: Token-based for biometric device integration

### API Endpoints

#### Employee Management
- `GET /api/employees` - Get all employees with pagination and search
- `GET /api/employees/:id` - Get single employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update existing employee
- `DELETE /api/employees/:id` - Delete employee
- `POST /api/employees/sync` - Sync employees with biometric device

#### Attendance Management
- `GET /api/attendance` - Get attendance records with filters
- `POST /api/attendance/record` - Record attendance from RS9W biometric device
- `GET /api/attendance/today` - Get today's attendance summary
- `GET /api/attendance/stats` - Get attendance statistics

#### Health Check
- `GET /api/health` - Server health status

## Frontend Service Layer

### API Service (`src/services/api.ts`)
The frontend uses a centralized API service that:
- Handles environment-based API URL configuration
- Provides error handling and request/response formatting
- Maintains backward compatibility with existing components
- Supports both development and production environments

### Environment Configuration
- **Development**: `http://localhost:3001/api`
- **Production**: Configurable via `VITE_API_PRODUCTION_URL`

## Development Workflow

### Running the Application

#### Full Development (Both Frontend and Backend)
```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend concurrently
npm run dev
```

#### Individual Components
```bash
# Frontend only (port 5173)
npm run dev:frontend

# Backend only (port 3001)
npm run dev:backend
```

### Building for Production
```bash
# Build both components
npm run build

# Build individually
npm run build:frontend
npm run build:backend
```

## Database Schema

### Employees Table
- `id`: UUID primary key
- `employee_id`: Unique employee identifier
- `name`: Employee full name
- `email`: Employee email address
- `phone`: Contact number
- `department`: Department name
- `position`: Job position
- `hire_date`: Date of hiring
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

### Attendance Table
- `id`: UUID primary key
- `employee_id`: Reference to employee
- `date`: Attendance date
- `check_in`: Check-in timestamp
- `check_out`: Check-out timestamp
- `status`: Attendance status (present, absent, late, etc.)
- `created_at`: Record creation timestamp

## Integration Features

### RS9W Biometric Device Integration
The system supports integration with RS9W biometric attendance machines:
- Secure token-based authentication
- Real-time attendance data recording
- Employee synchronization capabilities
- Automatic data validation and error handling

### Leave Management
- Leave application and approval workflow
- Leave balance tracking
- Calendar integration for leave visualization
- Reporting and analytics

## Deployment Configuration

### Frontend (Vercel)
- Domain: `dmhcahrms.xyz`
- Build command: `npm run build:frontend`
- Output directory: `frontend/dist`

### Backend (Render - Planned)
- Node.js runtime
- Environment variables for Supabase configuration
- Auto-deploy from backend directory

## Security Considerations

- Environment variables for sensitive configuration
- Token-based authentication for device integration
- CORS configuration for cross-origin requests
- Input validation and sanitization
- Error handling without exposing sensitive information

## Future Enhancements

1. **Authentication System**: User roles and permissions
2. **Real-time Updates**: WebSocket integration for live data
3. **Mobile App**: React Native or Flutter mobile application
4. **Advanced Analytics**: Detailed reporting and insights
5. **Integration APIs**: Third-party HR system integrations
6. **Backup and Recovery**: Automated database backup solutions

## Troubleshooting

### Common Issues

#### Backend Connection Issues
- Ensure backend server is running on port 3001
- Check environment variables in backend/.env
- Verify Supabase configuration

#### Frontend API Errors
- Check VITE_API_BASE_URL in frontend environment
- Verify backend health endpoint: `http://localhost:3001/api/health`
- Check browser network tab for detailed error messages

#### Database Connection Issues
- Verify Supabase URL and service role key
- Check database permissions and RLS policies
- Ensure database schema is properly set up

### Development Tips

1. Use the health check endpoint to verify backend connectivity
2. Check browser console for frontend errors
3. Monitor backend logs for API request issues
4. Use environment files for different deployment stages
5. Test API endpoints individually using tools like Postman or curl