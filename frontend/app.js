// Course Management Platform Frontend
class CourseManagementApp {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3001';
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user'));
        
        this.initializeEventListeners();
        this.checkAuthStatus();
    }

    initializeEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Register form
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Filter button
        document.getElementById('filterBtn').addEventListener('click', () => {
            this.loadAllocations();
        });

        // Create allocation form
        document.getElementById('createAllocationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAllocation();
        });
    }

    checkAuthStatus() {
        if (this.token && this.user) {
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    async login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.data.token;
                this.user = data.data.user;
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                this.showDashboard();
                this.showStatus('Login successful!', 'success');
            } else {
                this.showStatus(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            this.showStatus('Login failed: ' + error.message, 'error');
        }
    }

    async register() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    name, 
                    email, 
                    password, 
                    role: 'manager' 
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showStatus('Registration successful! Please login.', 'success');
                // Clear register form
                document.getElementById('registerForm').reset();
            } else {
                this.showStatus(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            this.showStatus('Registration failed: ' + error.message, 'error');
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.showLogin();
        this.showStatus('Logged out successfully', 'success');
    }

    showLogin() {
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('dashboardSection').classList.add('hidden');
        document.getElementById('loginBtn').classList.remove('hidden');
        document.getElementById('logoutBtn').classList.add('hidden');
        document.getElementById('userInfo').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('dashboardSection').classList.remove('hidden');
        document.getElementById('loginBtn').classList.add('hidden');
        document.getElementById('logoutBtn').classList.remove('hidden');
        document.getElementById('userInfo').classList.remove('hidden');
        document.getElementById('userName').textContent = this.user.name;
        
        // Load initial allocations
        this.loadAllocations();
    }

    async loadAllocations() {
        const cohortId = document.getElementById('cohortFilter').value;
        const trimester = document.getElementById('trimesterFilter').value;
        const year = document.getElementById('yearFilter').value;

        // Build query parameters
        const params = new URLSearchParams();
        if (cohortId) params.append('cohortId', cohortId);
        if (trimester) params.append('trimester', trimester);
        if (year) params.append('year', year);

        const url = `${this.apiBaseUrl}/api/v1/allocations${params.toString() ? '?' + params.toString() : ''}`;

        this.showLoading(true);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.displayAllocations(data.data.allocations, data.data.pagination);
                this.showStatus(`Loaded ${data.data.allocations.length} allocations`, 'success');
            } else {
                this.showStatus(data.message || 'Failed to load allocations', 'error');
            }
        } catch (error) {
            this.showStatus('Failed to load allocations: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayAllocations(allocations, pagination) {
        const container = document.getElementById('resultsContainer');
        
        if (allocations.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-4"></i>
                    <p>No allocations found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 class="font-semibold text-blue-800">Filter Results</h4>
                <p class="text-blue-600">Found ${allocations.length} allocation(s)</p>
                <p class="text-blue-600">Page ${pagination.page} of ${pagination.pages}</p>
            </div>
        `;

        allocations.forEach(allocation => {
            const card = document.createElement('div');
            card.className = 'bg-white border border-gray-200 rounded-lg p-6 card-hover';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <h4 class="text-lg font-semibold text-gray-800">Allocation ${allocation.id}</h4>
                    <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                </div>
                <div class="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p><strong>Module ID:</strong> ${allocation.moduleId}</p>
                        <p><strong>Class ID:</strong> ${allocation.classId}</p>
                        <p><strong>Cohort ID:</strong> <span class="text-blue-600 font-semibold">${allocation.cohortId}</span></p>
                    </div>
                    <div>
                        <p><strong>Facilitator ID:</strong> ${allocation.facilitatorId}</p>
                        <p><strong>Trimester:</strong> ${allocation.trimester}</p>
                        <p><strong>Year:</strong> ${allocation.year}</p>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200">
                    <p><strong>Mode ID:</strong> ${allocation.modeId}</p>
                </div>
            `;
            container.appendChild(card);
        });
    }

    async createAllocation() {
        const formData = {
            moduleId: document.getElementById('moduleId').value,
            classId: document.getElementById('classId').value,
            cohortId: document.getElementById('cohortId').value,
            facilitatorId: document.getElementById('facilitatorId').value,
            trimester: parseInt(document.getElementById('trimester').value),
            modeId: document.getElementById('modeId').value,
            year: parseInt(document.getElementById('year').value)
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/v1/allocations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                this.showStatus('Allocation created successfully!', 'success');
                document.getElementById('createAllocationForm').reset();
                // Reload allocations to show the new one
                this.loadAllocations();
            } else {
                this.showStatus(data.message || 'Failed to create allocation', 'error');
            }
        } catch (error) {
            this.showStatus('Failed to create allocation: ' + error.message, 'error');
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const container = document.getElementById('resultsContainer');
        
        if (show) {
            spinner.classList.remove('hidden');
            container.classList.add('hidden');
        } else {
            spinner.classList.add('hidden');
            container.classList.remove('hidden');
        }
    }

    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('statusMessage');
        const statusIcon = document.getElementById('statusIcon');
        const statusText = document.getElementById('statusText');

        // Set icon and colors based on type
        let iconClass, bgColor, textColor;
        switch (type) {
            case 'success':
                iconClass = 'fas fa-check-circle text-green-600';
                bgColor = 'bg-green-100';
                textColor = 'text-green-800';
                break;
            case 'error':
                iconClass = 'fas fa-exclamation-circle text-red-600';
                bgColor = 'bg-red-100';
                textColor = 'text-red-800';
                break;
            default:
                iconClass = 'fas fa-info-circle text-blue-600';
                bgColor = 'bg-blue-100';
                textColor = 'text-blue-800';
        }

        statusIcon.className = iconClass;
        statusText.textContent = message;
        statusDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${bgColor} ${textColor}`;
        statusDiv.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 5000);
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CourseManagementApp();
}); 