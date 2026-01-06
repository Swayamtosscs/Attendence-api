# Login & Register API - cURL Commands

**Base URL:** `http://103.14.120.163:8092` (Production) या `http://localhost:3000` (Local)  
**Authentication:** Register और Login APIs के लिए authentication नहीं चाहिए (public endpoints)

---

## 1. Register User (नया User बनाएं)

**Endpoint:** `POST /api/auth/register`

### Basic Registration (Minimum Required Fields):
```bash
curl -X POST http://103.14.120.163:8092/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Complete Registration (सभी Fields के साथ):
```bash
curl -X POST http://103.14.120.163:8092/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "role": "employee",
    "department": "Engineering",
    "designation": "Software Developer",
    "managerId": "691840843edbbd5f691ff979"
  }'
```

### Registration as Employee (Default Role):
```bash
curl -X POST http://103.14.120.163:8092/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "MyPassword123",
    "department": "Marketing",
    "designation": "Marketing Manager"
  }'
```

### Registration as Manager:
```bash
curl -X POST http://103.14.120.163:8092/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manager Name",
    "email": "manager@example.com",
    "password": "ManagerPass123",
    "role": "manager",
    "department": "Operations",
    "designation": "Operations Manager"
  }'
```

**Local Server के लिए:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123456",
    "role": "employee",
    "department": "IT",
    "designation": "Developer"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "691840843edbbd5f691ff979",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "employee",
    "department": "Engineering",
    "designation": "Software Developer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `409 Conflict`: "Email already registered" (Email पहले से registered है)
- `400 Bad Request`: Validation errors (जैसे password too short, invalid email)

**Important Notes:**
- **First User:** Database में पहला user automatically `admin` role मिलता है
- **ManagerId:** अगर manager assign नहीं करना है तो field को completely omit करें (null न भेजें)
- **Password:** Minimum 6 characters required
- **Name:** Minimum 2 characters, maximum 80 characters
- **Role:** Optional, default "employee". Values: "admin", "manager", "employee"

**Request Body Fields:**
- `name` (string, **required**): User का नाम (2-80 characters)
- `email` (string, **required**): Valid email address
- `password` (string, **required**): Password (minimum 6 characters, maximum 128)
- `role` (string, optional): "admin", "manager", या "employee" (default: "employee")
- `department` (string, optional): Department का नाम
- `designation` (string, optional): Job designation
- `managerId` (string, optional): Manager का ID (अगर manager assign करना हो)

---

## 2. Login (User Login करें)

**Endpoint:** `POST /api/auth/login`

### Basic Login:
```bash
curl -X POST http://103.14.120.163:8092/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Local Server के लिए:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "691840843edbbd5f691ff979",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "employee",
    "department": "Engineering",
    "designation": "Software Developer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized`: "Invalid credentials" (Email या password गलत है)

**Request Body Fields:**
- `email` (string, **required**): Registered email address
- `password` (string, **required**): User का password (minimum 6 characters)

---

## Complete Workflow Example (पूरा Example)

### Step 1: Register New User
```bash
curl -X POST http://103.14.120.163:8092/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "role": "employee",
    "department": "Engineering",
    "designation": "Software Developer"
  }'
```

**Response से token save करें:**
```bash
# Linux/Mac
TOKEN=$(curl -s -X POST http://103.14.120.163:8092/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }' | jq -r '.token')

echo "Token: $TOKEN"
```

**Windows PowerShell:**
```powershell
$registerResponse = Invoke-RestMethod -Uri "http://103.14.120.163:8092/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

$TOKEN = $registerResponse.token
Write-Host "Token: $TOKEN"
```

### Step 2: Login (अगर पहले से registered है)
```bash
# Linux/Mac
TOKEN=$(curl -s -X POST http://103.14.120.163:8092/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }' | jq -r '.token')

echo "Token: $TOKEN"
```

**Windows PowerShell:**
```powershell
$loginResponse = Invoke-RestMethod -Uri "http://103.14.120.163:8092/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

$TOKEN = $loginResponse.token
Write-Host "Token: $TOKEN"
```

