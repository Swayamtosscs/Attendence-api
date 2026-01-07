# PowerShell Script to Get Token for Testing

Write-Host "=== Getting Token for Testing ===" -ForegroundColor Green
Write-Host ""

# Option 1: Register New User (if not exists)
Write-Host "Step 1: Registering/Logging in..." -ForegroundColor Yellow

$registerBody = @{
    name = "Test User"
    email = "test@example.com"
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
        -ErrorAction SilentlyContinue
    
    Write-Host "✓ User registered successfully!" -ForegroundColor Green
} catch {
    Write-Host "User might already exist, trying login..." -ForegroundColor Yellow
}

# Step 2: Login to Get Token
$loginBody = @{
    email = "test@example.com"
    password = "Test123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    $token = $loginResponse.token
    
    Write-Host ""
    Write-Host "=== TOKEN RECEIVED ===" -ForegroundColor Green
    Write-Host ""
    Write-Host $token -ForegroundColor Cyan
    Write-Host ""
    Write-Host "=== Copy this token and use it in your API requests ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example curl command:" -ForegroundColor Yellow
    Write-Host "curl -X POST http://localhost:3000/api/work-locations \`" -ForegroundColor White
    Write-Host "  -H `"Authorization: Bearer $token`" \`" -ForegroundColor White
    Write-Host "  -H `"Content-Type: application/json`" \`" -ForegroundColor White
    Write-Host "  -d '{\`"name\`":\`"Test Office\`",\`"latitude\`":22.3072,\`"longitude\`":73.1812,\`"radius\`":100.0}'" -ForegroundColor White
    Write-Host ""
    
    # Save token to file
    $token | Out-File -FilePath "token.txt" -Encoding utf8
    Write-Host "Token also saved to token.txt file" -ForegroundColor Green
    
} catch {
    Write-Host "Error: Could not login. Error details:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "1. Server is running on http://localhost:3000" -ForegroundColor Yellow
    Write-Host "2. MongoDB is connected" -ForegroundColor Yellow
    Write-Host "3. Try registering first with different email" -ForegroundColor Yellow
}

