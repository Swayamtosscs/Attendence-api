# Work Locations API - cURL Commands

**Base URL:** `http://103.14.120.163:8092` (Production) या `http://localhost:3000` (Local)  
**Authentication:** Bearer Token (सभी APIs के लिए required)

---

## 1. Create Work Location (नया Location बनाएं)

**Endpoint:** `POST /api/work-locations`

```bash
curl -X POST http://103.14.120.163:8092/api/work-locations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Office",
    "latitude": 22.3072,
    "longitude": 73.1812,
    "radius": 100.0
  }'
```

**Local Server के लिए:**
```bash
curl -X POST http://localhost:3000/api/work-locations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Office",
    "latitude": 22.3072,
    "longitude": 73.1812,
    "radius": 100.0
  }'
```

**Validation Rules:**
- `name`: Required, string (1-200 characters)
- `latitude`: Required, number, range: -90 to 90
- `longitude`: Required, number, range: -180 to 180
- `radius`: Required, number, range: 1 to 10000 meters

---

## 2. Get All Work Locations (सभी Locations लिस्ट करें)

**Endpoint:** `GET /api/work-locations`

### Active Locations Only (Default):
```bash
curl -X GET "http://103.14.120.163:8092/api/work-locations" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### All Locations (Including Inactive):
```bash
curl -X GET "http://103.14.120.163:8092/api/work-locations?includeInactive=true" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Local Server के लिए:**
```bash
curl -X GET "http://localhost:3000/api/work-locations" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 3. Get Work Location by ID (ID से Location पाएं)

**Endpoint:** `GET /api/work-locations/{id}`

```bash
curl -X GET "http://103.14.120.163:8092/api/work-locations/691860843edbbd5f691ff980" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Local Server के लिए:**
```bash
curl -X GET "http://localhost:3000/api/work-locations/691860843edbbd5f691ff980" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Note:** `691860843edbbd5f691ff980` को अपने actual location ID से replace करें।

---

## 4. Update Work Location (Location Update करें)

**Endpoint:** `PUT /api/work-locations/{id}`

**सभी fields optional हैं - जो update करना हो वो भेजें:**

```bash
curl -X PUT "http://103.14.120.163:8092/api/work-locations/691860843edbbd5f691ff980" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Office Name",
    "latitude": 22.3075,
    "longitude": 73.1815,
    "radius": 150.0,
    "isActive": true
  }'
```

**केवल specific fields update करने के लिए:**
```bash
curl -X PUT "http://103.14.120.163:8092/api/work-locations/691860843edbbd5f691ff980" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "radius": 150.0
  }'
```

**Local Server के लिए:**
```bash
curl -X PUT "http://localhost:3000/api/work-locations/691860843edbbd5f691ff980" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Office Name",
    "radius": 150.0
  }'
```

---

## 5. Delete Work Location (Location Delete करें - Soft Delete)

**Endpoint:** `DELETE /api/work-locations/{id}`

```bash
curl -X DELETE "http://103.14.120.163:8092/api/work-locations/691860843edbbd5f691ff980" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Local Server के लिए:**
```bash
curl -X DELETE "http://localhost:3000/api/work-locations/691860843edbbd5f691ff980" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Note:** यह soft delete है - location को `isActive: false` set कर देता है, database से remove नहीं करता।

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

### Step 2: Create Work Location
```bash
curl -X POST http://103.14.120.163:8092/api/work-locations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Office",
    "latitude": 22.3072,
    "longitude": 73.1812,
    "radius": 100.0
  }'
```

### Step 3: Get All Locations
```bash
curl -X GET "http://103.14.120.163:8092/api/work-locations" \
  -H "Authorization: Bearer $TOKEN"
```

### Step 4: Get Specific Location by ID
```bash
# LOCATION_ID को actual ID से replace करें
curl -X GET "http://103.14.120.163:8092/api/work-locations/LOCATION_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Step 5: Update Location
```bash
curl -X PUT "http://103.14.120.163:8092/api/work-locations/LOCATION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "radius": 150.0
  }'
```

### Step 6: Delete Location
```bash
curl -X DELETE "http://103.14.120.163:8092/api/work-locations/LOCATION_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```
**Solution:** Valid Bearer token provide करें।

### 400 Bad Request
```json
{
  "success": false,
  "message": "Latitude must be between -90 and 90"
}
```
**Solution:** Valid latitude/longitude/radius values provide करें।

### 404 Not Found
```json
{
  "success": false,
  "message": "Location not found"
}
```
**Solution:** Valid location ID provide करें।

---

## Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/work-locations` | Create new location |
| GET | `/api/work-locations` | Get all locations |
| GET | `/api/work-locations?includeInactive=true` | Get all (including inactive) |
| GET | `/api/work-locations/{id}` | Get location by ID |
| PUT | `/api/work-locations/{id}` | Update location |
| DELETE | `/api/work-locations/{id}` | Soft delete location |

---

## Notes

1. **Authentication:** सभी endpoints के लिए Bearer token required है
2. **Soft Delete:** DELETE operation location को permanently remove नहीं करता, बस `isActive: false` set करता है
3. **Validation:** 
   - Latitude: -90 to 90
   - Longitude: -180 to 180
   - Radius: 1 to 10000 meters
   - Name: 1-200 characters
4. **Update:** PUT request में सभी fields optional हैं - जो update करना हो वो भेजें

