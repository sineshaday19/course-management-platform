const express = require('express');
const app = express();
const PORT = 3001;

// Simple test server
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test server is working!',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log(`📝 Test endpoint: http://localhost:${PORT}/test`);
});

// Test the main server
const testMainServer = async () => {
  try {
    const response = await fetch('http://localhost:3000/health');
    const data = await response.json();
    console.log('✅ Main server health check:', data);
  } catch (error) {
    console.log('❌ Main server health check failed:', error.message);
  }
};

// Run test after 2 seconds
setTimeout(testMainServer, 2000); 