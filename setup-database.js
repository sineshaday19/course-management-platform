const fs = require('fs');
const path = require('path');

console.log('🔧 Database Setup Helper');
console.log('========================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
    console.log('❌ .env file not found!');
    console.log('\n📝 Creating .env file with default values...');
    
    const envContent = `# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=course_management_prod
DB_USER=root
DB_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# API Configuration
API_VERSION=v1
CORS_ORIGIN=http://localhost:3000
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created with default values');
} else {
    console.log('✅ .env file exists');
}

console.log('\n🔍 Current Database Configuration:');
console.log('==================================');

// Read and display current .env values
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

const dbConfig = {};
envLines.forEach(line => {
    if (line.startsWith('DB_')) {
        const [key, value] = line.split('=');
        dbConfig[key] = value;
        console.log(`${key}: ${value || '(empty)'}`);
    }
});

console.log('\n💡 Next Steps:');
console.log('===============');
console.log('1. Edit the .env file and set your MySQL password:');
console.log('   DB_PASSWORD=your_mysql_password');
console.log('');
console.log('2. If you don\'t have a MySQL password set, you can:');
console.log('   - Set a password for MySQL root user');
console.log('   - Or create a new MySQL user');
console.log('');
console.log('3. Run the database setup:');
console.log('   node databaseSetup.js');
console.log('');
console.log('4. Test the connection:');
console.log('   node test-database.js');
console.log('');
console.log('📖 MySQL Setup Guide:');
console.log('=====================');
console.log('To set a MySQL root password:');
console.log('1. Open MySQL Command Line Client');
console.log('2. Run: ALTER USER \'root\'@\'localhost\' IDENTIFIED BY \'your_password\';');
console.log('3. Update DB_PASSWORD in .env file');
console.log('');
console.log('To create a new MySQL user:');
console.log('1. Open MySQL Command Line Client as root');
console.log('2. Run: CREATE USER \'course_user\'@\'localhost\' IDENTIFIED BY \'your_password\';');
console.log('3. Run: GRANT ALL PRIVILEGES ON course_management_prod.* TO \'course_user\'@\'localhost\';');
console.log('4. Update DB_USER and DB_PASSWORD in .env file'); 