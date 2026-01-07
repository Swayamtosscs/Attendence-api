# Quick Test Script with Token

# Read token from file if exists, otherwise get new one
if (Test-Path "token.txt") {
    $token = Get-Content "token.txt" -Raw
    $token = $token.Trim()
    Write-Host "Using token from token.txt" -ForegroundColor Green
} else {
    Write-Host "No token.txt found. Getting new token..." -ForegroundColor Yellow
    & .\get-token.ps1
    if (Test-Path "token.txt") {
        $token = Get-Content "token.txt" -Raw
        $token = $token.Trim()
    } else {
        Write-Host "Failed to get token. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=== Testing Work Locations API ===" -ForegroundColor Green
Write-Host ""

# Test 1: Create Work Location
Write-Host "Test 1: Creating work location..." -ForegroundColor Yellow

$body = @{
    name = "Main Office"
    latitude = 22.3072
    longitude = 73.1812
    radius = 100.0
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/work-locations" `
        -Method POST `
        -Headers $headers `
        -Body $body
    
    Write-Host "✓ Success! Location created:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    
    $locationId = $response.data.id
    Write-Host "Location ID: $locationId" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "❌ Error creating location:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
    exit 1
}

# Test 2: Get All Locations
Write-Host "Test 2: Getting all locations..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/work-locations" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ Success! Found locations:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    
} catch {
    Write-Host "❌ Error getting locations:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "=== Tests Complete ===" -ForegroundColor Green

