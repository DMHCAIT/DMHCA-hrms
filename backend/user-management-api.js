// User Management API for DMHCA HRMS
// This should run as a backend service with secure environment variables

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Environment variables (secure backend only)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3002;

// Validate environment
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Rate limiting for security
const createUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 account creations per window
  message: { error: 'Too many account creation attempts, please try again later' }
});

// Middleware to verify admin user
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if user is admin
    const { data: employee, error: empError } = await supabaseAdmin
      .from('employees')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    if (empError || !employee || employee.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ error: 'Authentication verification failed' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'DMHCA User Management API' });
});

// Create employee account endpoint
app.post('/api/employees/create', createUserLimiter, verifyAdmin, async (req, res) => {
  try {
    const {
      employee_id,
      first_name,
      last_name,
      email,
      password,
      role = 'employee',
      department,
      position,
      phone
    } = req.body;

    // Validate required fields
    if (!employee_id || !first_name || !last_name || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: employee_id, first_name, last_name, email, password' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if employee ID already exists
    const { data: existingEmp } = await supabaseAdmin
      .from('employees')
      .select('employee_id')
      .eq('employee_id', employee_id)
      .single();

    if (existingEmp) {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        employee_id
      }
    });

    if (authError) {
      return res.status(400).json({ error: `Failed to create auth user: ${authError.message}` });
    }

    if (!authData.user) {
      return res.status(500).json({ error: 'User creation failed: No user data returned' });
    }

    // Step 2: Create employee record
    const { error: employeeError } = await supabaseAdmin
      .from('employees')
      .insert({
        id: authData.user.id,
        employee_id,
        first_name,
        last_name,
        email,
        role,
        department: department || null,
        position: position || null,
        phone: phone || null,
        hire_date: new Date().toISOString().split('T')[0],
        status: 'active',
        auth_user_id: authData.user.id,
      });

    if (employeeError) {
      // Cleanup: Delete auth user if employee creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ 
        error: `Failed to create employee record: ${employeeError.message}` 
      });
    }

    // Success response
    res.status(201).json({
      success: true,
      message: 'Employee account created successfully',
      employee: {
        id: authData.user.id,
        employee_id,
        first_name,
        last_name,
        email,
        role
      }
    });

  } catch (error) {
    console.error('Employee creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update employee password endpoint
app.post('/api/employees/update-password', verifyAdmin, async (req, res) => {
  try {
    const { employee_id, new_password } = req.body;

    if (!employee_id || !new_password) {
      return res.status(400).json({ error: 'Missing employee_id or new_password' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Get employee's auth user ID
    const { data: employee, error: empError } = await supabaseAdmin
      .from('employees')
      .select('auth_user_id')
      .eq('employee_id', employee_id)
      .single();

    if (empError || !employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      employee.auth_user_id,
      { password: new_password }
    );

    if (updateError) {
      return res.status(500).json({ error: `Failed to update password: ${updateError.message}` });
    }

    res.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete employee account endpoint
app.delete('/api/employees/:employee_id', verifyAdmin, async (req, res) => {
  try {
    const { employee_id } = req.params;

    // Get employee's auth user ID
    const { data: employee, error: empError } = await supabaseAdmin
      .from('employees')
      .select('auth_user_id')
      .eq('employee_id', employee_id)
      .single();

    if (empError || !employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Delete auth user (this will cascade to employee record due to foreign key)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      employee.auth_user_id
    );

    if (deleteError) {
      return res.status(500).json({ error: `Failed to delete user: ${deleteError.message}` });
    }

    res.json({ success: true, message: 'Employee account deleted successfully' });

  } catch (error) {
    console.error('Employee deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 User Management API running on port ${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   POST /api/employees/create - Create employee account`);
  console.log(`   POST /api/employees/update-password - Update employee password`);
  console.log(`   DELETE /api/employees/:id - Delete employee account`);
  console.log(`   GET /health - Health check`);
});

module.exports = app;