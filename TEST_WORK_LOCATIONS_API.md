# Testing Work Locations API

## Step 1: Login and Get Token

First, you need to login to get a valid JWT token:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {...},
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Copy the token from the response!**

---

## Step 2: Test Work Locations API

### Create Work Location

```bash
# Replace YOUR_TOKEN with the token from Step 1
curl -X POST http://localhost:3000/api/work-locations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Office",
    "latitude": 22.3072,
    "longitude": 73.1812,
    "radius": 100.0
  }'
```

**Expected Success Response (201):**
```json
{
  "success": true,
  "message": "Location saved successfully",
  "data": {
    "id": "691860843edbbd5f691ff980",
    "name": "Main Office",
    "latitude": 22.3072,
    "longitude": 73.1812,
    "radius": 100.0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Complete Test Script (PowerShell)

```powershell
# Step 1: Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"your-email@example.com","password":"your-password"}'

$token = $loginResponse.token
Write-Host "Token: $token"

# Step 2: Create Work Location
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

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/work-locations" `
  -Method POST `
  -Headers $headers `
  -Body $body

Write-Host "Response:"
$response | ConvertTo-Json -Depth 10
```

---

## Complete Test Script (Bash/Linux/Mac)

```bash
#!/bin/bash

# Step 1: Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"

# Step 2: Create Work Location
curl -X POST http://localhost:3000/api/work-locations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Office",
    "latitude": 22.3072,
    "longitude": 73.1812,
    "radius": 100.0
  }'
```

---

## Common Issues

### 1. 401 Unauthorized
**Problem:** No token or invalid token  
**Solution:** Make sure you:
- Login first and get a token
- Include `Authorization: Bearer YOUR_TOKEN` header
- Token is not expired (tokens expire after 7 days)

### 2. 400 Bad Request
**Problem:** Invalid request data  
**Solution:** Check:
- `name` is required and is a string
- `latitude` is between -90 and 90
- `longitude` is between -180 and 180
- `radius` is between 1 and 10000

### 3. Token Format
**Correct:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Incorrect:**
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (missing "Bearer ")
Authorization: Bearer: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (colon instead of space)
```

---

## Quick Test with Postman/Thunder Client

1. **Create a new request:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/work-locations`

2. **Add Headers:**
   - `Authorization`: `Bearer YOUR_TOKEN_HERE`
   - `Content-Type`: `application/json`

3. **Add Body (JSON):**
```json
{
  "name": "Main Office",
  "latitude": 22.3072,
  "longitude": 73.1812,
  "radius": 100.0
}
```

4. **Send Request**

---

## All Endpoints Test

```bash
# Set your token
TOKEN="your-token-here"

# 1. Create Location
curl -X POST http://localhost:3000/api/work-locations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Main Office","latitude":22.3072,"longitude":73.1812,"radius":100.0}'

# 2. Get All Locations
curl -X GET http://localhost:3000/api/work-locations \
  -H "Authorization: Bearer $TOKEN"

# 3. Get Location by ID (replace ID)
curl -X GET http://localhost:3000/api/work-locations/LOCATION_ID \
  -H "Authorization: Bearer $TOKEN"

# 4. Update Location (replace ID)
curl -X PUT http://localhost:3000/api/work-locations/LOCATION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"radius":150.0}'

# 5. Delete Location (replace ID)
curl -X DELETE http://localhost:3000/api/work-locations/LOCATION_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

**Note:** The 401 error is **correct behavior** when no token is provided. The API requires authentication for security.

