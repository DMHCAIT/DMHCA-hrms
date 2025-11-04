# HR Software System - Production Ready

A comprehensive, enterprise-grade HR management system built with modern technologies and production-ready architecture.

## 🚀 Features

- **Employee Management**: Complete CRUD operations with role-based access control
- **Attendance Tracking**: Real-time biometric device integration with RS9W support
- **Leave Management**: Sophisticated leave application and approval workflow
- **Security**: Enterprise-grade security with JWT authentication, rate limiting, and audit logging
- **Monitoring**: Comprehensive health checks and performance monitoring
- **Scalability**: Containerized deployment with horizontal scaling support

## 🏗️ Architecture

### Production-Ready Stack
- **Frontend**: React 18, TypeScript, Material-UI, Vite (Optimized builds)
- **Backend**: Node.js, Express.js (Production middleware stack)
- **Database**: PostgreSQL with Row Level Security (RLS) policies
- **Authentication**: JWT-based with role-based access control
- **Deployment**: Docker containers with orchestration
- **Monitoring**: Health checks, logging, and performance metrics
- **Security**: Helmet.js, rate limiting, input validation, CORS

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose with production profiles
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Monitoring**: Health checks, performance metrics, and alerting
- **Security**: Vulnerability scanning, dependency audits

## 📁 Project Structure

```
hr-software/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page-level components
│   │   ├── services/           # API service layer
│   │   └── hooks/              # Custom React hooks
│   ├── Dockerfile              # Production container
│   └── nginx.conf              # Production web server config
├── backend/                     # Node.js backend API
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── middleware/        # Security and validation middleware
│   │   └── server.js          # Express server with production config
│   ├── tests/                 # Comprehensive test suite
│   ├── Dockerfile            # Production container
│   └── logs/                 # Application logs
├── database/                   # Database schema and migrations
│   ├── schema.sql            # Production database schema
│   └── security.sql         # Row Level Security policies
├── scripts/                   # Deployment and maintenance scripts
│   ├── deploy.sh            # Production deployment script
│   └── health-check.sh      # Health monitoring script
├── .github/workflows/        # CI/CD pipelines
└── docker-compose.yml       # Production orchestration
```

## 🔧 Production Deployment

### Prerequisites

- Docker Engine 20.x+
- Docker Compose 2.x+
- 4GB+ RAM, 2 CPU cores minimum
- SSL certificate (for HTTPS)

### Quick Start

1. **Clone and Configure**
```bash
git clone https://github.com/DMHCAIT/DMHCA-hrms.git
cd hr-software
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

2. **Configure Environment Variables**
```bash
# Backend Configuration
vi backend/.env
# Set production values for:
# - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
# - JWT_SECRET (256-bit minimum)
# - ALLOWED_ORIGINS (your domain)

# Frontend Configuration  
vi frontend/.env.local
# Set: VITE_API_PRODUCTION_URL=https://your-api-domain.com/api
```

3. **Deploy with Single Command**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh deploy
```

### Manual Deployment Steps

```bash
# 1. Build and start services
docker-compose up -d

# 2. Verify deployment
curl -f http://localhost:3001/api/health
curl -f http://localhost/health

# 3. Monitor logs
docker-compose logs -f backend
```

### Production Profiles

```bash
# Basic production deployment
docker-compose up -d

# With SSL reverse proxy
docker-compose --profile ssl up -d

# With Redis caching
docker-compose --profile cache up -d

# With monitoring stack
docker-compose --profile monitoring up -d
```

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication with configurable expiration
- Role-based access control (HR Admin, Manager, Employee)
- API key authentication for biometric devices
- Request signing verification for secure integrations

### Security Middleware
- **Helmet.js**: Security headers (CSP, HSTS, X-Frame-Options)
- **Rate Limiting**: Configurable per-endpoint limits
- **Input Validation**: Joi schemas with sanitization
- **CORS**: Strict origin validation
- **Audit Logging**: Complete audit trail for all operations

### Database Security
- Row Level Security (RLS) policies
- Encrypted connections (SSL/TLS)
- Prepared statements (SQL injection prevention)
- Regular security updates and patches

## 📊 Monitoring & Health Checks

### Application Monitoring
```bash
# Health check endpoint
curl http://localhost:3001/api/health

# Run comprehensive health checks
./scripts/health-check.sh

# View performance metrics
./scripts/health-check.sh metrics
```

