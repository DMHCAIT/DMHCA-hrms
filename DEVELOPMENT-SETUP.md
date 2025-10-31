# DMHCA HR Management System - Development Setup

## 🚀 Quick Start

### VSCode Workspace Setup
1. Open the `dmhca-hrms.code-workspace` file in VSCode
2. Install recommended extensions when prompted
3. Restart VSCode TypeScript service: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Project Structure
```
hr-software/
├── frontend/              # React TypeScript application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts (Auth, HR)
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript type definitions
│   │   └── lib/          # Utilities and configurations
├── backend/              # Node.js Express server
├── database-*.sql        # Database migration files
└── *.md                 # Documentation files
```

## 🔧 Development Commands

### Frontend Development
```bash
cd frontend
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
```

### Backend Development
```bash
cd backend
npm install          # Install dependencies
node realtime-server.js  # Start webhook server
```

## 🐛 Troubleshooting

### VSCode TypeScript Errors
If you see import errors or "Cannot find module" errors in VSCode:

1. **Check Workspace Configuration**
   - Open `dmhca-hrms.code-workspace` file in VSCode
   - Ensure you're working in the correct workspace context

2. **Restart TypeScript Service**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "TypeScript: Restart TS Server"
   - Press Enter

3. **Clear Cache and Reload**
   - Close VSCode completely
   - Delete `node_modules` and reinstall:
     ```bash
     cd frontend
     rm -rf node_modules package-lock.json
     npm install
     ```
   - Reopen VSCode

4. **Check File Paths**
   - Ensure you're editing files in `frontend/src/` not just `src/`
   - All TypeScript files should be in the frontend directory

### Common Issues

#### "Cannot find module '../services/supabase'"
- **Solution**: The file exists at `frontend/src/services/supabase.ts`
- Check if VSCode is looking at the correct workspace root
- Restart TypeScript service

#### "Cannot find module '../types/leave.types'"
- **Solution**: The file exists at `frontend/src/types/leave.types.ts`
- Ensure you're in the correct workspace context

#### Build Errors
```bash
# Test if the code compiles correctly
cd frontend
npm run build
```

If build succeeds but VSCode shows errors, it's a workspace configuration issue.

#### ESLint Warnings
The project uses strict TypeScript linting. Current warnings are:
- `@typescript-eslint/no-explicit-any` - Will be fixed gradually
- `react-hooks/exhaustive-deps` - Missing dependencies in useEffect
- `@typescript-eslint/no-unused-vars` - Unused variables

These are warnings and don't prevent the application from running.

## 📁 File Organization

### Key Files
- `frontend/src/App.tsx` - Main application component with routing
- `frontend/src/contexts/AuthContext.tsx` - Authentication context
- `frontend/src/components/auth/LoginForm.tsx` - Login interface
- `frontend/src/components/employee/` - Employee-specific components
- `frontend/src/components/admin/` - Admin-specific components

### Service Files
- `frontend/src/services/supabase.ts` - Database service layer
- `frontend/src/lib/supabase.ts` - Supabase client configuration
- `frontend/src/services/userManagement.ts` - User account management

## 🔑 Environment Setup

### Required Environment Variables
Create `frontend/.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup
1. Run migrations in Supabase SQL editor:
   - `database-auth-migration.sql`
   - `database-leave-management.sql`

## 🎯 Features Status

### ✅ Completed
- Authentication system with role-based access
- Employee dashboard with personal data
- Admin dashboard with full HR features
- Leave management system
- User account creation (admin)
- Password change functionality
- Responsive Material-UI design

### 🔄 In Development
- Performance optimizations
- Enhanced reporting features
- Mobile application

## 💻 Development Tips

### TypeScript Best Practices
1. Use proper type definitions instead of `any`
2. Define interfaces for all data structures
3. Use type guards for runtime type checking

### Component Organization
1. Keep components small and focused
2. Use custom hooks for shared logic
3. Implement proper error boundaries

### Code Quality
```bash
# Fix automatically fixable linting issues
npm run lint -- --fix

# Check types without building
npx tsc --noEmit
```

## 🚀 Deployment

The application is configured for deployment to:
- **Frontend**: Vercel (automatic deployment from GitHub)
- **Backend**: Render (webhook server)
- **Database**: Supabase (managed PostgreSQL)

See `DEPLOYMENT-GUIDE.md` for detailed deployment instructions.

## 📞 Support

If you encounter issues:
1. Check this troubleshooting guide
2. Verify all dependencies are installed
3. Ensure database migrations are applied
4. Check environment variables are configured
5. Review the browser console for runtime errors

The codebase compiles successfully - any TypeScript errors in VSCode are likely workspace configuration issues that can be resolved by following the troubleshooting steps above.