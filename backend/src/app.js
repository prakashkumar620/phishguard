const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const env = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Not allowed by Access-Control-Allow-Origin'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsers with safe payload limits to prevent DoS
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// HTTP request logging in development
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

const { getConnectionStatus } = require('./config/db');

/**
 * System Health Check Endpoint
 * Returns backend service status, database connectivity, and runtime metrics
 */
app.get('/api/health', (req, res) => {
  const isHealthy = true;
  const isDbConnected = getConnectionStatus();

  res.status(200).json({
    success: true,
    status: isDbConnected ? 'UP' : 'HEALTHY_DEGRADED_DB',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      connected: isDbConnected,
      host: mongoose.connection.host || 'Atlas connection pending/mock',
      name: mongoose.connection.name || 'phishguard',
      provider: 'MongoDB Atlas'
    },
    system: {
      nodeVersion: process.version,
      environment: env.NODE_ENV,
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
    }
  });
});

// API Routes
const authRoutes = require('./routes/authRoutes');
const scanRoutes = require('./routes/scanRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);

const path = require('path');
const fs = require('fs');

// Serve root JSON for API/test callers, or frontend SPA for browsers
app.get('/', (req, res, next) => {
  if (process.env.NODE_ENV === 'test' || req.headers['accept']?.includes('application/json')) {
    return res.json({
      message: 'PhishGuard Phishing URL Detection System API',
      version: '1.0.0',
      documentation: '/api/docs',
      healthCheck: '/api/health'
    });
  }
  next();
});

// Serve production frontend assets if built
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Fallback for API mode when frontend is not built
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.json({
      message: 'PhishGuard Phishing URL Detection System API',
      version: '1.0.0',
      documentation: '/api/docs',
      healthCheck: '/api/health'
    });
  });
}

// Centralized error handling
app.use((req, res, next) => {
  // If no route handled the request yet, proceed to notFoundHandler
  notFoundHandler(req, res, next);
});

app.use(errorHandler);

module.exports = app;
