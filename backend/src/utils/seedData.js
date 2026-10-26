const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Scan = require('../models/Scan');
const { connectDB, disconnectDB } = require('../config/db');

const seedData = async () => {
  try {
    console.log('Seeding initial synthetic security data for development and demonstration...');
    const conn = await connectDB();
    if (!conn) {
      console.log('Seed script requires an active MongoDB Atlas connection.');
      console.log('Please configure MONGODB_URI in backend/.env with your MongoDB Atlas cluster URI and run again.');
      process.exit(0);
    }

    // Clear existing development collections if needed
    await User.deleteMany({ email: /@test\.internal$/ });
    await Scan.deleteMany({ submittedUrl: /synthetic-test/ });

    // Seed Admin User
    const adminSalt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('AdminSecurePass2026!', adminSalt);
    const admin = await User.create({
      name: 'Cyber Defense Lead',
      email: 'admin@test.internal',
      passwordHash: adminPasswordHash,
      role: 'admin'
    });

    // Seed Regular Analyst
    const userSalt = await bcrypt.genSalt(10);
    const userPasswordHash = await bcrypt.hash('AnalystPass2026!', userSalt);
    const user = await User.create({
      name: 'Security Analyst 1',
      email: 'analyst@test.internal',
      passwordHash: userPasswordHash,
      role: 'user'
    });

    // Seed Synthetic Scans
    const sampleScans = [
      {
        userId: user._id,
        submittedUrl: 'http://paypal.verify-account-security-alert.xyz/synthetic-test/login.php',
        normalizedUrl: 'http://paypal.verify-account-security-alert.xyz/synthetic-test/login.php',
        hostname: 'paypal.verify-account-security-alert.xyz',
        riskCategory: 'high',
        riskScore: 88,
        indicators: [
          { id: 'BRAND_IMPERSONATION', name: 'Possible Brand Spoofing (paypal)', severity: 'critical', weight: 30, description: 'Brand detected on unverified domain.' },
          { id: 'HIGH_RISK_TLD', name: 'Abused Top-Level Domain (.xyz)', severity: 'warning', weight: 15, description: 'High statistical association with phishing.' },
          { id: 'SUSPICIOUS_KEYWORDS', name: 'Credential / Banking Keywords Detected', severity: 'warning', weight: 20, description: 'Contains verify, account, security, login.' },
          { id: 'UNENCRYPTED_HTTP', name: 'Plain Unencrypted HTTP Scheme', severity: 'info', weight: 10, description: 'Unencrypted communication.' }
        ],
        detectionMethods: ['rule-based', 'machine-learning'],
        modelPrediction: 'phishing',
        modelConfidence: 0.985,
        threatIntelStatus: 'unmatched',
        explanation: 'High risk detected (Score: 88/100). The URL exhibits multiple critical phishing indicators.',
        scannedAt: new Date(Date.now() - 2 * 3600 * 1000)
      },
      {
        userId: user._id,
        submittedUrl: 'https://www.wikipedia.org/wiki/Transport_Layer_Security',
        normalizedUrl: 'https://www.wikipedia.org/wiki/Transport_Layer_Security',
        hostname: 'www.wikipedia.org',
        riskCategory: 'low',
        riskScore: 0,
        indicators: [],
        detectionMethods: ['rule-based', 'machine-learning'],
        modelPrediction: 'legitimate',
        modelConfidence: 0.999,
        threatIntelStatus: 'clean',
        explanation: 'Low risk estimated (Score: 0/100). No heuristic anomalies detected.',
        scannedAt: new Date(Date.now() - 5 * 3600 * 1000)
      },
      {
        userId: user._id,
        submittedUrl: 'https://bit.ly/3x8AbC',
        normalizedUrl: 'https://bit.ly/3x8AbC',
        hostname: 'bit.ly',
        riskCategory: 'medium',
        riskScore: 40,
        indicators: [
          { id: 'URL_SHORTENER', name: 'URL Shortener Detected', severity: 'warning', weight: 20, description: 'Domain is a known shortening service.' }
        ],
        detectionMethods: ['rule-based', 'machine-learning'],
        modelPrediction: 'legitimate',
        modelConfidence: 0.72,
        threatIntelStatus: 'clean',
        explanation: 'Medium risk detected (Score: 40/100). The URL is obscured through a shortening service.',
        scannedAt: new Date(Date.now() - 10 * 3600 * 1000)
      }
    ];

    await Scan.insertMany(sampleScans);

    console.log('Seed completed successfully!');
    console.log(`Created Admin user: admin@test.internal (Password: AdminSecurePass2026!)`);
    console.log(`Created Analyst user: analyst@test.internal (Password: AnalystPass2026!)`);
    console.log(`Seeded ${sampleScans.length} historical audit scans.`);

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
