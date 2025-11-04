import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/auth.log' })
  ]
});

// JWT token verification middleware
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Invalid token attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        token: token.substring(0, 10) + '...'
      });
      
      return res.status(403).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
    
    req.user = user;
    next();
  });
};

// API key verification for biometric device
export const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      code: 'NO_API_KEY'
    });
  }
  
  const expectedApiKey = process.env.ATTENDANCE_API_TOKEN;
  
  if (!expectedApiKey) {
    logger.error('ATTENDANCE_API_TOKEN not configured');
    return res.status(500).json({
      error: 'Server configuration error',
      code: 'CONFIG_ERROR'
    });
  }
  
  // Constant-time comparison to prevent timing attacks
  const apiKeyBuffer = Buffer.from(apiKey);
  const expectedBuffer = Buffer.from(expectedApiKey);
  
  if (apiKeyBuffer.length !== expectedBuffer.length) {
    logger.warn('Invalid API key attempt - length mismatch', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(403).json({
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }
  
  const isValid = crypto.timingSafeEqual(apiKeyBuffer, expectedBuffer);
  
  if (!isValid) {
    logger.warn('Invalid API key attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      providedKey: apiKey.substring(0, 10) + '...'
    });
    
    return res.status(403).json({
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }
  
  logger.info('Valid API key used', {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next();
};

// Role-based access control
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    const userRole = req.user.role;
    
    if (!roles.includes(userRole)) {
      logger.warn('Insufficient permissions', {
        userId: req.user.id,
        userRole,
        requiredRoles: roles,
        endpoint: req.originalUrl
      });
      
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: userRole
      });
    }
    
    next();
  };
};

// Request signing verification (for secure integrations)
export const verifySignature = (req, res, next) => {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  
  if (!signature || !timestamp) {
    return res.status(401).json({
      error: 'Request signature required',
      code: 'NO_SIGNATURE'
    });
  }
  
  // Check timestamp to prevent replay attacks (5 minute window)
  const requestTime = parseInt(timestamp);
  const currentTime = Date.now();
  const timeDiff = Math.abs(currentTime - requestTime);
  
  if (timeDiff > 300000) { // 5 minutes
    return res.status(401).json({
      error: 'Request timestamp expired',
      code: 'EXPIRED_REQUEST'
    });
  }
  
  // Create expected signature
  const payload = timestamp + JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', process.env.API_SECRET)
    .update(payload)
    .digest('hex');
  
  const providedSignature = signature.replace('sha256=', '');
  
  if (!crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(providedSignature)
  )) {
    logger.warn('Invalid request signature', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp
    });
    
    return res.status(403).json({
      error: 'Invalid request signature',
      code: 'INVALID_SIGNATURE'
    });
  }
  
  next();
};

// IP whitelist middleware
export const requireWhitelistedIP = (req, res, next) => {
  const allowedIPs = process.env.ALLOWED_IPS?.split(',') || [];
  
  if (allowedIPs.length === 0) {
    return next(); // No IP restriction if not configured
  }
  
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (!allowedIPs.includes(clientIP)) {
    logger.warn('Blocked IP attempt', {
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    
    return res.status(403).json({
      error: 'IP address not allowed',
      code: 'IP_BLOCKED'
    });
  }
  
  next();
};

// Generate JWT token
export const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Generate API key
export const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

export default {
  verifyToken,
  verifyApiKey,
  requireRole,
  verifySignature,
  requireWhitelistedIP,
  generateToken,
  generateApiKey
};