### Logging
- Structured JSON logging with Winston
- Log levels: error, warn, info, debug
- Automatic log rotation and cleanup
- Centralized logging for production environments

### Alerts
- Health check failure notifications
- Performance threshold alerts
- Security incident notifications
- Integration with Slack, email, and monitoring services

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# Integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Load testing
k6 run tests/performance/load-test.js
```

### Test Coverage
- Unit tests for all business logic
- Integration tests for API endpoints
- Security tests for authentication flows
- Performance tests for load scenarios
- End-to-end tests for critical user journeys

## 📈 Performance Optimization

### Frontend Optimizations
- Code splitting and lazy loading
- Asset optimization and compression
- CDN integration for static assets
- Service worker for offline capability
- Bundle size monitoring and optimization

### Backend Optimizations
- Database query optimization with indexes
- Response caching strategies
- Connection pooling
- Compression middleware
- Memory usage monitoring

### Infrastructure Optimizations
- Docker multi-stage builds for smaller images
- Container resource limits and requests
- Load balancing for horizontal scaling
- Database read replicas for read-heavy workloads

## 🔄 CI/CD Pipeline

### Automated Workflows
- **Code Quality**: ESLint, Prettier, TypeScript checks
- **Testing**: Unit, integration, and security tests
- **Security**: Dependency audits and vulnerability scanning
- **Building**: Optimized Docker images with caching
- **Deployment**: Automated staging and production deployments
- **Monitoring**: Post-deployment health verification

### Environments
- **Development**: Feature branches with preview deployments
- **Staging**: Integration testing environment
- **Production**: High-availability production environment

## 🛠️ Database Schema

### Core Tables
- **employees**: Enhanced employee master data with audit trails
- **attendance**: Biometric attendance with calculated fields
- **departments**: Organizational structure management  
- **leave_requests**: Comprehensive leave management workflow
- **leave_balances**: Automated balance calculations
- **audit_logs**: Complete system audit trail
- **system_settings**: Configurable application parameters

### Advanced Features
- Generated columns for calculated fields
- Triggers for automatic data updates
- Views for complex reporting queries
- Functions for business logic encapsulation
- Comprehensive indexing for performance

## 🔌 API Documentation

### Authentication
```bash
# Get JWT token (if auth is enabled)
POST /api/auth/login
{
  "email": "user@company.com",
  "password": "secure_password"
}
```

### Employee Management
```bash
# Get employees with pagination and search
GET /api/employees?page=1&limit=20&search=john&department=IT

# Create employee with validation
POST /api/employees
{
  "employee_id": "EMP001",
  "name": "John Doe",
  "email": "john@company.com",
  "department": "IT",
  "position": "Developer"
}
```

### Biometric Integration
```bash
# Record attendance from RS9W device
POST /api/attendance/record
Authorization: Bearer <API_TOKEN>
{
  "employee_id": "EMP001",
  "timestamp": "2024-01-01T09:00:00Z",
  "device_id": "RS9W_001",
  "status": "present"
}
```

## 📋 Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] SSL certificates installed
- [ ] Security policies reviewed
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Load testing completed

### Post-Deployment
- [ ] Health checks passing
- [ ] Performance metrics baseline established
- [ ] Security scan completed
- [ ] Backup verification
- [ ] Documentation updated
- [ ] Team training completed

## 🚨 Troubleshooting

### Common Issues
```bash
# Backend connection issues
docker-compose logs backend
curl -f http://localhost:3001/api/health

# Database connectivity
docker-compose exec backend npm run db:test

# Frontend build issues
docker-compose logs frontend
```

### Performance Issues
```bash
# Check resource usage
docker stats

# Monitor database queries
docker-compose logs backend | grep "slow query"

# Check memory usage
free -h
```

## 📞 Support & Maintenance

### Production Support
- **24/7 Monitoring**: Automated health checks and alerting
- **Backup Strategy**: Daily automated backups with 365-day retention
- **Security Updates**: Automated security patch management
- **Performance Monitoring**: Real-time performance metrics and alerting

### Maintenance Windows
- **Weekly**: Dependency updates and security patches
- **Monthly**: Performance optimization and cleanup
- **Quarterly**: Major version updates and feature releases

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

**Built with ❤️ by DMHCA IT Team**

For production support: [support@dmhca.com](mailto:support@dmhca.com)  
Documentation: [https://dmhcahrms.xyz/docs](https://dmhcahrms.xyz/docs)
