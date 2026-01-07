# Work Locations API Documentation

**Base URL:** `http://103.14.120.163:8092` (or your server URL)  
**Authentication:** Bearer Token (same as check-in/check-out APIs)

---

## Table of Contents

1. [Create Work Location](#1-create-work-location)
2. [Get All Work Locations](#2-get-all-work-locations)
3. [Get Work Location by ID](#3-get-work-location-by-id)
4. [Update Work Location](#4-update-work-location)
5. [Delete Work Location](#5-delete-work-location)

---

## 1. Create Work Location

**Endpoint:** `POST /api/work-locations`

**Description:** Create a new work location with name, coordinates, and radius.

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "name": "Main Office",
  "latitude": 22.3072,
  "longitude": 73.1812,
  "radius": 100.0
}
```

**Validation Rules:**
- `name`: Required, string (1-200 characters)
- `latitude`: Required, number, range: -90 to 90
- `longitude`: Required, number, range: -180 to 180
- `radius`: Required, number, range: 1 to 10000 meters

**cURL Command:**
```bash
curl -X POST http://103.14.120.163:8092/api/work-locations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Office",
    "latitude": 22.3072,
    "longitude": 73.1812,
    "radius": 100.0
  }'
```

**Success Response (201):**
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

**Error Response (400):**
```json
{
  "success": false,
  "message": "Latitude must be between -90 and 90"
}
```

**Other Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `400 Bad Request`: Validation errors

---

## 2. Get All Work Locations

**Endpoint:** `GET /api/work-locations`

**Description:** Get list of all active work locations. Optionally include inactive locations.

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `includeInactive` (optional): Set to `true` to include inactive locations (default: `false`)

**cURL Commands:**

**Get active locations only:**
```bash
curl -X GET "http://103.14.120.163:8092/api/work-locations" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get all locations (including inactive):**
```bash
curl -X GET "http://103.14.120.163:8092/api/work-locations?includeInactive=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "691860843edbbd5f691ff980",
      "name": "Main Office",
      "latitude": 22.3072,
      "longitude": 73.1812,
      "radius": 100.0,
      "createdBy": {
        "id": "691840843edbbd5f691ff979",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "691860843edbbd5f691ff981",
      "name": "Branch Office",
      "latitude": 19.0760,
      "longitude": 72.8777,
      "radius": 150.0,
      "createdBy": {
        "id": "691840843edbbd5f691ff979",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "isActive": true,
      "createdAt": "2024-01-16T09:00:00.000Z",
      "updatedAt": "2024-01-16T09:00:00.000Z"
    }
  ]
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

## 3. Get Work Location by ID

**Endpoint:** `GET /api/work-locations/{id}`

**Description:** Get specific work location details by ID.

**Authentication:** Required (Bearer Token)

**cURL Command:**
```bash
curl -X GET "http://103.14.120.163:8092/api/work-locations/691860843edbbd5f691ff980" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "691860843edbbd5f691ff980",
    "name": "Main Office",
    "latitude": 22.3072,
    "longitude": 73.1812,
    "radius": 100.0,
    "createdBy": {
      "id": "691840843edbbd5f691ff979",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid location ID
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Location not found

---

## 4. Update Work Location

**Endpoint:** `PUT /api/work-locations/{id}`

**Description:** Update work location details. All fields are optional.

**Authentication:** Required (Bearer Token)

**Request Body (all fields optional):**
```json
{
  "name": "Updated Office Name",
  "latitude": 22.3075,
  "longitude": 73.1815,
  "radius": 150.0,
  "isActive": true
}
```

**cURL Command:**
```bash
curl -X PUT "http://103.14.120.163:8092/api/work-locations/691860843edbbd5f691ff980" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Office Name",
    "radius": 150.0
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "id": "691860843edbbd5f691ff980",
    "name": "Updated Office Name",
    "latitude": 22.3072,
    "longitude": 73.1812,
    "radius": 150.0,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid location ID or validation error
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Location not found

---

## 5. Delete Work Location

**Endpoint:** `DELETE /api/work-locations/{id}`

**Description:** Soft delete work location (sets `isActive` to `false`).

**Authentication:** Required (Bearer Token)

**cURL Command:**
```bash
curl -X DELETE "http://103.14.120.163:8092/api/work-locations/691860843edbbd5f691ff980" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Location deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid location ID
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Location not found

**Note:** This is a soft delete. The location is marked as inactive (`isActive: false`) but not removed from the database. To see inactive locations, use `GET /api/work-locations?includeInactive=true`.

---

## Complete Example Workflow

### 1. Login and Get Token
```bash
TOKEN=$(curl -s -X POST http://103.14.120.163:8092/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  | jq -r '.token')
```

### 2. Create Work Location
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

### 3. Get All Locations
```bash
curl -X GET "http://103.14.120.163:8092/api/work-locations" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Update Location
```bash
curl -X PUT "http://103.14.120.163:8092/api/work-locations/LOCATION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "radius": 150.0
  }'
```

### 5. Delete Location
```bash
curl -X DELETE "http://103.14.120.163:8092/api/work-locations/LOCATION_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Validation Error Messages

| Field | Error Message |
|-------|---------------|
| `name` | "Name is required" |
| `latitude` | "Latitude must be between -90 and 90" |
| `longitude` | "Longitude must be between -180 and 180" |
| `radius` | "Radius must be between 1 and 10000 meters" |

---

## Database Schema

The work location is stored in MongoDB with the following structure:

```typescript
{
  _id: ObjectId,
  name: String (required, indexed),
  latitude: Number (required, -90 to 90),
  longitude: Number (required, -180 to 180),
  radius: Number (required, 1 to 10000),
  createdBy: ObjectId (ref: User, optional, indexed),
  isActive: Boolean (default: true, indexed),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Notes

- All endpoints require authentication (Bearer Token)
- Location coordinates use decimal degrees (WGS84)
- Radius is in meters
- Delete operation is soft delete (sets `isActive = false`)
- Created by field is automatically set to the authenticated user
- All timestamps are in ISO 8601 format (UTC)

---

**Last Updated:** January 2024

