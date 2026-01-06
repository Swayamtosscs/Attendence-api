# Check-In & Check-Out API - cURL Commands

**Base URL:** `http://103.14.120.163:8092` (Production) या `http://localhost:3000` (Local)  
**Authentication:** Bearer Token (required)

---

## 1. Check-In API (काम शुरू करने के लिए)

**Endpoint:** `POST /api/attendance/check-in`

### Basic Check-In (सिर्फ check-in, कोई extra data नहीं):
```bash
curl -X POST http://103.14.120.163:8092/api/attendance/check-in \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Check-In with Notes (Notes के साथ):
```bash
curl -X POST http://103.14.120.163:8092/api/attendance/check-in \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Working from office today"
  }'
```

### Check-In with Location (Location के साथ):
```bash
curl -X POST http://103.14.120.163:8092/api/attendance/check-in \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.7041,
    "longitude": 77.1025
  }'
```

### Complete Check-In (सभी fields के साथ):
```bash
curl -X POST http://103.14.120.163:8092/api/attendance/check-in \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Working from office",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "deviceInfo": "iPhone 14 Pro"
  }'
```

**Local Server के लिए:**
```bash
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Starting work",
    "latitude": 22.3072,
    "longitude": 73.1812,
    "deviceInfo": "Android Phone"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "691860843edbbd5f691ff980",
    "checkInAt": "2024-01-15T09:00:00.000Z",
    "status": "present",
    "notes": "Working from office"
  }
}
```

**Error Responses:**
- `409 Conflict`: "Already checked in for today" (आज पहले से check-in हो चुका है)
- `401 Unauthorized`: "Unauthorized" (Token missing या invalid)

**Request Body Fields (सभी optional):**
- `notes` (string, optional): Check-in के बारे में note
- `latitude` (number, optional): Location की latitude (-90 to 90)
- `longitude` (number, optional): Location की longitude (-180 to 180)
- `deviceInfo` (string, optional): Device की information (जैसे "iPhone 14", "Android Phone")

---

## 2. Check-Out API (काम खत्म करने के लिए)

**Endpoint:** `POST /api/attendance/check-out`

### Basic Check-Out (सिर्फ check-out):
```bash
curl -X POST http://103.14.120.163:8092/api/attendance/check-out \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Check-Out with Notes (Notes के साथ):
```bash
curl -X POST http://103.14.120.163:8092/api/attendance/check-out \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Completed all tasks for today"
  }'
```

**Local Server के लिए:**
```bash
curl -X POST http://localhost:3000/api/attendance/check-out \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Work completed"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "691860843edbbd5f691ff980",
    "checkInAt": "2024-01-15T09:00:00.000Z",
    "checkOutAt": "2024-01-15T18:00:00.000Z",
    "workDurationMinutes": 540
  }
}
```

**Error Responses:**
- `404 Not Found`: "No check-in found for today" (आज check-in नहीं हुआ है)
- `409 Conflict`: "Already checked out for today" (आज पहले से check-out हो चुका है)
- `401 Unauthorized`: "Unauthorized" (Token missing या invalid)

**Request Body Fields:**
- `notes` (string, optional): Check-out के बारे में note

---

## Complete Workflow Example (पूरा Example)

### Step 1: Login और Token लें
```bash
# Production Server
TOKEN=$(curl -s -X POST http://103.14.120.163:8092/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}' \
  | jq -r '.token')

echo "Token: $TOKEN"
```

**Windows PowerShell के लिए:**
```powershell
$loginResponse = Invoke-RestMethod -Uri "http://103.14.120.163:8092/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"your-email@example.com","password":"your-password"}'

$TOKEN = $loginResponse.token
Write-Host "Token: $TOKEN"
```

### Step 2: Check-In करें
```bash
curl -X POST http://103.14.120.163:8092/api/attendance/check-in \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Starting work",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "deviceInfo": "iPhone 14"
  }'
```

### Step 3: Check-Out करें
```bash
curl -X POST http://103.14.120.163:8092/api/attendance/check-out \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Work completed"
  }'
```

---

## Important Notes (महत्वपूर्ण बातें)

1. **Authentication:** दोनों APIs के लिए Bearer token required है
2. **Daily Limit:** 
   - एक दिन में सिर्फ एक बार check-in हो सकता है
   - Check-out करने से पहले check-in जरूरी है
3. **Location Tracking:** 
   - Latitude और longitude optional हैं
   - अगर दोनों provide किए जाएं तो location save होती है
4. **Device Info:** Optional field है, device की information store करने के लिए
5. **Notes:** Optional field है, किसी भी additional information के लिए

---

## Common Error Scenarios (आम Errors)

### Error 1: Already Checked In
```json
{
  "success": false,
  "message": "Already checked in for today"
}
```
**Solution:** आज पहले से check-in हो चुका है। कल तक wait करें या admin से contact करें।

### Error 2: No Check-In Found
```json
{
  "success": false,
  "message": "No check-in found for today"
}
```
**Solution:** पहले check-in करें, फिर check-out करें।

### Error 3: Already Checked Out
```json
{
  "success": false,
  "message": "Already checked out for today"
}
```
**Solution:** आज पहले से check-out हो चुका है।

### Error 4: Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```
**Solution:** Valid Bearer token provide करें। पहले login करके token लें।

---

## Quick Reference Table

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/attendance/check-in` | ✅ | Check-in for today |
| POST | `/api/attendance/check-out` | ✅ | Check-out for today |

---

## Example with Real Data

### Check-In Example:
```bash
curl -X POST http://103.14.120.163:8092/api/attendance/check-in \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Reached office at 9:00 AM",
    "latitude": 22.3072,
    "longitude": 73.1812,
    "deviceInfo": "Samsung Galaxy S21"
  }'
```

### Check-Out Example:
```bash
curl -X POST http://103.14.120.163:8092/api/attendance/check-out \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Completed all assigned tasks"
  }'
```

---

## Tips (सुझाव)

1. **Always include Authorization header** - बिना token के API काम नहीं करेगी
2. **Check-in before check-out** - हमेशा पहले check-in करें
3. **Use location data** - अगर location tracking चाहिए तो latitude/longitude भेजें
4. **Add meaningful notes** - Notes में useful information add करें
5. **Handle errors gracefully** - Error responses को properly handle करें

---

## Testing Commands (Test करने के लिए)

### Test Check-In:
```bash
# Replace YOUR_TOKEN_HERE with actual token
curl -v -X POST http://103.14.120.163:8092/api/attendance/check-in \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Test check-in"}'
```

### Test Check-Out:
```bash
# Replace YOUR_TOKEN_HERE with actual token
curl -v -X POST http://103.14.120.163:8092/api/attendance/check-out \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Test check-out"}'
```

**Note:** `-v` flag verbose output देता है जो debugging के लिए helpful है।






