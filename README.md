# Hotel Booking System API

Welcome to the Hotel Booking System API development repository. This is a modular, production-ready backend project built on a systematic weekly progression.

---

## WEEK 6: Authentication and Authorization

This week implements JWT-based authentication, role-based access control (RBAC), password hashing, and protected routes across the entire API.

### Folder Structure
```text
/controllers
  └── authController.js     # Register, login, logout, profile, password reset
/middleware
  ├── auth.js               # JWT verification (protect)
  └── authorize.js          # Role-based access control
/models
  └── User.js               # Password hashing, reset token fields
/routes
  └── authRoutes.js         # /api/auth/*
/utils
  ├── generateToken.js      # JWT signing
  ├── passwordValidator.js  # Password strength rules
  └── tokenBlacklist.js     # Logout token invalidation
```

---

## Setup Instructions

### 1. Prerequisites
- Node.js (v16+), MongoDB
- Completed Weeks 1–5 (Stripe, email optional)

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hotel_booking

# JWT (required for Week 6)
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000

# Stripe, Email (from previous weeks)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
```

### 4. Seed & Run
```bash
npm run seed
npm run dev
```

**Seeded test accounts:**
| Email | Password | Role |
|-------|----------|------|
| `john@example.com` | `Password123` | guest |
| `admin@example.com` | `AdminPass1` | admin |

---

## Authentication Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/register` | Public | Register new user |
| `POST` | `/api/auth/login` | Public | Login, returns JWT |
| `POST` | `/api/auth/logout` | Private | Blacklist current token |
| `GET` | `/api/auth/profile` | Private | Get logged-in user profile |
| `PUT` | `/api/auth/update-password` | Private | Change password while logged in |
| `POST` | `/api/auth/forgot-password` | Public | Send password reset email |
| `PUT` | `/api/auth/reset-password/:token` | Public | Reset password with token |

### Register / Login Example
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "Password123"
}
```
Response includes a `token` — include it in all protected requests:
```
Authorization: Bearer <token>
```

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

---

## Role-Based Access Control

### Public Routes (no token required)
| Resource | Routes |
|----------|--------|
| System | `GET /api/health` |
| Auth | `POST /api/auth/register`, `/login`, `/forgot-password`, `/reset-password/:token` |
| Hotels | `GET /api/hotels`, `GET /api/hotels/:id` |
| Rooms | `GET /api/rooms`, `GET /api/rooms/:id`, `GET /api/rooms/:roomId/availability` |
| Stripe | `POST /api/payments/webhook` |

### Guest Routes (authenticated)
| Resource | Routes |
|----------|--------|
| Bookings | `POST /api/bookings`, `GET /api/bookings/me`, `GET /api/bookings/:id`, `PUT /api/bookings/:id/cancel` |
| Payments | `POST /api/payments/create-intent`, `GET /api/payments/:id`, `GET /api/payments/booking/:bookingId` |
| Profile | `GET /api/auth/profile`, `PUT /api/auth/update-password`, `POST /api/auth/logout` |

### Admin-Only Routes
| Resource | Routes |
|----------|--------|
| Hotels | `POST`, `PUT`, `DELETE /api/hotels` |
| Rooms | `POST`, `PUT`, `DELETE /api/rooms` |
| Bookings | `PUT /api/bookings/:id/status` |
| Payments | `POST /api/payments/:id/refund` |
| Emails | `GET /api/emails/logs`, `POST /api/emails/send-reminders` |

---

## Protected Booking Flow

```bash
# 1. Login
POST /api/auth/login  →  save token

# 2. Create booking (user ID taken from token automatically)
POST /api/bookings
Authorization: Bearer <token>
{ "hotel": "...", "room": "...", "checkInDate": "...", "checkOutDate": "...", "guestDetails": {...} }

# 3. View your bookings
GET /api/bookings/me
Authorization: Bearer <token>

# 4. Create payment intent
POST /api/payments/create-intent
Authorization: Bearer <token>
{ "bookingId": "..." }
```

---

## Previous Weeks

- **Week 1**: Environment setup, Hotel CRUD API
- **Week 2**: Room & User models, advanced queries, seeding
- **Week 3**: Booking management, availability checks, error handling
- **Week 4**: Stripe payment integration, webhooks, refunds
- **Week 5**: Email notifications with Nodemailer, queue, logging
