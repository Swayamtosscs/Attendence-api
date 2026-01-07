# Attendance API - Complete Documentation

**Base URL:** `http://103.14.120.163`  
**Authentication:** Bearer Token (JWT) or Cookie

---

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Check-In & Check-Out APIs](#check-in--check-out-apis)
3. [Attendance Management APIs](#attendance-management-apis)
4. [User Management APIs](#user-management-apis)
5. [Leave Management APIs](#leave-management-apis)
6. [Profile Picture APIs](#profile-picture-apis)

---

## Authentication APIs

### 1. Register User

**Endpoint:** `POST /api/auth/register`

**Description:** Register a new user. First user automatically becomes admin.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "employee",
  "department": "Engineering",
  "designation": "Software Developer"
}
```

**cURL Command:**
```bash
curl -X POST http://103.14.120.163/api/auth/register \
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

**Note:** Do NOT include `managerId: null` - omit the field entirely if not needed.

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
  }
}
```

---

### 2. Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**cURL Command:**
```bash
curl -X POST http://103.14.120.163/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
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

---

### 3. Get Current User

**Endpoint:** `GET /api/auth/me`

**Description:** Get authenticated user's profile.

**cURL Command:**
```bash
curl -X GET http://103.14.120.163/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
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
    "designation": "Software Developer",
    "status": "active",
    "profilePicture": "/assets/profiles/profile-691840843edbbd5f691ff979.jpg",
    "lastLoginAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Logout user (clears auth cookie).

**cURL Command:**
```bash
curl -X POST http://103.14.120.163/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true
}
```

---

## Check-In & Check-Out APIs

### 1. Check-In

**Endpoint:** `POST /api/attendance/check-in`

**Description:** Record employee check-in for the current day.

**Request Body:**
```json
{
  "notes": "Working from office",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "deviceInfo": "iPhone 14 Pro"
}
```

**All fields are optional:**
```json
{
  "notes": "Optional note"
}
```

**cURL Command:**
```bash
curl -X POST http://103.14.120.163/api/attendance/check-in \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Working from office",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "deviceInfo": "iPhone 14 Pro"
  }'
```

**Minimal Request:**
```bash
curl -X POST http://103.14.120.163/api/attendance/check-in \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
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
- `409 Conflict`: "Already checked in for today"
- `401 Unauthorized`: "Unauthorized"

---

### 2. Check-Out

**Endpoint:** `POST /api/attendance/check-out`

**Description:** Record employee check-out for the current day.

**Request Body:**
```json
{
  "notes": "Completed all tasks"
}
```

**Notes field is optional:**
```json
{}
```

**cURL Command:**
```bash
curl -X POST http://103.14.120.163/api/attendance/check-out \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Completed all tasks"
  }'
```

