const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  USE_MEMORY_DB_FALLBACK: process.env.USE_MEMORY_DB_FALLBACK === 'true',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_fallback_key_at_least_32_characters_long',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  GOOGLE_SAFE_BROWSING_API_KEY: process.env.GOOGLE_SAFE_BROWSING_API_KEY || '',
  PYTHON_PATH: process.env.PYTHON_PATH || 'python',
  ML_MODEL_PATH: process.env.ML_MODEL_PATH || path.resolve(__dirname, '../../../ml/models/phishing_model.joblib')
};

// Check critical configuration in production
if (env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️ WARNING: JWT_SECRET should be a strong 32+ character key in production.');
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('FATAL: MONGODB_URI environment variable is required in production.');
  }
}

module.exports = env;
