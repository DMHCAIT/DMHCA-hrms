import Joi from 'joi';
import { body, param, query, validationResult } from 'express-validator';

// Joi schemas for validation
export const employeeSchema = Joi.object({
  employee_id: Joi.string().alphanum().min(3).max(20).required(),
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[+]?[1-9][\d\s-()]{7,15}$/).required(),
  department: Joi.string().min(2).max(50).required(),
  position: Joi.string().min(2).max(100).required(),
  hire_date: Joi.date().iso().required(),
  salary: Joi.number().positive().optional(),
  status: Joi.string().valid('active', 'inactive', 'terminated').default('active')
});

export const attendanceSchema = Joi.object({
  employee_id: Joi.string().alphanum().min(3).max(20).required(),
  date: Joi.date().iso().required(),
  check_in: Joi.date().iso().optional(),
  check_out: Joi.date().iso().optional(),
  status: Joi.string().valid('present', 'absent', 'late', 'half_day').required(),
  notes: Joi.string().max(500).optional()
});

// Express-validator middleware
export const validateEmployee = [
  body('employee_id')
    .isAlphanumeric()
    .isLength({ min: 3, max: 20 })
    .withMessage('Employee ID must be 3-20 alphanumeric characters'),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('phone')
    .matches(/^[+]?[1-9][\d\s-()]{7,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('department')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Department must be 2-50 characters'),
  
  body('position')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Position must be 2-100 characters'),
  
  body('hire_date')
    .isISO8601()
    .withMessage('Hire date must be a valid ISO date'),
  
  body('salary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Salary must be a positive number'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'terminated'])
    .withMessage('Status must be active, inactive, or terminated')
];

export const validateAttendance = [
  body('employee_id')
    .isAlphanumeric()
    .isLength({ min: 3, max: 20 })
    .withMessage('Employee ID must be 3-20 alphanumeric characters'),
  
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  
  body('check_in')
    .optional()
    .isISO8601()
    .withMessage('Check-in must be a valid ISO datetime'),
  
  body('check_out')
    .optional()
    .isISO8601()
    .withMessage('Check-out must be a valid ISO datetime'),
  
  body('status')
    .isIn(['present', 'absent', 'late', 'half_day'])
    .withMessage('Status must be present, absent, late, or half_day'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
];

export const validateEmployeeId = [
  param('id')
    .isUUID()
    .withMessage('Employee ID must be a valid UUID')
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be 1-100 characters')
];

export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date')
];

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: formattedErrors
    });
  }
  
  next();
};

// Joi validation middleware
export const validateWithJoi = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const formattedErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: formattedErrors
      });
    }
    
    req.body = value; // Use sanitized data
    next();
  };
};

// Sanitization helpers
export const sanitizeInput = {
  string: (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, ''); // Basic XSS prevention
  },
  
  email: (email) => {
    if (typeof email !== 'string') return email;
    return email.toLowerCase().trim();
  },
  
  phone: (phone) => {
    if (typeof phone !== 'string') return phone;
    return phone.replace(/[^\d+\s-()]/g, '');
  }
};

export default {
  validateEmployee,
  validateAttendance,
  validateEmployeeId,
  validatePagination,
  validateDateRange,
  handleValidationErrors,
  validateWithJoi,
  employeeSchema,
  attendanceSchema,
  sanitizeInput
};