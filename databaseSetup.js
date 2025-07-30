const { sequelize } = require('./config/database');
const { Manager, Module, Cohort, Class, Student, Facilitator, Mode, CourseAllocation, ActivityTracker } = require('./models');

async function setupDatabase() {
    console.log('🗄️ Setting up database...');
    
    try {
        console.log('🔄 Creating database tables...');
        await sequelize.sync({ force: true });
        console.log('✅ Database tables created');

        console.log('📝 Creating initial data...');
        
        const manager = await Manager.create({
            name: 'Admin Manager',
            email: 'admin@courseplatform.com',
            password: 'AdminPassword123!',
            role: 'manager'
        });

        const modes = await Mode.bulkCreate([
            { name: 'Online', description: 'Online delivery mode' },
            { name: 'In-person', description: 'In-person delivery mode' },
            { name: 'Hybrid', description: 'Hybrid delivery mode' }
        ]);

        const cohorts = await Cohort.bulkCreate([
            { name: 'Cohort 2024' },
            { name: 'Cohort 2025' }
        ]);

        const classes = await Class.bulkCreate([
            {
                name: '2024M',
                startDate: '2024-07-13',
                graduationDate: '2024-07-30'
            },
            {
                name: '2025S',
                startDate: '2025-06-14',
                graduationDate: '2025-09-30'
            }
        ]);

        const modules = await Module.bulkCreate([
            {
                name: 'Advanced Backend',
                code: 'CS401',
                half: 'H1',
                credits: 15,
                description: 'Advanced backend development'
            },
            {
                name: 'Frontend Development',
                code: 'CS402',
                half: 'H1',
                credits: 12,
                description: 'Modern frontend development'
            }
        ]);

        const facilitator = await Facilitator.create({
            name: 'John Doe',
            email: 'john@courseplatform.com',
            password: 'FacilitatorPassword123!',
            qualification: 'Masters',
            location: 'Kigali',
            managerId: manager.id
        });

        console.log('📊 Database setup completed successfully!');
        console.log('📝 Created:');
        console.log(`   - Manager: ${manager.name}`);
        console.log(`   - Modes: ${modes.length}`);
        console.log(`   - Cohorts: ${cohorts.length}`);
        console.log(`   - Classes: ${classes.length}`);
        console.log(`   - Modules: ${modules.length}`);
        console.log(`   - Facilitator: ${facilitator.name}`);

        await sequelize.close();

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    }
}

setupDatabase(); 