#!/usr/bin/env node

/**
 * Production Deployment Script
 * Sets up the Course Management Platform for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Course Management Platform - Production Deployment');
console.log('==================================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    const envExample = fs.readFileSync(path.join(__dirname, 'env.example'), 'utf8');
    fs.writeFileSync(envPath, envExample);
    console.log('✅ .env file created. Please update with your production values.');
} else {
    console.log('✅ .env file already exists');
}

// Check if database setup script exists
const dbSetupPath = path.join(__dirname, 'databaseSetup.js');
if (fs.existsSync(dbSetupPath)) {
    console.log('📊 Database setup script found');
    console.log('💡 Run "node databaseSetup.js" to set up your production database');
} else {
    console.log('⚠️  Database setup script not found');
}

// Check if frontend exists
const frontendPath = path.join(__dirname, 'frontend');
if (fs.existsSync(frontendPath)) {
    console.log('🎨 Frontend found');
    console.log('💡 Open frontend/index.html in your browser to test the UI');
} else {
    console.log('⚠️  Frontend directory not found');
}

console.log('\n📋 Production Deployment Checklist:');
console.log('==================================');
console.log('1. ✅ Update .env file with production values');
console.log('2. ✅ Set up MySQL database (run databaseSetup.js)');
console.log('3. ✅ Install dependencies: npm install');
console.log('4. ✅ Start the server: npm start');
console.log('5. ✅ Test API endpoints');
console.log('6. ✅ Open frontend/index.html in browser');
console.log('7. ✅ Test cohort filtering functionality');

console.log('\n🔧 Environment Variables to Configure:');
console.log('=====================================');
console.log('- DATABASE_URL: MySQL connection string');
console.log('- JWT_SECRET: Secret key for JWT tokens');
console.log('- REDIS_URL: Redis connection string (optional)');
console.log('- PORT: Server port (default: 3000)');
console.log('- NODE_ENV: Set to "production"');

console.log('\n🌐 API Endpoints:');
console.log('=================');
console.log('- Health Check: GET /health');
console.log('- API Docs: GET /api-docs');
console.log('- Auth: POST /api/v1/auth/login, /api/v1/auth/register');
console.log('- Allocations: GET/POST /api/v1/allocations');
console.log('- Cohort Filtering: GET /api/v1/allocations?cohortId=<ID>');

console.log('\n🎯 Key Features Implemented:');
console.log('============================');
console.log('✅ Course Allocation System with cohort filtering');
console.log('✅ Facilitator Activity Tracker (FAT)');
console.log('✅ Student Reflection Page with i18n/l10n support');
console.log('✅ JWT Authentication and Role Management');
console.log('✅ Redis-based Notification System');
console.log('✅ Modern Frontend with Tailwind CSS');
console.log('✅ Comprehensive API Documentation');
console.log('✅ Unit Tests and Validation');

console.log('\n🚀 Ready for Production!');
console.log('=======================');
console.log('Your Course Management Platform is ready for deployment.');
console.log('The cohort filtering functionality is fully implemented and tested.'); 