# Create User and Get Token Script

Write-Host "=== Creating Local User and Getting Token ===" -ForegroundColor Green
Write-Host ""

# Step 1: Register User
Write-Host "Step 1: Registering user..." -ForegroundColor Yellow

$registerBody = @{
    name = "Local Test User"
    email = "local@test.com"
    password = "Test123456"
    role = "admin"
    department = "IT"
    designation = "Developer"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody `
        -ErrorAction Stop
    
    Write-Host "✓ User created successfully!" -ForegroundColor Green
    Write-Host "User ID: $($registerResponse.data.id)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "✓ User already exists, proceeding to login..." -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Registration error (might already exist): $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Step 2: Login to Get Token
Write-Host "Step 2: Logging in to get token..." -ForegroundColor Yellow

$loginBody = @{
    email = "local@test.com"
    password = "Test123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop
    
    $token = $loginResponse.token
    
    if ($token) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✅ TOKEN RECEIVED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "BEARER TOKEN:" -ForegroundColor Cyan
        Write-Host $token -ForegroundColor White -BackgroundColor DarkBlue
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        
        # Save token to file
        $token | Out-File -FilePath "local-token.txt" -Encoding utf8 -NoNewline
        Write-Host "✓ Token saved to local-token.txt" -ForegroundColor Green
        Write-Host ""
        
        # Show test command
        Write-Host "Test Work Locations API:" -ForegroundColor Yellow
        Write-Host "curl -X POST http://localhost:3000/api/work-locations \`" -ForegroundColor White
        Write-Host "  -H `"Authorization: Bearer $token`" \`" -ForegroundColor White
        Write-Host "  -H `"Content-Type: application/json`" \`" -ForegroundColor White
        Write-Host "  -d '{\`"name\`":\`"Test Office\`",\`"latitude\`":22.3072,\`"longitude\`":73.1812,\`"radius\`":100.0}'" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "❌ Error: No token received in response" -ForegroundColor Red
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Could not get token" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "1. Server is running: npm run dev" -ForegroundColor White
    Write-Host "2. MongoDB is connected (.env.local file exists)" -ForegroundColor White
    Write-Host "3. Server is accessible at http://localhost:3000" -ForegroundColor White
}