**Minimal Request:**
```bash
curl -X POST http://103.14.120.163/api/attendance/check-out \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
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
- `404 Not Found`: "No check-in found for today"
- `409 Conflict`: "Already checked out for today"
- `401 Unauthorized`: "Unauthorized"

---

## Attendance Management APIs

### 1. List Attendance Records

**Endpoint:** `GET /api/attendance`

**Description:** Get attendance records with optional filters.

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `startDate` (optional): ISO datetime string
- `endDate` (optional): ISO datetime string
- `status` (optional): `present`, `absent`, `half-day`, `on-leave`

**cURL Commands:**

**Get all attendance (role-based):**
```bash
curl -X GET "http://103.14.120.163/api/attendance" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Filter by user:**
```bash
curl -X GET "http://103.14.120.163/api/attendance?userId=691840843edbbd5f691ff979" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Filter by date range:**
```bash
curl -X GET "http://103.14.120.163/api/attendance?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Filter by status:**
```bash
curl -X GET "http://103.14.120.163/api/attendance?status=present" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Combined filters:**
```bash
curl -X GET "http://103.14.120.163/api/attendance?userId=691840843edbbd5f691ff979&startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z&status=present" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "691860843edbbd5f691ff980",
      "user": {
        "id": "691840843edbbd5f691ff979",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "employee",
        "department": "Engineering",
        "designation": "Software Developer"
      },
      "date": "2024-01-15T00:00:00.000Z",
      "checkInAt": "2024-01-15T09:00:00.000Z",
      "checkOutAt": "2024-01-15T18:00:00.000Z",
      "workDurationMinutes": 540,
      "status": "present",
      "notes": "Working from office",
      "lateByMinutes": 0
    }
  ]
}
```

**Permissions:**
- **Employee**: Can only see their own records
- **Manager**: Can see their own + team members' records
- **Admin**: Can see all records

---

### 2. Create Manual Attendance Entry

**Endpoint:** `POST /api/attendance`

**Description:** Create or update attendance record manually (Admin/Manager only).

**Request Body:**
```json
{
  "userId": "691840843edbbd5f691ff979",
  "date": "2024-01-15T00:00:00.000Z",
  "checkInAt": "2024-01-15T09:00:00.000Z",
  "checkOutAt": "2024-01-15T18:00:00.000Z",
  "status": "present",
  "notes": "Manual entry"
}
```

**cURL Command:**
```bash
curl -X POST http://103.14.120.163/api/attendance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "691840843edbbd5f691ff979",
    "date": "2024-01-15T00:00:00.000Z",
    "checkInAt": "2024-01-15T09:00:00.000Z",
    "checkOutAt": "2024-01-15T18:00:00.000Z",
    "status": "present",
    "notes": "Manual entry"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "691860843edbbd5f691ff980",
    "user": "691840843edbbd5f691ff979",
    "date": "2024-01-15T00:00:00.000Z",
    "checkInAt": "2024-01-15T09:00:00.000Z",
    "checkOutAt": "2024-01-15T18:00:00.000Z",
    "status": "present",
    "notes": "Manual entry"
  }
}
```

**Required Role:** `admin` or `manager`

---

### 3. Get Attendance Record by ID

**Endpoint:** `GET /api/attendance/{id}`

**Description:** Get specific attendance record.

**cURL Command:**
```bash
curl -X GET http://103.14.120.163/api/attendance/691860843edbbd5f691ff980 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "691860843edbbd5f691ff980",
    "user": {
      "id": "691840843edbbd5f691ff979",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "employee"
    },
    "date": "2024-01-15T00:00:00.000Z",
    "checkInAt": "2024-01-15T09:00:00.000Z",
    "checkOutAt": "2024-01-15T18:00:00.000Z",
    "workDurationMinutes": 540,
    "status": "present",
    "notes": "Working from office",
    "lateByMinutes": 0
  }
}
```

---

### 4. Update Attendance Record

**Endpoint:** `PATCH /api/attendance/{id}`

**Description:** Update attendance record (permission-based).

**Request Body (all fields optional):**
```json
{
  "date": "2024-01-15T00:00:00.000Z",
  "checkInAt": "2024-01-15T09:30:00.000Z",
  "checkOutAt": "2024-01-15T18:30:00.000Z",
  "status": "half-day",
  "notes": "Updated notes"
}
```

**cURL Command:**
```bash
curl -X PATCH http://103.14.120.163/api/attendance/691860843edbbd5f691ff980 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "half-day",
    "notes": "Updated notes"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "691860843edbbd5f691ff980",
    "date": "2024-01-15T00:00:00.000Z",
    "checkInAt": "2024-01-15T09:30:00.000Z",
    "checkOutAt": "2024-01-15T18:30:00.000Z",
    "status": "half-day",
    "notes": "Updated notes"
  }
}
```

**Permissions:**
- **Employee**: Can only update their own records
- **Manager**: Can update their own + team members' records
- **Admin**: Can update all records

---

### 5. Delete Attendance Record

**Endpoint:** `DELETE /api/attendance/{id}`

**Description:** Delete attendance record (Admin/Manager only).

**cURL Command:**
```bash
curl -X DELETE http://103.14.120.163/api/attendance/691860843edbbd5f691ff980 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true
}
```

**Required Role:** `admin` or `manager`

---

### 6. Get Attendance Summary

**Endpoint:** `GET /api/attendance/summary`

**Description:** Get aggregated attendance statistics.

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `startDate` (optional): ISO datetime string
- `endDate` (optional): ISO datetime string

**cURL Commands:**

**Get summary for all users (role-based):**
```bash
curl -X GET "http://103.14.120.163/api/attendance/summary" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get summary for specific user:**
```bash
curl -X GET "http://103.14.120.163/api/attendance/summary?userId=691840843edbbd5f691ff979" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get summary for date range:**
```bash
curl -X GET "http://103.14.120.163/api/attendance/summary?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "user": {
        "id": "691840843edbbd5f691ff979",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "employee",
        "department": "Engineering"
      },
      "presentDays": 20,
      "absentDays": 2,
      "halfDays": 1,
      "onLeaveDays": 3,
      "totalMinutes": 10800
    }
  ]
}
```

**Permissions:**
- **Employee**: Can only see their own summary
- **Manager**: Can see their own + team members' summary
- **Admin**: Can see all summaries

---

## User Management APIs

### 1. List Users

**Endpoint:** `GET /api/users`

**Description:** Get list of users (Admin/Manager only).

**cURL Command:**
```bash
curl -X GET http://103.14.120.163/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "691840843edbbd5f691ff979",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "employee",
      "department": "Engineering",
      "designation": "Software Developer",
      "status": "active",
      "manager": "691840843edbbd5f691ff978",
      "profilePicture": "/assets/profiles/profile-691840843edbbd5f691ff979.jpg",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Permissions:**
