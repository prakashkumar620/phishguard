const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

let server;

const startServer = async () => {
  try {
    // 1. Establish database connection (Atlas or fallback)
    await connectDB();

    // 2. Start HTTP listener
    server = app.listen(env.PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 PhishGuard Backend Server running on port ${env.PORT}`);
      console.log(`📡 Health Check URL: http://localhost:${env.PORT}/api/health`);
      console.log(`🌐 Allowed Frontend Origin: ${env.FRONTEND_URL}`);
      console.log(`🔒 Mode: ${env.NODE_ENV}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful Shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Commencing graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

// Run server
startServer();
