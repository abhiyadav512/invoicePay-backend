Auth API

---

Features

- User Registration with email verification via OTP
- User Login with JWT token and secure HTTP-only cookie
- OTP Verification to activate user accounts
- Protected route to get the authenticated user's info
- Logout endpoint to clear authentication cookies
- Input validation with Zod schemas
- Rate limiting on `/login` and `/verifiy-otp` endpoints
- Secure cookie handling with environment-aware settings

---

API Endpoints

POST `/register`

Registers a new user or resends OTP if the email exists but is not verified.

Request body:

{
"name": "John Doe",
"email": "john@example.com",
"password": "your_password",
"location": "City",
"dob": "1990-01-01",
"number": "1234567890"
}

Response:

- `200 OK` on success, OTP sent to email
- `409 Conflict` if email already verified
- `429 Too Many Requests` if OTP requested too frequently

---

POST `/login`

Logs in a user with email and password.

Request body:

{
"email": "john@example.com",
"password": "your_password"
}

Response:

- `200 OK` with user info, and sets a secure HTTP-only cookie named `token`
- `401 Unauthorized` if credentials are invalid
- `403 Forbidden` if email is not verified
- Rate limited to 5 attempts per 15 minutes per IP

---

POST `/verifiy-otp`

Verifies the OTP sent to the user’s email.

Request body:

{
"email": "john@example.com",
"otp": "123456"
}

Response:

- `200 OK` on successful verification
- `400 Bad Request` if OTP invalid or expired
- `429 Too Many Requests` if too many attempts made

---

GET `/me`

Returns the authenticated user's information.

Headers:  
Requires the `token` cookie set by login.

Response:

{
"success": true,
"user": {
"id": 1,
"name": "John Doe",
"email": "john@example.com"
}
}

---

POST `/logout`

Logs out the user by clearing the authentication cookie.

Response:

{
"success": true,
"message": "Logged out"
}
