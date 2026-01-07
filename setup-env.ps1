# Setup .env.local file for MongoDB connection

Write-Host "=== Setting up .env.local file ===" -ForegroundColor Green
Write-Host ""

# Check if .env.local already exists
if (Test-Path ".env.local") {
    Write-Host "⚠️  .env.local already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit
    }
}

Write-Host "Please provide MongoDB connection details:" -ForegroundColor Cyan
Write-Host ""

# Get MongoDB details
$mongoHost = Read-Host "MongoDB Host (default: 103.14.120.163)"
if ([string]::IsNullOrWhiteSpace($mongoHost)) {
    $mongoHost = "103.14.120.163"
}

$mongoPort = Read-Host "MongoDB Port (default: 27017)"
if ([string]::IsNullOrWhiteSpace($mongoPort)) {
    $mongoPort = "27017"
}

$mongoUser = Read-Host "MongoDB Username (default: Toss)"
if ([string]::IsNullOrWhiteSpace($mongoUser)) {
    $mongoUser = "Toss"
}

$mongoPass = Read-Host "MongoDB Password" -AsSecureString
$mongoPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($mongoPass)
)

$mongoDB = Read-Host "Database Name (default: attendence)"
if ([string]::IsNullOrWhiteSpace($mongoDB)) {
    $mongoDB = "attendence"
}

$authSecret = Read-Host "AUTH_SECRET (default: please-change-me)"
if ([string]::IsNullOrWhiteSpace($authSecret)) {
    $authSecret = "please-change-me"
}

# URL encode password (especially @ symbol)
$mongoPassEncoded = [System.Web.HttpUtility]::UrlEncode($mongoPassPlain)

# Build MongoDB URI
$mongoURI = "mongodb://${mongoUser}:${mongoPassEncoded}@${mongoHost}:${mongoPort}/${mongoDB}?authSource=admin"

Write-Host ""
Write-Host "Creating .env.local file..." -ForegroundColor Yellow

# Create .env.local content
$envContent = @"
# MongoDB Connection
MONGODB_URI=$mongoURI

# JWT / auth helpers
AUTH_SECRET=$authSecret
AUTH_TOKEN_EXPIRES_IN=7d

# Email (configure if you wire up notifications)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
EMAIL_FROM="Attendance App" <no-reply@your-domain.com>
"@

# Write to file
$envContent | Out-File -FilePath ".env.local" -Encoding utf8 -NoNewline

Write-Host "✓ .env.local file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "MongoDB URI: $mongoURI" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Please verify the MongoDB credentials are correct!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Restart your dev server (npm run dev)" -ForegroundColor White
Write-Host "2. Try registering a user again" -ForegroundColor White