- **Admin**: Sees all users
- **Manager**: Sees only their team members

---

### 2. Create User

**Endpoint:** `POST /api/users`

**Description:** Create new user (Admin/Manager only).

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass123",
  "role": "employee",
  "department": "Engineering",
  "designation": "Senior Developer",
  "managerId": "691840843edbbd5f691ff978"
}
```

**cURL Command:**
```bash
curl -X POST http://103.14.120.163/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "SecurePass123",
    "role": "employee",
    "department": "Engineering",
    "designation": "Senior Developer",
    "managerId": "691840843edbbd5f691ff978"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "691840843edbbd5f691ff980",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "employee",
    "department": "Engineering",
    "designation": "Senior Developer",
    "manager": "691840843edbbd5f691ff978"
  }
}
```

**Required Role:** `admin` or `manager`

---

### 3. Get User by ID

**Endpoint:** `GET /api/users/{id}`

**Description:** Get specific user details.

**cURL Command:**
```bash
curl -X GET http://103.14.120.163/api/users/691840843edbbd5f691ff979 \
  -H "Authorization: Bearer YOUR_TOKEN"
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
    "designation": "Software Developer",
    "status": "active",
    "manager": "691840843edbbd5f691ff978",
    "profilePicture": "/assets/profiles/profile-691840843edbbd5f691ff979.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Update User

**Endpoint:** `PATCH /api/users/{id}`

**Description:** Update user details (permission-based).

**Request Body (all fields optional):**
```json
{
  "name": "John Updated",
  "role": "manager",
  "department": "Product",
  "designation": "Product Manager",
  "status": "active",
  "managerId": "691840843edbbd5f691ff977"
}
```

**cURL Command:**
```bash
curl -X PATCH http://103.14.120.163/api/users/691840843edbbd5f691ff979 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "department": "Product"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "691840843edbbd5f691ff979",
    "name": "John Updated",
    "email": "john@example.com",
    "role": "employee",
    "department": "Product",
    "designation": "Software Developer",
    "status": "active",
    "manager": "691840843edbbd5f691ff978",
    "profilePicture": "/assets/profiles/profile-691840843edbbd5f691ff979.jpg"
  }
}
```

**Permissions:**
- Users can update their own basic info (name, department, designation)
- Admin/Manager can update role, status, managerId

---

### 5. Delete User

**Endpoint:** `DELETE /api/users/{id}`

**Description:** Delete user (Admin only).

**cURL Command:**
```bash
curl -X DELETE http://103.14.120.163/api/users/691840843edbbd5f691ff979 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true
}
```

**Required Role:** `admin`

---

## Leave Management APIs

### 1. List Leave Requests

**Endpoint:** `GET /api/leave`

**Description:** Get list of leave requests (role-based).

**cURL Command:**
```bash
curl -X GET http://103.14.120.163/api/leave \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "691860843edbbd5f691ff981",
      "user": {
        "id": "691840843edbbd5f691ff979",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "employee",
        "department": "Engineering"
      },
      "manager": {
        "id": "691840843edbbd5f691ff978",
        "name": "Manager Name",
        "email": "manager@example.com",
        "role": "manager"
      },
      "startDate": "2024-01-20T00:00:00.000Z",
      "endDate": "2024-01-22T00:00:00.000Z",
      "type": "casual",
      "status": "pending",
      "reason": "Family vacation",
      "reply": null,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Permissions:**
- **Employee**: Sees only their own leave requests
- **Manager**: Sees their own + team members' leave requests
- **Admin**: Sees all leave requests

---

### 2. Create Leave Request

**Endpoint:** `POST /api/leave`

**Description:** Submit a new leave request.

**Request Body:**
```json
{
  "startDate": "2024-01-20T00:00:00.000Z",
  "endDate": "2024-01-22T00:00:00.000Z",
  "type": "casual",
  "reason": "Family vacation"
}
```

**Leave Types:** `sick`, `casual`, `earned`, `unpaid`, `other`

**cURL Command:**
```bash
curl -X POST http://103.14.120.163/api/leave \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-20T00:00:00.000Z",
    "endDate": "2024-01-22T00:00:00.000Z",
    "type": "casual",
    "reason": "Family vacation"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "691860843edbbd5f691ff981",
    "startDate": "2024-01-20T00:00:00.000Z",
    "endDate": "2024-01-22T00:00:00.000Z",
    "type": "casual",
    "status": "pending"
  }
}
```

---

### 3. Get Leave Request by ID

**Endpoint:** `GET /api/leave/{id}`

**Description:** Get specific leave request details.

**cURL Command:**
```bash
curl -X GET http://103.14.120.163/api/leave/691860843edbbd5f691ff981 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "691860843edbbd5f691ff981",
    "user": {
      "id": "691840843edbbd5f691ff979",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "employee",
      "manager": "691840843edbbd5f691ff978"
    },
    "manager": {
      "id": "691840843edbbd5f691ff978",
      "name": "Manager Name",
      "email": "manager@example.com",
      "role": "manager"
    },
    "startDate": "2024-01-20T00:00:00.000Z",
    "endDate": "2024-01-22T00:00:00.000Z",
    "type": "casual",
    "status": "pending",
    "reason": "Family vacation",
    "reply": null,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 4. Approve/Reject Leave Request

