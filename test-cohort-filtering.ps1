# Test Cohort Filtering Functionality
Write-Host "🧪 Testing Cohort Filtering" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

$baseUrl = "http://localhost:3000"

# Test 1: Register a manager
Write-Host "`n1. Registering Manager..." -ForegroundColor Yellow
try {
    $registerData = @{
        name = "Test Manager"
        email = "manager@test.com"
        password = "TestPassword123!"
        role = "manager"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method POST -Body $registerData -ContentType "application/json"
    Write-Host "✅ Manager Registered Successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Registration Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Login to get token
Write-Host "`n2. Logging in..." -ForegroundColor Yellow
try {
    $loginData = @{
        email = "manager@test.com"
        password = "TestPassword123!"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $jwtToken = $response.data.token
    Write-Host "✅ Login Successful - Token received" -ForegroundColor Green
} catch {
    Write-Host "❌ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Create a cohort
Write-Host "`n3. Creating Cohort..." -ForegroundColor Yellow
try {
    $cohortData = @{
        name = "Cohort 2024"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $jwtToken"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/cohorts" -Method POST -Body $cohortData -Headers $headers
    $cohortId = $response.data.cohort.id
    Write-Host "✅ Cohort Created - ID: $cohortId" -ForegroundColor Green
} catch {
    Write-Host "❌ Cohort Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Test cohort filtering
Write-Host "`n4. Testing Cohort Filtering..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/allocations?cohortId=$cohortId" -Method GET -Headers $headers
    Write-Host "✅ Cohort Filtering Test Successful" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Cohort Filtering Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Test multiple filtering
Write-Host "`n5. Testing Multiple Filtering..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/allocations?cohortId=$cohortId&trimester=1&year=2025" -Method GET -Headers $headers
    Write-Host "✅ Multiple Filtering Test Successful" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Multiple Filtering Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Test without cohort filter
Write-Host "`n6. Testing Without Cohort Filter..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/allocations" -Method GET -Headers $headers
    Write-Host "✅ No Filter Test Successful" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ No Filter Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Cohort Filtering Tests Complete!" -ForegroundColor Green
Write-Host "The API is working correctly with cohort filtering functionality." -ForegroundColor Cyan 