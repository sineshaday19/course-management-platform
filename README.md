# Course Management Platform

A comprehensive backend system for academic institutions supporting faculty operations, student progress monitoring, and academic coordination. Built with Node.js, Express, MySQL, and Sequelize.

**DEMO LINK**: https://youtu.be/lLWI55m_f2s

- **GitHub Pages Hosting** - [Live Demo](https://sineshaday19.github.io/student-reflection-page)

## Project Overview

This platform consists of three core modules:

1. **Course Allocation System** - Manage facilitator assignments to courses
2. **Facilitator Activity Tracker (FAT)** - Track weekly activities and compliance
3. **Student Reflection Page** - i18n/l10n support for multilingual experiences

## Key Features

### Authentication & Authorization
- **JWT Stateless Authentication** - Secure token-based system
- **Role-based Access Control** - Manager, Facilitator, and Student roles
- **Token Lifetime Management** - 3-hour access tokens with 7-day refresh tokens
- **Automatic Token Refresh** - Seamless user experience
- **Password Security** - bcrypt hashing with salt

### Course Allocation System
- **CRUD Operations** - Complete allocation management
- **Cohort Filtering** - Filter by cohort, trimester, year, facilitator, mode
- **Multi-criteria Search** - Advanced filtering capabilities
- **Access Control** - Managers can create/update, facilitators view only

### Facilitator Activity Tracker (FAT)
- **Weekly Activity Logs** - Track attendance, grading, moderation
- **Status Management** - Done, Pending, Not Started statuses
- **Compliance Monitoring** - Automated deadline tracking
- **Role-based Permissions** - Facilitators manage own logs, managers view all

### Student Reflection with i18n/l10n
- **Multi-language Support** - Dynamic language switching
- **Translation System** - JSON-based translations
- **Language Detection** - Automatic browser language detection
- **GitHub Pages Hosting** - [Live Demo](https://sineshaday19.github.io/student-reflection-page)

### Notification System
- **Database-based Notifications** - Stored in MySQL with delivery tracking
- **Background Workers** - Automated notification processing
- **Multiple Types** - Reminders, alerts, submission notifications
- **Overdue Tracking** - Automatic detection of missed deadlines

### Modern Frontend Interface
- **Responsive Design** - Works on all devices
- **Tailwind CSS** - Modern, utility-first styling
- **Real-time Updates** - Dynamic content loading
- **Interactive UI** - Intuitive forms and feedback

## Technical Architecture

### Backend Stack
- **Node.js** with Express.js framework
- **MySQL** relational database with Sequelize ORM
- **JWT** for stateless authentication
- **Swagger** for API documentation
- **Jest** for unit testing

### Frontend Stack
- **Vanilla JavaScript** with ES6+ features
- **Tailwind CSS** for styling
- **Font Awesome** for icons
- **Fetch API** for HTTP requests

### Database Schema
```
- managers (id, name, email, password, role)
- facilitators (id, name, email, password, role, qualification, location)
- students (id, name, email, password, role)
- modules (id, name, code, half, credits, description)
- cohorts (id, name)
- classes (id, name, startDate, graduationDate)
- modes (id, name)
- course_allocations (id, moduleId, classId, cohortId, facilitatorId, trimester, modeId, year, isActive)
- activity_trackers (id, allocationId, weekNumber, attendance, formativeOneGrading, formativeTwoGrading, summativeGrading, courseModeration, intranetSync, gradeBookStatus, notes)
- notifications (id, recipientId, recipientType, type, title, message, relatedEntityId, relatedEntityType, isRead, isDelivered, scheduledFor, metadata)
```

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd summative
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

4. **Set up the database**
   ```bash
   node databaseSetup.js
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Serve the frontend**
   ```bash
   # Using Python (if available)
   cd frontend
   python -m http.server 8000
   
   # Or using Node.js http-server
   npx http-server frontend -p 8000
   ```

7. **Access the application**
   - Backend API: http://localhost:3000
   - Swagger Documentation: http://localhost:3000/api-docs
   - Frontend: http://localhost:8000 (served via local server)

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile

### Course Allocations
- `GET /api/v1/allocations` - List allocations (with filtering)
- `POST /api/v1/allocations` - Create new allocation
- `PUT /api/v1/allocations/:id` - Update allocation
- `DELETE /api/v1/allocations/:id` - Delete allocation

### Activity Tracking
- `GET /api/v1/activity-tracker` - List activity logs
- `POST /api/v1/activity-tracker` - Create activity log
- `PUT /api/v1/activity-tracker/:id` - Update activity log
- `GET /api/v1/activity-tracker/:id` - Get specific log

### Notifications
- `GET /api/v1/notifications` - List user notifications
- `GET /api/v1/notifications/unread-count` - Get unread count
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read

### Other Resources
- `GET /api/v1/modules` - List modules
- `GET /api/v1/cohorts` - List cohorts
- `GET /api/v1/classes` - List classes
- `GET /api/v1/facilitators` - List facilitators
- `GET /api/v1/managers` - List managers

## JWT Authentication

### Token Management
- **Access Token**: 3 hours lifetime (configurable)
- **Refresh Token**: 7 days lifetime
- **Stateless Design**: No backend token storage
- **Automatic Refresh**: Seamless token renewal

### Security Features
- **Token Expiration**: Automatic invalidation
- **Role-based Access**: Different permissions per role
- **Secure Storage**: Frontend localStorage
- **Input Validation**: Comprehensive data validation

### Usage Example
```javascript
// Login request
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, role })
});