**Endpoint:** `PATCH /api/leave/{id}`

**Description:** Approve or reject leave request (Admin/Manager only).

**Request Body:**
```json
{
  "status": "approved",
  "reply": "Approved. Enjoy your vacation!"
}
```

**cURL Command (Approve):**
```bash
curl -X PATCH http://103.14.120.163/api/leave/691860843edbbd5f691ff981 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "reply": "Approved. Enjoy your vacation!"
  }'
```

**cURL Command (Reject):**
```bash
curl -X PATCH http://103.14.120.163/api/leave/691860843edbbd5f691ff981 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "reply": "Cannot approve due to project deadline."
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "691860843edbbd5f691ff981",
    "status": "approved",
    "reply": "Approved. Enjoy your vacation!"
  }
}
```

**Required Role:** `admin` or `manager`

---

### 5. Delete Leave Request

**Endpoint:** `DELETE /api/leave/{id}`

**Description:** Delete leave request (Admin/Manager only).

**cURL Command:**
```bash
curl -X DELETE http://103.14.120.163/api/leave/691860843edbbd5f691ff981 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true
}
```

**Required Role:** `admin` or `manager`

---

## Profile Picture APIs

### 1. Upload Profile Picture

**Endpoint:** `POST /api/users/me/avatar`

**Description:** Upload or update current user's profile picture.

**Request:** Multipart form data with file

**cURL Command:**
```bash
curl -X POST http://103.14.120.163/api/users/me/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/image.jpg"
```

**Windows PowerShell:**
```powershell
curl -X POST http://103.14.120.163/api/users/me/avatar `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -F "file=@C:\path\to\your\image.jpg"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "691840843edbbd5f691ff979",
    "profilePicture": "/assets/profiles/profile-691840843edbbd5f691ff979-1763464446716.jpg",
    "message": "Profile picture uploaded successfully"
  }
}
```

**File Requirements:**
- Supported formats: JPEG, JPG, PNG, WebP
- Max size: 5MB
- Image will be automatically resized and optimized

---

### 2. Delete Profile Picture

**Endpoint:** `DELETE /api/users/me/avatar`

**Description:** Delete current user's profile picture.

**cURL Command:**
```bash
curl -X DELETE http://103.14.120.163/api/users/me/avatar \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "691840843edbbd5f691ff979",
    "message": "Profile picture deleted successfully"
  }
}
```

---

## Error Responses

All APIs return errors in the following format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

---

## Authentication

### Using Bearer Token

Include the JWT token in the Authorization header:
```bash
-H "Authorization: Bearer YOUR_TOKEN"
```

### Using Cookie

The API also supports cookie-based authentication. After login, the `attendance_token` cookie is automatically set.

---

## Quick Reference

### Check-In/Check-Out Flow

1. **Login:**
```bash
curl -X POST http://103.14.120.163/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

2. **Check-In:**
```bash
curl -X POST http://103.14.120.163/api/attendance/check-in \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Starting work"}'
```

3. **Check-Out:**
```bash
curl -X POST http://103.14.120.163/api/attendance/check-out \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Work completed"}'
```

4. **View Today's Attendance:**
```bash
curl -X GET "http://103.14.120.163/api/attendance" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

- All datetime fields use ISO 8601 format
- JWT tokens expire after 7 days
- Date filters use UTC timezone
- Employee role can only access their own data
- Manager role can access their own + team members' data
- Admin role has full access to all data

---

**Last Updated:** January 2024

