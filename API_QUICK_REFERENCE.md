# API Quick Reference Card

**Base URL:** `http://103.14.120.163`

---

## 🔐 Authentication

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login & get token |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/auth/logout` | ✅ | Logout |

---

## ⏰ Check-In & Check-Out

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/attendance/check-in` | ✅ | Check-in for today |
| POST | `/api/attendance/check-out` | ✅ | Check-out for today |

### Check-In Request
```json
{
  "notes": "Optional note",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "deviceInfo": "iPhone 14"
}
```

### Check-Out Request
```json
{
  "notes": "Optional note"
}
```

### Quick cURL Examples

**Check-In:**
```bash
curl -X POST http://103.14.120.163/api/attendance/check-in \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Starting work"}'
```

**Check-Out:**
```bash
curl -X POST http://103.14.120.163/api/attendance/check-out \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Work completed"}'
```

---

## 📊 Attendance Management

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/api/attendance` | ✅ | All | List attendance records |
| POST | `/api/attendance` | ✅ | Admin/Manager | Create manual entry |
| GET | `/api/attendance/{id}` | ✅ | All | Get specific record |
| PATCH | `/api/attendance/{id}` | ✅ | All* | Update record |
| DELETE | `/api/attendance/{id}` | ✅ | Admin/Manager | Delete record |
| GET | `/api/attendance/summary` | ✅ | All | Get statistics |

*Permission-based: Employee can only update own records

### Query Parameters (GET /api/attendance)
- `userId` - Filter by user ID
- `startDate` - ISO datetime
- `endDate` - ISO datetime
- `status` - `present`, `absent`, `half-day`, `on-leave`

---

## 👥 User Management

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/api/users` | ✅ | Admin/Manager | List users |
| POST | `/api/users` | ✅ | Admin/Manager | Create user |
| GET | `/api/users/{id}` | ✅ | All* | Get user details |
| PATCH | `/api/users/{id}` | ✅ | All* | Update user |
| DELETE | `/api/users/{id}` | ✅ | Admin | Delete user |

*Permission-based access

---

## 🏖️ Leave Management

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/api/leave` | ✅ | All | List leave requests |
| POST | `/api/leave` | ✅ | All | Create leave request |
| GET | `/api/leave/{id}` | ✅ | All* | Get leave request |
| PATCH | `/api/leave/{id}` | ✅ | Admin/Manager | Approve/Reject |
| DELETE | `/api/leave/{id}` | ✅ | Admin/Manager | Delete request |

*Permission-based access

### Leave Request Body
```json
{
  "startDate": "2024-01-20T00:00:00.000Z",
  "endDate": "2024-01-22T00:00:00.000Z",
  "type": "casual",
  "reason": "Family vacation"
}
```

**Leave Types:** `sick`, `casual`, `earned`, `unpaid`, `other`

---

## 📸 Profile Picture

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/users/me/avatar` | ✅ | Upload profile picture |
| DELETE | `/api/users/me/avatar` | ✅ | Delete profile picture |

### Upload Avatar
```bash
curl -X POST http://103.14.120.163/api/users/me/avatar \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/image.jpg"
```

**File Requirements:**
- Formats: JPEG, JPG, PNG, WebP
- Max Size: 5MB

---

## 🔑 Common Headers

```bash
-H "Authorization: Bearer YOUR_TOKEN"
-H "Content-Type: application/json"
```

---

## 📝 Common Request Bodies

### Register User
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "employee",
  "department": "Engineering",
  "designation": "Developer"
}
```
**Note:** Omit `managerId` if not needed (don't send `null`)

### Login
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Manual Attendance Entry
```json
{
  "userId": "USER_ID",
  "date": "2024-01-15T00:00:00.000Z",
  "checkInAt": "2024-01-15T09:00:00.000Z",
  "checkOutAt": "2024-01-15T18:00:00.000Z",
  "status": "present",
  "notes": "Manual entry"
}
```

---

## 🚨 Common Error Codes

| Code | Meaning | Solution |
|------|---------|-----------|
| 400 | Bad Request | Check request body format |
| 401 | Unauthorized | Include valid Bearer token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry (e.g., already checked in) |

---

## 🎯 Role Permissions

| Action | Employee | Manager | Admin |
|--------|----------|---------|-------|
| View own data | ✅ | ✅ | ✅ |
| View team data | ❌ | ✅ | ✅ |
| View all data | ❌ | ❌ | ✅ |
| Create users | ❌ | ✅* | ✅ |
| Delete users | ❌ | ❌ | ✅ |
| Manual attendance | ❌ | ✅* | ✅ |
| Approve leave | ❌ | ✅* | ✅ |

*Limited to their team members

---

## 🔄 Typical Workflow

1. **Register/Login** → Get JWT token
2. **Check-In** → Start work day
3. **Check-Out** → End work day
4. **View Attendance** → Check records
5. **Request Leave** → Submit leave request
6. **Upload Avatar** → Update profile picture

---

## 📅 Date Format

All dates use **ISO 8601** format:
```
2024-01-15T09:00:00.000Z
```

---

## 🔐 Token Usage

After login, you'll receive a token:
```json
{
  "success": true,
  "data": {...},
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Use this token in all subsequent requests:
```bash
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Token expires after 7 days**

---

## 📞 Quick Test Sequence

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://103.14.120.163/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.token')

# 2. Check-In
curl -X POST http://103.14.120.163/api/attendance/check-in \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Starting work"}'

# 3. Check-Out
curl -X POST http://103.14.120.163/api/attendance/check-out \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Work completed"}'

# 4. View Attendance
curl -X GET "http://103.14.120.163/api/attendance" \
  -H "Authorization: Bearer $TOKEN"
```

---

**For detailed documentation, see `API_DOCUMENTATION.md`**

