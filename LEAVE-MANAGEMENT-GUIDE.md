# Enhanced Leave Management System - Setup Guide

## 🎯 Overview

The enhanced leave management system provides comprehensive leave tracking with detailed policy information, balance tracking, carry-forward management, and intelligent leave application validation.

## ✨ Key Features

### 📊 Employee Leave Dashboard
- **Real-time Leave Balances**: Shows available, used, and pending leave days by type
- **Usage Progress Bars**: Visual representation of leave utilization
- **Carry Forward Information**: Displays carried forward days and expiry dates
- **Leave Statistics**: Annual usage trends and analytics
- **Policy Information**: Detailed policy rules and limitations

### 📝 Intelligent Leave Application
- **Smart Validation**: Checks policy compliance before submission
- **Working Days Calculation**: Excludes weekends and holidays automatically
- **Notice Period Verification**: Validates minimum notice requirements
- **Balance Verification**: Ensures sufficient leave balance
- **Emergency Leave Support**: Bypasses notice period for emergencies

### 🔄 Automatic Leave Processing
- **Balance Updates**: Real-time balance adjustments on approval/rejection
- **Carry Forward Management**: Year-end carry forward calculations
- **Holiday Integration**: Company and public holiday management
- **Policy Enforcement**: Automatic policy rule validation

## 🗄️ Database Schema

### Core Tables Created:
1. **`leave_policies`** - Leave type definitions and rules
2. **`employee_leave_balances`** - Individual employee balances by year
3. **`leave_requests`** - Leave applications and approvals
4. **`leave_calendar`** - Company holidays and events

### Automated Functions:
- `initialize_employee_leave_balances()` - Sets up balances for new employees
- `calculate_carry_forward()` - Handles year-end carry forwards
- Balance update triggers for request status changes

## 🚀 Setup Instructions

### 1. Database Setup
```sql
-- Run the database migration
-- File: database-leave-management.sql
```

### 2. Default Leave Policies Included:
- **Annual Leave**: 21 days, carry forward 5 days
- **Sick Leave**: 12 days, no carry forward
- **Personal Leave**: 5 days, no carry forward
- **Maternity Leave**: 90 days, 30 days notice
- **Paternity Leave**: 7 days, 30 days notice
- **Emergency Leave**: 3 days, no notice required
- **Study Leave**: 10 days, 14 days notice
- **Compassionate Leave**: 5 days, no notice required

### 3. Sample Holidays Added:
- New Year's Day
- Republic Day (India)
- Independence Day (India)
- Gandhi Jayanti
- Christmas Day

### 4. Employee Access Routes:
- `/leave` - Complete leave management interface
- Floating action button for quick leave application
- Header navigation to "My Leaves"

## 📱 User Experience

### Employee View Features:

#### 🏠 Dashboard Overview
- Leave statistics cards showing days taken, available, and usage trends
- Upcoming expiry warnings for carry-forward days
- Quick access to leave application

#### 📋 Leave Balance Details
For each leave type:
- **Total Allocation**: Annual entitlement
- **Current Usage**: Days used this year
- **Available Balance**: Remaining days
- **Pending Requests**: Days in pending status
- **Carry Forward**: Previous year carry-over with expiry dates
- **Policy Details**: Rules, limits, and requirements
- **Usage Progress**: Visual progress bar with color coding

#### ✍️ Smart Leave Application
- **Leave Type Selection**: With policy descriptions
- **Date Selection**: Calendar picker with validation
- **Working Days Calculation**: Automatic exclusion of weekends/holidays
- **Real-time Validation**: 
  - Sufficient balance check
  - Policy compliance verification
  - Notice period validation
  - Maximum consecutive days check
- **Emergency Override**: Bypass notice requirements
- **Supporting Documents**: File attachment support

#### 📈 Leave Analytics
- **Usage Trends**: Monthly usage patterns
- **Most Used Leave Type**: Statistical insights
- **Expiry Warnings**: Proactive notifications for carry-forward days
- **Request History**: Complete application tracking

## 🔧 Policy Configuration

### Leave Policy Parameters:
- `annual_allocation` - Total days per year
- `max_consecutive_days` - Maximum continuous leave
- `min_notice_days` - Required advance notice
- `carry_forward_limit` - Maximum carry forward days
- `carry_forward_expiry_months` - When carry forward expires
- `description` - Policy explanation
- `color` - UI color coding

### Customization Examples:
```sql
-- Add new leave type
INSERT INTO leave_policies (
  leave_type, annual_allocation, max_consecutive_days, 
  min_notice_days, carry_forward_limit, description
) VALUES (
  'Sabbatical Leave', 30, 30, 90, 0, 
  'Extended leave for personal development'
);

-- Update existing policy
UPDATE leave_policies 
SET annual_allocation = 25, carry_forward_limit = 7
WHERE leave_type = 'Annual Leave';
```

## 🛡️ Security Features

### Row Level Security (RLS):
- Employees can only view/modify their own leave data
- Admins have full access to all employee data
- Public holiday calendar visible to all users
- Policy information accessible to all employees

### Data Validation:
- Database constraints on valid status values
- Foreign key relationships ensure data integrity
- Automatic timestamp tracking for audit trails
- Balance calculations prevent negative values

## 📊 Analytics & Reporting

### Available Metrics:
- Individual employee usage patterns
- Department-wise leave utilization
- Leave type popularity analysis
- Seasonal usage trends
- Carry forward utilization
- Policy compliance rates

### Future Enhancements:
- Advanced reporting dashboards
- Predictive leave analytics
- Team leave planning tools
- Integration with payroll systems
- Mobile app notifications
- Calendar integration (Google/Outlook)

## 🎨 UI/UX Features

### Responsive Design:
- Mobile-friendly interface
- Touch-optimized controls
- Progressive loading
- Offline capability preparation

### Visual Indicators:
- Color-coded leave types
- Progress bars for usage tracking
- Status icons for requests
- Warning alerts for policy violations
- Success confirmations

### Accessibility:
- Screen reader support
- Keyboard navigation
- High contrast mode support
- Clear visual hierarchy
- Intuitive iconography

## 📋 Admin Management

### Future Admin Features:
- Bulk leave policy updates
- Employee balance adjustments
- Custom holiday calendars
- Leave approval workflows
- Detailed analytics dashboards
- Export capabilities

Your enhanced leave management system is now ready to provide employees with comprehensive, informative leave management! 🎉

## 🔄 Next Steps

1. **Test Leave Applications**: Create test leave requests
2. **Verify Balance Updates**: Confirm automatic balance adjustments
3. **Check Carry Forward**: Test year-end carry forward calculations
4. **Validate Policies**: Ensure policy rules are enforced
5. **Review Analytics**: Check leave usage statistics
6. **Admin Integration**: Set up approval workflows

The system provides enterprise-grade leave management with intelligent validation and comprehensive employee self-service capabilities.