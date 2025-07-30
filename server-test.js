const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running without database',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test authentication endpoint
app.post('/api/v1/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // Mock response
  res.status(201).json({
    success: true,
    message: 'User registered successfully (test mode)',
    data: {
      user: {
        id: 'test-user-id',
        name,
        email,
        role
      },
      token: 'test-jwt-token-12345'
    }
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password required'
    });
  }
  
  // Mock response
  res.status(200).json({
    success: true,
    message: 'Login successful (test mode)',
    data: {
      token: 'test-jwt-token-12345',
      user: {
        id: 'test-user-id',
        email,
        role: 'manager'
      }
    }
  });
});

// Test CRUD endpoints
app.post('/api/v1/modules', (req, res) => {
  const { name, code, half, credits, description } = req.body;
  
  res.status(201).json({
    success: true,
    message: 'Module created successfully (test mode)',
    data: {
      module: {
        id: 'test-module-id',
        name,
        code,
        half,
        credits,
        description
      }
    }
  });
});

app.post('/api/v1/cohorts', (req, res) => {
  const { name } = req.body;
  
  res.status(201).json({
    success: true,
    message: 'Cohort created successfully (test mode)',
    data: {
      cohort: {
        id: 'test-cohort-id',
        name
      }
    }
  });
});

app.post('/api/v1/classes', (req, res) => {
  const { name, startDate, graduationDate } = req.body;
  
  res.status(201).json({
    success: true,
    message: 'Class created successfully (test mode)',
    data: {
      class: {
        id: 'test-class-id',
        name,
        startDate,
        graduationDate
      }
    }
  });
});

app.post('/api/v1/allocations', (req, res) => {
  const { moduleId, classId, cohortId, facilitatorId, trimester, modeId, year } = req.body;
  
  res.status(201).json({
    success: true,
    message: 'Allocation created successfully (test mode)',
    data: {
      allocation: {
        id: 'test-allocation-id',
        moduleId,
        classId,
        cohortId,
        facilitatorId,
        trimester,
        modeId,
        year
      }
    }
  });
});

app.get('/api/v1/allocations', (req, res) => {
  const { cohortId, trimester, year } = req.query;
  
  res.status(200).json({
    success: true,
    message: 'Allocations retrieved successfully (test mode)',
    data: {
      allocations: [
        {
          id: 'test-allocation-id',
          moduleId: 'test-module-id',
          classId: 'test-class-id',
          cohortId: cohortId || 'test-cohort-id',
          facilitatorId: 'test-facilitator-id',
          trimester: trimester || 1,
          modeId: 'test-mode-id',
          year: year || 2025
        }
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        pages: 1
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /health',
      'POST /api/v1/auth/register',
      'POST /api/v1/auth/login',
      'POST /api/v1/modules',
      'POST /api/v1/cohorts',
      'POST /api/v1/classes',
      'POST /api/v1/allocations',
      'GET /api/v1/allocations'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📚 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoints: http://localhost:${PORT}/api/v1/`);
  console.log(`⚠️  This is a test server without database connection`);
}); 