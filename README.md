# API Documentation

## Auth API Endpoints

### POST `/register`

Registers a new user or resends OTP if the email exists but is not verified.

#### Request Body

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

#### Response

- `200 OK` – OTP sent to email
- `409 Conflict` – Email already verified
- `429 Too Many Requests` – OTP requested too frequently

---

### POST `/login`

Logs in a user with email and password.

#### Request Body

```json
{
  "email": "john@example.com",
  "password": "your_password"
}
```

#### Response

- `200 OK` – Login successful; sets a secure HTTP-only cookie named `token`
- `401 Unauthorized` – Invalid credentials
- `403 Forbidden` – Email not verified
- **Rate Limited** – Max 5 attempts per 15 minutes per IP

---

### POST `/verify-otp`

Verifies the OTP sent to the user’s email.

#### Request Body

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### Response

- `200 OK` – OTP verified successfully
- `400 Bad Request` – Invalid or expired OTP
- `429 Too Many Requests` – Too many attempts

---

### GET `/me`

Returns the authenticated user's information.

#### Headers

Requires the `token` cookie set by login.

#### Response

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

Logs out the user by clearing the authentication cookie.

#### Response

```json
{
  "success": true,
  "message": "Logged out"
}
```

---

## Invoice API Endpoints

### POST `/invoice/create`

Creates a new invoice and sends a Stripe payment link with PDF to the client.

#### Request Body

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

#### Response

- `201 Created` – Invoice created, Stripe link generated, and email sent
- `400 Bad Request` – Missing or empty items array
- `500 Internal Server Error` – Stripe link generation failed

---

### GET `/invoice/`

Fetches all invoices for the authenticated user.

#### Response

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

Returns details for a specific invoice.

#### Response

- `200 OK` – Invoice found
- `404 Not Found` – No invoice with provided ID

---

### DELETE `/invoice/delete/:invoiceId`

Deletes an unpaid invoice and deactivates the Stripe link.

#### Response

- `200 OK` – Invoice deleted successfully
- `400 Bad Request` – Cannot delete a paid invoice
- `404 Not Found` – Invoice not found

---

## Dashboard API Endpoints

### GET `/dashboard/summary/data`

Retrieves summary statistics and analytics data for the authenticated user's invoices.

**Query Parameters:**

- `month` (_optional_): Integer 1–12 to filter invoices by specific month
- `day` (_optional_): Integer 1–31 to filter by specific day (requires `month` parameter)

**Headers:**
Requires the `token` cookie set by login.

**Response:**

- `200 OK` – Summary data retrieved successfully
- `400 Bad Request` – Invalid month value (must be 1-12)
- `500 Internal Server Error` – Unexpected server failure

**Success Response:**

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

---

### GET `/dashboard/recent/data`

Fetches the 5 most recent invoices for the authenticated user, ordered by creation date (newest first).

**Headers:**
Requires the `token` cookie set by login.

**Response:**

- `200 OK` – Recent invoices retrieved successfully
- `500 Internal Server Error` – Server error

**Success Response:**

```json
{
  "success": true,
  "message": "recent invoice",
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

Retrieves invoices filtered by payment status for the authenticated user.

**Query Parameters:**

- `status` (_required_): One of `PAID`, `UNPAID`, `OVERDUE`, or `FAILED` (case-insensitive)

**Headers:**
Requires the `token` cookie set by login.

**Response:**

- `200 OK` – Filtered invoices retrieved successfully
- `400 Bad Request` – Invalid status value
- `500 Internal Server Error` – Server error

**Success Response:**

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
