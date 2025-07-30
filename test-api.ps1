# Course Management Platform API Test Script
# Run this script to test your API endpoints

$baseUrl = "http://localhost:3000"
$jwtToken = ""

Write-Host "🧪 Testing Course Management Platform API" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Health Check: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Register Manager
Write-Host "`n2. Registering Manager..." -ForegroundColor Yellow
try {
    $registerData = @{
        name = "Test Manager"
        email = "manager@test.com"
        password = "TestPassword123!"
        role = "manager"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method POST -Body $registerData -ContentType "application/json"
    Write-Host "✅ Manager Registered: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Manager Registration Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Login
Write-Host "`n3. Logging in..." -ForegroundColor Yellow
try {
    $loginData = @{
        email = "manager@test.com"
        password = "TestPassword123!"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $jwtToken = $response.data.token
    Write-Host "✅ Login Successful: Token received" -ForegroundColor Green
} catch {
    Write-Host "❌ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Create Module
Write-Host "`n4. Creating Module..." -ForegroundColor Yellow
try {
    $moduleData = @{
        name = "Advanced Backend"
        code = "CS401"
        half = "H1"
        credits = 15
        description = "Advanced backend development"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $jwtToken"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/modules" -Method POST -Body $moduleData -Headers $headers
    $moduleId = $response.data.module.id
    Write-Host "✅ Module Created: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Module Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Create Cohort
Write-Host "`n5. Creating Cohort..." -ForegroundColor Yellow
try {
    $cohortData = @{
        name = "Cohort 2024"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/cohorts" -Method POST -Body $cohortData -Headers $headers
    $cohortId = $response.data.cohort.id
    Write-Host "✅ Cohort Created: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Cohort Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Create Class
Write-Host "`n6. Creating Class..." -ForegroundColor Yellow
try {
    $classData = @{
        name = "2024M"
        startDate = "2024-07-13"
        graduationDate = "2024-07-30"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/classes" -Method POST -Body $classData -Headers $headers
    $classId = $response.data.class.id
    Write-Host "✅ Class Created: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Class Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Get All Allocations (Test Cohort Filtering)
Write-Host "`n7. Testing Cohort Filtering..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/allocations?cohortId=$cohortId" -Method GET -Headers $headers
    Write-Host "✅ Cohort Filtering Test: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Cohort Filtering Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 API Testing Complete!" -ForegroundColor Green
Write-Host "Check the responses above to verify your API is working correctly." -ForegroundColor Cyan 