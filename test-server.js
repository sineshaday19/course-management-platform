const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const mockAllocations = [
    {
        id: '1',
        moduleId: 'module-1',
        classId: 'class-1',
        cohortId: 'cohort-2024',
        facilitatorId: 'facilitator-1',
        trimester: 1,
        modeId: 'mode-1',
        year: 2024,
        isActive: true
    },
    {
        id: '2',
        moduleId: 'module-2',
        classId: 'class-2',
        cohortId: 'cohort-2024',
        facilitatorId: 'facilitator-2',
        trimester: 2,
        modeId: 'mode-2',
        year: 2024,
        isActive: true
    },
    {
        id: '3',
        moduleId: 'module-3',
        classId: 'class-3',
        cohortId: 'cohort-2025',
        facilitatorId: 'facilitator-1',
        trimester: 1,
        modeId: 'mode-1',
        year: 2025,
        isActive: true
    }
];

const mockUsers = [
    {
        id: '1',
        name: 'Test Manager',
        email: 'manager@test.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        role: 'manager'
    }
];

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Course Management Platform is running',
        features: ['Cohort Filtering', 'Activity Tracking', 'Student Reflection']
    });
});

app.get('/api-docs', (req, res) => {
    res.json({
        title: 'Course Management Platform API',
        version: '1.0.0',
        endpoints: {
            'GET /health': 'Health check',
            'POST /api/v1/auth/login': 'User login',
            'POST /api/v1/auth/register': 'User registration',
            'GET /api/v1/allocations': 'List allocations (supports cohort filtering)',
            'POST /api/v1/allocations': 'Create allocation'
        }
    });
});

app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    const user = mockUsers.find(u => u.email === email);
    if (!user || password !== 'TestPassword123!') {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        'your-super-secret-jwt-key',
        { expiresIn: '24h' }
    );

    res.json({
        success: true,
        data: {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        }
    });
});

app.post('/api/v1/auth/register', (req, res) => {
    const { name, email, password, role } = req.body;
    
    if (mockUsers.find(u => u.email === email)) {
        return res.status(400).json({
            success: false,
            message: 'User already exists'
        });
    }

    res.json({
        success: true,
        message: 'User registered successfully'
    });
});

app.get('/api/v1/allocations', (req, res) => {
    const { cohortId, trimester, year, page = 1, limit = 10 } = req.query;
    
    let filteredAllocations = [...mockAllocations];
    
    if (cohortId) {
        filteredAllocations = filteredAllocations.filter(
            allocation => allocation.cohortId === cohortId
        );
    }
    
    if (trimester) {
        filteredAllocations = filteredAllocations.filter(
            allocation => allocation.trimester === parseInt(trimester)
        );
    }
    
    if (year) {
        filteredAllocations = filteredAllocations.filter(
            allocation => allocation.year === parseInt(year)
        );
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedAllocations = filteredAllocations.slice(startIndex, endIndex);
    
    res.json({
        success: true,
        data: {
            allocations: paginatedAllocations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: filteredAllocations.length,
                pages: Math.ceil(filteredAllocations.length / limit)
            },
            filters: {
                cohortId,
                trimester,
                year
            }
        }
    });
});

app.post('/api/v1/allocations', (req, res) => {
    const { moduleId, classId, cohortId, facilitatorId, trimester, modeId, year } = req.body;
    
    if (!moduleId || !classId || !cohortId || !facilitatorId || !trimester || !modeId || !year) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }
    
    const newAllocation = {
        id: (mockAllocations.length + 1).toString(),
        moduleId,
        classId,
        cohortId,
        facilitatorId,
        trimester: parseInt(trimester),
        modeId,
        year: parseInt(year),
        isActive: true
    };
    
    mockAllocations.push(newAllocation);
    
    res.status(201).json({
        success: true,
        data: newAllocation,
        message: 'Allocation created successfully'
    });
});

app.listen(PORT, () => {
    console.log('🚀 Test Server Running');
    console.log('================================');
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`🎨 Frontend: Open frontend/index.html in your browser`);
    console.log('');
    console.log('🧪 Testing Instructions:');
    console.log('1. Open frontend/index.html in your browser');
    console.log('2. Register/login with manager@test.com / TestPassword123!');
    console.log('3. Test cohort filtering with cohort-2024 or cohort-2025');
    console.log('4. Try creating new allocations');
    console.log('');
    console.log('✅ Cohort filtering is fully functional!');
}); 