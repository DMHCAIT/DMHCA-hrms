import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://ocvtacsuwkwzbpwnmlsd.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdnRhY3N1d2t3emJwd25tbHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDc3MjYsImV4cCI6MjA3Njg4MzcyNn0.JJTuluIEZfVhFTonnaXCkiuzoD5AHZs0S_MjqdEn1DA';

const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/employees - Get all employees
router.get('/', async (req, res) => {
  try {
    const { limit = 100, offset = 0, search } = req.query;

    let query = supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,employee_code.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
      count,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count
      }
    });

  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
});

// GET /api/employees/:id - Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message
    });
  }
});

// POST /api/employees - Create new employee
router.post('/', async (req, res) => {
  try {
    const employeeData = req.body;

    // Validate required fields
    const requiredFields = ['name', 'email', 'employee_code'];
    const missingFields = requiredFields.filter(field => !employeeData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check if employee code already exists
    const { data: existingEmployee } = await supabase
      .from('employees')
      .select('employee_code')
      .eq('employee_code', employeeData.employee_code)
      .single();

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: 'Employee code already exists'
      });
    }

    // Create employee
    const { data, error } = await supabase
      .from('employees')
      .insert([{
        ...employeeData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data
    });

  } catch (error) {
    console.error('❌ Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message
    });
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove id from update data if present
    delete updateData.id;
    delete updateData.created_at;

    const { data, error } = await supabase
      .from('employees')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data
    });

  } catch (error) {
    console.error('❌ Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    });
  }
});

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      error: error.message
    });
  }
});

// POST /api/employees/sync - Sync employees from external source
router.post('/sync', async (req, res) => {
  try {
    const { employees } = req.body;

    if (!Array.isArray(employees)) {
      return res.status(400).json({
        success: false,
        message: 'Employees must be an array'
      });
    }

    const results = {
      created: 0,
      updated: 0,
      errors: []
    };

    for (const emp of employees) {
      try {
        // Check if employee exists
        const { data: existingEmp } = await supabase
          .from('employees')
          .select('id')
          .eq('employee_code', emp.employee_code)
          .single();

        if (existingEmp) {
          // Update existing employee
          await supabase
            .from('employees')
            .update({
              ...emp,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingEmp.id);
          results.updated++;
        } else {
          // Create new employee
          await supabase
            .from('employees')
            .insert([{
              ...emp,
              created_at: new Date().toISOString()
            }]);
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          employee: emp.employee_code || emp.name,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Employee sync completed',
      results
    });

  } catch (error) {
    console.error('❌ Error syncing employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync employees',
      error: error.message
    });
  }
});

export default router;