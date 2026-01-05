# 🔌 RentVerse API Documentation

<p align="center"><i>Complete API Reference for RentVerse Backend Services</i></p>

---

## 📋 Table of Contents

1. [Base URL & Authentication](#-base-url--authentication)
2. [Authentication Endpoints](#-authentication-endpoints)
3. [User Endpoints](#-user-endpoints)
4. [Property Endpoints](#-property-endpoints)
5. [Booking Endpoints](#-booking-endpoints)
6. [Admin Endpoints](#-admin-endpoints)
7. [Error Responses](#-error-responses)
8. [Rate Limiting](#-rate-limiting)

---

## 🌐 Base URL & Authentication

### Base URLs

| Environment | URL |
|-------------|-----|
| **Production** | `https://rentverse-backend-production.up.railway.app` |
| **Development** | `http://localhost:3000` |
| **API Docs** | `{BASE_URL}/docs` (Swagger UI) |

### Authentication

RentVerse uses **JWT (JSON Web Tokens)** for authentication.

**Header Format:**
```
Authorization: Bearer <your-jwt-token>
```

**Token Acquisition:**
1. Call `POST /api/auth/login` with credentials
2. Receive OTP via email
3. Call `POST /api/auth/verify-otp` with OTP
4. Receive JWT token in response

---

## 🔐 Authentication Endpoints

### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "userId": "uuid-here",
    "email": "user@example.com"
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | Email already registered |
| 400 | Invalid email format |
| 400 | Password too short (min 6 chars) |

---

### POST /api/auth/login

Initiate login process (sends OTP to email).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "otpRequired": true,
  "expiresAt": "2025-12-17T19:30:00.000Z"
}
```

**Errors:**
| Code | Message |
|------|---------|
| 401 | Invalid credentials |
| 423 | Account locked. Try again in 15 minutes |
| 429 | Too many login attempts |

---

### POST /api/auth/verify-otp

Verify OTP and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER"
  },
  "expiresAt": "2025-12-17T20:30:00.000Z"
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | Invalid OTP |
| 400 | OTP expired |
| 423 | Account locked |

---

### POST /api/auth/forgot-password

Request password reset OTP.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset OTP sent to your email"
}
```

---

### POST /api/auth/reset-password

Reset password with OTP.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newsecurepassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

### POST /api/auth/logout

Invalidate current JWT token.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 👤 User Endpoints

### GET /api/users/me

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "phone": "+60123456789",
    "mfaEnabled": false,
    "createdAt": "2025-12-01T00:00:00.000Z"
  }
}
```

---

### PUT /api/users/me

Update current user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+60123456789"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

---

### POST /api/users/change-password

Change user password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newsecurepassword123"
}
```

---

## 🏠 Property Endpoints

### GET /api/properties

List all properties with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by title or location |
| `type` | string | Property type ID |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `bedrooms` | number | Number of bedrooms |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |

**Example:** `GET /api/properties?search=Kuala%20Lumpur&minPrice=1000&maxPrice=3000`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "property-uuid",
      "title": "Modern Apartment in KL",
      "description": "Beautiful 2-bedroom apartment...",
      "price": 2500,
      "latitude": 3.1390,
      "longitude": 101.6869,
      "propertyType": { "id": "...", "name": "Apartment" },
      "amenities": [
        { "id": "...", "name": "WiFi" },
        { "id": "...", "name": "Parking" }
      ],
      "images": ["https://cloudinary.com/..."],
      "owner": {
        "id": "owner-uuid",
        "firstName": "Jane",
        "lastName": "Doe"
      },
      "createdAt": "2025-12-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### GET /api/properties/:id

Get property details by ID.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "property-uuid",
    "title": "Modern Apartment in KL",
    "description": "Beautiful 2-bedroom apartment with city view...",
    "price": 2500,
    "latitude": 3.1390,
    "longitude": 101.6869,
    "address": "123 Jalan Bukit Bintang",
    "bedrooms": 2,
    "bathrooms": 2,
    "propertyType": { "id": "...", "name": "Apartment" },
    "amenities": [...],
    "images": [...],
    "owner": {...},
    "createdAt": "2025-12-01T00:00:00.000Z"
  }
}
```

---

### POST /api/properties

Create a new property listing (Landlord only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Modern Apartment in KL",
  "description": "Beautiful 2-bedroom apartment...",
  "price": 2500,
  "latitude": 3.1390,
  "longitude": 101.6869,
  "address": "123 Jalan Bukit Bintang",
  "bedrooms": 2,
  "bathrooms": 2,
  "propertyTypeId": "property-type-uuid",
  "amenityIds": ["amenity-uuid-1", "amenity-uuid-2"],
  "images": ["base64-or-url-1", "base64-or-url-2"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Property created successfully",
  "data": { ... }
}
```

---

### PUT /api/properties/:id

Update property (Owner only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as POST, with fields to update.

---

### DELETE /api/properties/:id

Delete property (Owner only).

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Property deleted successfully"
}
```

---

## 📅 Booking Endpoints

### POST /api/bookings

Create a new booking.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "propertyId": "property-uuid",
  "startDate": "2025-12-20",
  "endDate": "2026-12-20",
  "rentAmount": 2500,
  "guests": 2,
  "specialRequests": "Early check-in if possible"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "booking-uuid",
    "status": "APPROVED",
    "lease": {
      "id": "lease-uuid",
      "rentalAgreement": {
        "pdfUrl": "https://cloudinary.com/...",
        "digitalSignature": "sha256-hash-here"
      }
    }
  }
}
```

---

### GET /api/bookings/my-bookings

Get current user's bookings.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "booking-uuid",
      "property": { "id": "...", "title": "..." },
      "startDate": "2025-12-20",
      "endDate": "2026-12-20",
      "rentAmount": 2500,
      "status": "APPROVED",
      "createdAt": "2025-12-17T00:00:00.000Z"
    }
  ]
}
```

---

### GET /api/bookings/owner-bookings

Get bookings for landlord's properties.

**Headers:** `Authorization: Bearer <token>` (Landlord role required)

---

### GET /api/bookings/:id/rental-agreement/download

Download rental agreement PDF.

**Headers:** `Authorization: Bearer <token>`

**Response:** PDF file download

---

## 👑 Admin Endpoints

> All admin endpoints require `ADMIN` role.

### GET /api/bookings

Get all bookings (Admin only).

**Headers:** `Authorization: Bearer <token>`

---

### GET /api/admin/users

Get all users.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "mfaEnabled": false,
      "createdAt": "2025-12-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET /api/admin/security/anomalies

Get unresolved security anomalies.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "anomaly-uuid",
      "type": "MULTIPLE_FAILED_LOGINS",
      "severity": "HIGH",
      "description": "User has 5 failed login attempts...",
      "userId": "user-uuid",
      "ipAddress": "192.168.1.1",
      "resolved": false,
      "createdAt": "2025-12-17T00:00:00.000Z"
    }
  ]
}
```

---

### PATCH /api/admin/security/anomalies/:id/resolve

Resolve a security anomaly.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Anomaly resolved successfully"
}
```

---

### GET /api/auth/activity-logs

Get activity logs (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | Filter by user ID |
| `action` | string | Filter by action type |
| `startDate` | date | Start date filter |
| `endDate` | date | End date filter |

---

## ❌ Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "timestamp": "2025-12-17T00:00:00.000Z"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 423 | Locked (account locked) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## ⏱️ Rate Limiting

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702857600
```

### Rate Limits by Endpoint

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| General API | 100 requests | 15 min |
| Login | 5 attempts | 15 min |
| Registration | 3 attempts | 1 hour |
| OTP | 3 requests | 10 min |
| Admin | 50 requests | 15 min |
| Upload | 10 uploads | 1 hour |
| Search | 200 requests | 15 min |
| Password Reset | 3 requests | 1 hour |

### Rate Limited Response

```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later.",
  "retryAfter": "15 minutes",
  "timestamp": "2025-12-17T00:00:00.000Z"
}
```

---

<div align="center">
  <p><i>For interactive API testing, visit the Swagger UI at /docs</i></p>
  <p><i>© 2025 Team VECNA - RentVerse Platform</i></p>
</div>
