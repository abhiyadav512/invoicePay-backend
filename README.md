# Complete API Documentation

## Table of Contents

- [Authentication](#authentication)
- [Auth API Endpoints](#auth-api-endpoints)
- [Business API Endpoints](#business-api-endpoints)
- [Invoice API Endpoints](#invoice-api-endpoints)
- [Dashboard API Endpoints](#dashboard-api-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

All protected endpoints require authentication via a secure HTTP-only cookie named `token` that is set during the login process. The cookie is automatically included in requests to the same domain.

**Protected Endpoints:** All endpoints except `/register`, `/login`, and `/verify-otp` require authentication.

---

## Auth API Endpoints

### POST `/register`

**Description:** Registers a new user or resends OTP if the email exists but is not verified.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "your_password",
  "location": "City",
  "dob": "1990-01-01",
  "number": "1234567890"
}
```

**Response Codes:**

- `200 OK` – OTP sent to email successfully
- `409 Conflict` – Email already verified
- `429 Too Many Requests` – OTP requested too frequently

---

### POST `/login`

**Description:** Authenticates a user with email and password credentials.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "your_password"
}
```

**Response Codes:**

- `200 OK` – Login successful; sets secure HTTP-only `token` cookie
- `401 Unauthorized` – Invalid email or password
- `403 Forbidden` – Email address not verified
- `429 Too Many Requests` – Rate limit exceeded (max 5 attempts per 15 minutes per IP)

---

### POST `/verify-otp`

**Description:** Verifies the OTP code sent to the user's email address.

**Request Body:**

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response Codes:**

- `200 OK` – OTP verified successfully
- `400 Bad Request` – Invalid or expired OTP
- `429 Too Many Requests` – Too many verification attempts

---

### GET `/me`

**Description:** Returns the authenticated user's profile information.

**Headers:** Requires `token` cookie (set automatically after login)

**Success Response (200):**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### POST `/logout`

**Description:** Logs out the user by clearing the authentication cookie.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Business API Endpoints

### GET `/api/business/`

**Description:** Retrieves the business profile for the authenticated user.

**Headers:** Requires authentication (`token` cookie)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Business profile retrieved successfully.",
  "data": {
    "id": "business_id",
    "name": "Business Name",
    "description": "Business description",
    "website": "https://example.com",
    "phone": "+1234567890",
    "email": "business@example.com",
    "address": "123 Business St",
    "city": "Business City",
    "state": "Business State",
    "country": "India",
    "postalCode": "12345",
    "businessType": "Technology",
    "taxId": "TAX123456",
    "logo": "logo_url",
    "defaultCurrency": "INR",
    "timezone": "Asia/Kolkata",
    "ownerId": "user_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Business profile not found. Please complete your business setup.",
  "data": null
}
```

---

### POST `/api/business/setup`

**Description:** Creates a new business profile for the authenticated user.

**Headers:**

- Requires authentication (`token` cookie)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "name": "Business Name", // Required
  "email": "business@example.com", // Required
  "description": "Business description",
  "website": "https://example.com",
  "phone": "+1234567890",
  "address": "123 Business St",
  "city": "Business City",
  "state": "Business State",
  "country": "Country Name", // Default: "India"
  "postalCode": "12345",
  "businessType": "Technology",
  "taxId": "TAX123456",
  "logo": "logo_url",
  "defaultCurrency": "USD", // Default: "INR"
  "timezone": "America/New_York" // Default: "Asia/Kolkata"
}
```

**Required Fields:**

- `name` - Business name
- `email` - Business email address

**Success Response (201):**

```json
{
  "success": true,
  "message": "Business profile created successfully.",
  "data": {
    "id": "business_id",
    "name": "Business Name",
    "email": "business@example.com"
    // ... other business fields
  }
}
```

**Error Responses:**

- `400 Bad Request` – Missing required fields (name and email)
- `400 Bad Request` – Business profile already exists
- `400 Bad Request` – Duplicate business information

---

### PATCH `/api/business/update`

**Description:** Updates an existing business profile for the authenticated user.

**Headers:**

- Requires authentication (`token` cookie)
- `Content-Type: application/json`

**Request Body:** (All fields optional - only include fields to update)

```json
{
  "name": "Updated Business Name",
  "description": "Updated description",
  "website": "https://newwebsite.com",
  "phone": "+0987654321",
  "email": "updated@example.com",
  "address": "456 New Address",
  "city": "New City",
  "state": "New State",
  "country": "New Country",
  "postalCode": "54321",
  "businessType": "Updated Type",
  "taxId": "NEWTAX123",
  "logo": "new_logo_url",
  "defaultCurrency": "USD",
  "timezone": "America/New_York"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Business profile updated successfully.",
  "data": {
    "id": "business_id",
    "name": "Updated Business Name",
    // ... updated business fields
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Business profile not found. Please setup your business first."
}
```

---

## Invoice API Endpoints

### POST `/invoice/create`

**Description:** Creates a new invoice and sends a Stripe payment link with PDF to the client.

**Headers:** Requires authentication (`token` cookie)

**Request Body:**

```json
{
  "clientName": "Jane Smith",
  "clientEmail": "jane@example.com",
  "currency": "INR",
  "dueDate": "2025-07-31",
  "items": [
    {
      "description": "Web Design",
      "amount": 5000
    },
    {
      "description": "Hosting",
      "amount": 1500
    }
  ]
}
```

**Response Codes:**

- `201 Created` – Invoice created, Stripe link generated, and email sent
- `400 Bad Request` – Missing or empty items array
- `500 Internal Server Error` – Stripe link generation failed

---

### GET `/invoice/`

**Description:** Fetches all invoices for the authenticated user.

**Headers:** Requires authentication (`token` cookie)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Invoice retrieved successfully.",
  "data": [
    {
      "id": 1,
      "clientName": "Jane Smith",
      "clientEmail": "jane@example.com",
      "currency": "INR",
      "total": 6500,
      "status": "UNPAID",
      "dueDate": "2025-07-31T00:00:00.000Z",
      "pdfUrl": null,
      "items": [
        {
          "id": 101,
          "description": "Web Design",
          "amount": 5000
        },
        {
          "id": 102,
          "description": "Hosting",
          "amount": 1500
        }
      ]
    }
  ]
}
```

---

### GET `/invoice/:invoiceId`

**Description:** Returns details for a specific invoice by ID.

**Headers:** Requires authentication (`token` cookie)

**URL Parameters:**

- `invoiceId` - The unique identifier of the invoice

**Response Codes:**

- `200 OK` – Invoice found and returned
- `404 Not Found` – No invoice found with the provided ID

---

### DELETE `/invoice/delete/:invoiceId`

**Description:** Deletes an unpaid invoice and deactivates the associated Stripe payment link.

**Headers:** Requires authentication (`token` cookie)

**URL Parameters:**

- `invoiceId` - The unique identifier of the invoice

**Response Codes:**

- `200 OK` – Invoice deleted successfully
- `400 Bad Request` – Cannot delete a paid invoice
- `404 Not Found` – Invoice not found

---

## Dashboard API Endpoints

### GET `/dashboard/summary/data`

**Description:** Retrieves summary statistics and analytics data for the authenticated user's invoices.

**Headers:** Requires authentication (`token` cookie)

**Query Parameters:**

- `month` _(optional)_ - Integer 1–12 to filter invoices by specific month
- `day` _(optional)_ - Integer 1–31 to filter by specific day (requires `month` parameter)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Summary fetched",
  "data": {
    "totalRevenue": 125000,
    "totalInvoices": 25,
    "paid": 18,
    "unpaid": 7
  }
}
```

**Error Responses:**

- `400 Bad Request` – Invalid month value (must be 1-12)
- `500 Internal Server Error` – Unexpected server failure

---

### GET `/dashboard/recent/data`

**Description:** Fetches the 5 most recent invoices for the authenticated user, ordered by creation date (newest first).

**Headers:** Requires authentication (`token` cookie)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Recent invoices retrieved",
  "data": [
    {
      "id": 123,
      "clientName": "Jane Smith",
      "clientEmail": "jane@example.com",
      "total": 5000,
      "status": "PAID",
      "createdAt": "2025-07-20T10:30:00.000Z"
    },
    {
      "id": 124,
      "clientName": "John Doe",
      "clientEmail": "john@example.com",
      "total": 3500,
      "status": "UNPAID",
      "createdAt": "2025-07-19T14:15:00.000Z"
    }
  ]
}
```

---

### GET `/dashboard/invoices`

**Description:** Retrieves invoices filtered by payment status for the authenticated user.

**Headers:** Requires authentication (`token` cookie)

**Query Parameters:**

- `status` _(required)_ - One of: `PAID`, `UNPAID`, `OVERDUE`, or `FAILED` (case-insensitive)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Invoices with status: PAID",
  "data": [
    {
      "id": 1,
      "clientName": "Jane Smith",
      "clientEmail": "jane@example.com",
      "currency": "INR",
      "total": 6500,
      "status": "PAID",
      "dueDate": "2025-07-31T00:00:00.000Z",
      "createdAt": "2025-07-15T12:00:00.000Z",
      "items": [
        {
          "id": 101,
          "description": "Web Design",
          "amount": 5000
        },
        {
          "id": 102,
          "description": "Hosting",
          "amount": 1500
        }
      ]
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request` – Invalid status value
- `500 Internal Server Error` – Server error

---

## Error Handling

All endpoints use a centralized error handling system with consistent response formats.

### Common Error Responses

**401 Unauthorized:**

```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "message": "Internal server error"
}
```

**400 Bad Request:**

```json
{
  "success": false,
  "message": "Specific error description"
}
```

---

## Rate Limiting

### Login Endpoint

- **Limit:** 5 attempts per 15 minutes per IP address
- **Response:** `429 Too Many Requests` when limit exceeded

### OTP Endpoints

- **Register:** Rate limited to prevent spam
- **Verify OTP:** Rate limited to prevent brute force attacks
- **Response:** `429 Too Many Requests` when limit exceeded

---

## Data Validation Rules

### Email Addresses

- Automatically converted to lowercase
- Must be in valid email format
- Required for user registration and business setup

### String Fields

- All string fields are automatically trimmed of whitespace
- Empty strings are treated as valid values

### Business Profile Protected Fields

The following fields cannot be updated via the update endpoint:

- `id` - Business identifier
- `ownerId` - Owner user ID
- `createdAt` - Creation timestamp

### Business Profile Defaults

- `country`: "India"
- `defaultCurrency`: "INR"
- `timezone`: "Asia/Kolkata"

---

## Usage Examples

### JavaScript/Fetch Examples

**User Registration:**

```javascript
const response = await fetch('/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'securePassword123',
    location: 'Mumbai',
    dob: '1990-01-01',
    number: '9876543210'
  })
});
```

**User Login:**

```javascript
const response = await fetch('/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'securePassword123'
  })
});
// Token cookie is automatically set on successful login
```

**Create Business Profile:**

```javascript
const response = await fetch('/api/business/setup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // Authentication cookie sent automatically
  },
  body: JSON.stringify({
    name: 'My Awesome Business',
    email: 'contact@myawesomebusiness.com',
    description: 'We create awesome digital solutions',
    phone: '+91-9876543210',
    country: 'India',
    defaultCurrency: 'INR',
    timezone: 'Asia/Kolkata'
  })
});
```

**Create Invoice:**

```javascript
const response = await fetch('/invoice/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // Authentication cookie sent automatically
  },
  body: JSON.stringify({
    clientName: 'Jane Smith',
    clientEmail: 'jane@client.com',
    currency: 'INR',
    dueDate: '2025-08-31',
    items: [
      {
        description: 'Website Development',
        amount: 50000
      },
      {
        description: 'SEO Optimization',
        amount: 15000
      }
    ]
  })
});
```

**Get Dashboard Summary:**

```javascript
// Get overall summary
const response = await fetch('/dashboard/summary/data');

// Get summary for specific month
const monthlyResponse = await fetch('/dashboard/summary/data?month=7');

// Get summary for specific day in month
const dailyResponse = await fetch('/dashboard/summary/data?month=7&day=15');
```

---

## API Workflow

### User Registration & Authentication Flow

1. **Register:** `POST /register` → OTP sent to email
2. **Verify:** `POST /verify-otp` → Account activated
3. **Login:** `POST /login` → Authentication cookie set
4. **Access Protected Endpoints** → Cookie automatically included

### Business Setup Flow

1. **Setup Profile:** `POST /api/business/setup` → Create business profile
2. **View Profile:** `GET /api/business/` → Retrieve current profile
3. **Update Profile:** `PATCH /api/business/update` → Modify existing profile

### Invoice Management Flow

1. **Create Invoice:** `POST /invoice/create` → Invoice created, Stripe link generated
2. **View All Invoices:** `GET /invoice/` → List all user invoices
3. **View Specific Invoice:** `GET /invoice/:id` → Get invoice details
4. **Delete Invoice:** `DELETE /invoice/delete/:id` → Remove unpaid invoice

### Dashboard Analytics Flow

1. **Summary Data:** `GET /dashboard/summary/data` → Overall statistics
2. **Recent Invoices:** `GET /dashboard/recent/data` → Latest 5 invoices
3. **Filtered Invoices:** `GET /dashboard/invoices?status=PAID` → Status-based filtering
