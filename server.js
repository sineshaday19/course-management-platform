const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./config/database');

const authRoutes = require('./routes/auth');
const managerRoutes = require('./routes/managers');
const moduleRoutes = require('./routes/modules');
const classRoutes = require('./routes/classes');
const studentRoutes = require('./routes/students');
const facilitatorRoutes = require('./routes/facilitators');
const allocationRoutes = require('./routes/allocations');
const activityTrackerRoutes = require('./routes/activityTracker');
const cohortRoutes = require('./routes/cohorts');
const modeRoutes = require('./routes/modes');
const notificationRoutes = require('./routes/notifications');

const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const { redisClient } = require('./config/redis');
const { startNotificationWorker } = require('./workers/notificationWorker');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static('uploads'));

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Course Management Platform API',
      version: '1.0.0',
      description: 'A comprehensive backend system for Course Management Platform',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/managers', authenticateToken, managerRoutes);
app.use('/api/v1/modules', authenticateToken, moduleRoutes);
app.use('/api/v1/classes', authenticateToken, classRoutes);
app.use('/api/v1/students', authenticateToken, studentRoutes);
app.use('/api/v1/facilitators', authenticateToken, facilitatorRoutes);
app.use('/api/v1/allocations', authenticateToken, allocationRoutes);
app.use('/api/v1/activity-tracker', authenticateToken, activityTrackerRoutes);
app.use('/api/v1/cohorts', authenticateToken, cohortRoutes);
app.use('/api/v1/modes', authenticateToken, modeRoutes);
app.use('/api/v1/notifications', authenticateToken, notificationRoutes);

app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized.');
    }

    // Start notification worker (now uses database instead of Redis)
    startNotificationWorker();
    console.log('✅ Notification worker started.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌐 Network Access: http://192.168.1.70:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  try {
    await redisClient.quit();
  } catch (error) {
    console.log('Redis already closed');
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await sequelize.close();
  try {
    await redisClient.quit();
  } catch (error) {
    console.log('Redis already closed');
  }
  process.exit(0);
});

startServer(); 