// Authenticated request
const response = await fetch('/api/v1/allocations', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Testing

### Unit Tests
```bash
npm test
```

### Manual Testing
- **Swagger UI**: Interactive API testing at `/api-docs`
- **Frontend Testing**: Browser-based UI testing
- **Postman Collection**: Available for API testing

## Configuration

### Environment Variables
```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/course_management_db
DB_HOST=localhost
DB_PORT=3306
DB_NAME=course_management_db
DB_USER=root
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=3h
MANAGER_INVITATION_CODE=ADMIN2024

# Server
PORT=3000
NODE_ENV=development

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Database Configuration
- **Connection Pooling**: Optimized for production load
- **Migration Support**: Database schema versioning
- **Backup Strategy**: Regular database backups recommended

## Performance Features

### Backend Optimizations
- **Connection Pooling**: Efficient database connections
- **Pagination**: Large dataset handling
- **Input Validation**: Prevents invalid data processing
- **Error Handling**: Comprehensive error management

### Frontend Optimizations
- **Lazy Loading**: Load data on demand
- **Debounced Search**: Efficient filtering
- **Responsive Design**: Optimized for all devices
- **Error Recovery**: Graceful error handling

## Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure, stateless authentication
- **Role-based Access**: Granular permission control
- **Password Hashing**: bcrypt with salt
- **Input Sanitization**: Prevents injection attacks

### Data Protection
- **Validation**: Comprehensive input validation
- **Error Handling**: Secure error messages
- **CORS Configuration**: Cross-origin request handling
- **Rate Limiting**: Prevents abuse

## User Experience

### Frontend Features
- **Modern UI**: Clean, professional design
- **Responsive Layout**: Works on all screen sizes
- **Real-time Updates**: Dynamic content loading
- **Loading States**: User feedback during operations
- **Error Messages**: Clear, helpful error feedback

### Cohort Filtering Demo
- **Interactive Filtering**: Real-time cohort-based filtering
- **Multi-criteria Search**: Filter by cohort, trimester, year
- **Visual Feedback**: Clear display of filtered results
- **Create Functionality**: Add new allocations through UI

## Documentation

### API Documentation
- **Swagger UI**: Interactive API documentation at `/api-docs`
- **Endpoint Descriptions**: Detailed parameter documentation
- **Example Requests**: Ready-to-use API examples
- **Response Schemas**: Complete response documentation

### Code Documentation
- **JSDoc Comments**: Function and class documentation
- **README Files**: Setup and usage instructions
- **Inline Comments**: Code explanation and context

## Production Deployment

### Prerequisites
1. **MySQL Database**: Set up and configure MySQL server
2. **Node.js**: Version 14 or higher
3. **Environment Variables**: Configure production settings

### Deployment Steps
1. **Environment Setup**:
   ```bash
   cp env.example .env
   # Edit .env with production values
   ```

2. **Database Setup**:
   ```bash
   node databaseSetup.js
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start Server**:
   ```bash
   npm start
   ```

5. **Test Frontend**:
   - Access http://localhost:8000 in browser
   - Test cohort filtering functionality

## Success Metrics

The Course Management Platform successfully demonstrates:

1. **Cohort Filtering**: Core requirement fully implemented
2. **Scalability**: Handles multiple users and large datasets
3. **Security**: Robust authentication and authorization
4. **User Experience**: Intuitive, responsive interface
5. **Maintainability**: Well-documented, modular codebase

## Production Readiness Checklist

- [x] **Cohort filtering functionality** - Fully implemented and tested
- [x] **Database schema** - Complete with proper relationships
- [x] **API endpoints** - All CRUD operations implemented
- [x] **Authentication system** - JWT-based with role management
- [x] **Frontend interface** - Modern, responsive UI
- [x] **Error handling** - Comprehensive error management
- [x] **Input validation** - Secure data processing
- [x] **Documentation** - Complete API and setup docs
- [x] **Testing** - Unit tests and manual verification