### Step 3: Use Token for Other APIs
```bash
# Example: Get current user info
curl -X GET http://103.14.120.163:8092/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Token Extraction Examples

### Extract Token from Response (Linux/Mac):
```bash
# Register और token extract करें
TOKEN=$(curl -s -X POST http://103.14.120.163:8092/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123456"
  }' | jq -r '.token')

# Token use करें
curl -X GET http://103.14.120.163:8092/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Extract Token (Windows PowerShell):
```powershell
# Register
$response = Invoke-RestMethod -Uri "http://103.14.120.163:8092/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123456"
  }'

$TOKEN = $response.token

# Token use करें
Invoke-RestMethod -Uri "http://103.14.120.163:8092/api/auth/me" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $TOKEN" }
```

---

## Common Error Scenarios (आम Errors)

### Error 1: Email Already Registered
```json
{
  "success": false,
  "message": "Email already registered"
}
```
**Solution:** अलग email address use करें या login करें।

### Error 2: Invalid Credentials
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```
**Solution:** सही email और password check करें।

### Error 3: Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [...]
}
```
**Solution:** 
- Password minimum 6 characters होना चाहिए
- Email valid format में होना चाहिए
- Name minimum 2 characters होना चाहिए

---

## Quick Reference Table

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login user |

---

## Important Notes (महत्वपूर्ण बातें)

1. **No Authentication Required:** Register और Login APIs public हैं, token की जरूरत नहीं
2. **Token in Response:** दोनों APIs response में `token` return करती हैं
3. **First User is Admin:** Database में पहला registered user automatically admin बनता है
4. **Password Requirements:** Minimum 6 characters (maximum 128)
5. **Email Uniqueness:** हर email address unique होना चाहिए
6. **ManagerId:** अगर manager assign नहीं करना है तो field को completely omit करें

---

## Example with Real Data

### Register Example:
```bash
curl -X POST http://103.14.120.163:8092/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rajesh Kumar",
    "email": "rajesh.kumar@company.com",
    "password": "MySecurePassword123",
    "role": "employee",
    "department": "IT",
    "designation": "Senior Developer"
  }'
```

### Login Example:
```bash
curl -X POST http://103.14.120.163:8092/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rajesh.kumar@company.com",
    "password": "MySecurePassword123"
  }'
```

---

## Testing Commands (Test करने के लिए)

### Test Register:
```bash
curl -v -X POST http://103.14.120.163:8092/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "Test123456"
  }'
```

### Test Login:
```bash
curl -v -X POST http://103.14.120.163:8092/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test123456"
  }'
```

**Note:** `-v` flag verbose output देता है जो debugging के लिए helpful है।

---

## Role-Based Registration Examples

### Register as Employee (Default):
```bash
curl -X POST http://103.14.120.163:8092/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Employee Name",
    "email": "employee@example.com",
    "password": "EmployeePass123"
  }'
```

### Register as Manager:
```bash
curl -X POST http://103.14.120.163:8092/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manager Name",
    "email": "manager@example.com",
    "password": "ManagerPass123",
    "role": "manager",
    "department": "Sales",
    "designation": "Sales Manager"
  }'
```

### Register with Manager Assignment:
```bash
curl -X POST http://103.14.120.163:8092/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Employee",
    "email": "newemployee@example.com",
    "password": "NewEmpPass123",
    "role": "employee",
    "department": "Engineering",
    "designation": "Junior Developer",
    "managerId": "691840843edbbd5f691ff979"
  }'
```

**Note:** `managerId` में valid manager user ID होना चाहिए।

---

## Tips (सुझाव)

1. **Save Token:** Register/Login के बाद token को save करें, बाकी APIs के लिए जरूरी है
2. **Secure Password:** Strong password use करें (minimum 6 characters)
3. **Unique Email:** हर user के लिए unique email address use करें
4. **First User:** पहला user automatically admin बनता है
5. **ManagerId:** अगर manager assign नहीं करना है तो field को omit करें (null न भेजें)






