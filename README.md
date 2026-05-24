# Hotel Booking System API

Welcome to the Hotel Booking System API development repository. This is a modular, production-ready backend project built on a systematic weekly progression.

---

## WEEK 5: Email Notifications with Nodemailer

This week adds automated HTML email notifications — booking confirmations, payment receipts, cancellation notices with refund details, and check-in reminders. Includes an email queue with retry logic and full delivery logging.

### Folder Structure
```text
/controllers
  ├── bookingController.js  # Triggers confirmation & cancellation emails
  ├── paymentController.js
  └── emailController.js    # Email log viewing & manual reminder trigger
/models
  ├── Booking.js
  ├── Payment.js
  └── EmailLog.js           # Tracks all sent/queued/failed emails
/routes
  └── emailRoutes.js        # /api/emails/logs, /api/emails/send-reminders
/utils
  ├── emailService.js       # Nodemailer transport & send helpers
  ├── emailTemplates.js     # Professional HTML email templates
  ├── emailQueue.js         # In-memory queue with 3-retry logic
  ├── paymentService.js     # Triggers payment receipt email on success
  └── reminderScheduler.js  # Daily cron: reminders 1 day before check-in
.env.example
server.js                   # Starts reminder scheduler on boot
```

---

## Setup Instructions

### 1. Prerequisites
- Node.js (v16+), MongoDB, Stripe account (Week 4)
- Gmail account with [App Password](https://support.google.com/accounts/answer/185833) enabled, or SendGrid/SMTP provider

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env` and configure:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hotel_booking

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Hotel Booking <your@gmail.com>
```

### 4. Seed & Run
```bash
npm run seed
npm run dev
```

---

## Email Triggers

| Event | Email Type | When Sent |
|-------|-----------|-----------|
| Booking created | `booking_confirmation` | Immediately after `POST /api/bookings` |
| Payment succeeded | `payment_receipt` | After Stripe webhook or manual confirm |
| Booking cancelled | `cancellation` | After `PUT /api/bookings/:id/cancel` (includes refund info) |
| Check-in tomorrow | `check_in_reminder` | Daily cron at 9:00 AM for confirmed bookings |

---

## Email Templates

All templates are responsive HTML with a consistent branded layout:

- **Booking Confirmation** — Pending booking details, prompts user to complete payment
- **Payment Receipt** — Amount paid, transaction ID, confirmed booking details
- **Cancellation** — Cancelled booking details + refund amount/status if applicable
- **Check-in Reminder** — Hotel address, check-in time, booking summary

---

## Email Queue & Logging

### Queue (`utils/emailQueue.js`)
- Emails are queued asynchronously so API responses are not blocked
- Failed sends are retried up to **3 times** with exponential backoff (5s, 10s, 15s)

### Email Log Model
| Field | Description |
|-------|-------------|
| `to` | Recipient email |
| `subject` | Email subject line |
| `type` | `booking_confirmation`, `payment_receipt`, `cancellation`, `check_in_reminder` |
| `booking` | Linked booking ID |
| `status` | `queued`, `sent`, `failed` |
| `attempts` | Number of send attempts |
| `errorMessage` | Error details if failed |
| `sentAt` | Timestamp when successfully delivered |

---

## API Endpoints

### Email Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/emails/logs` | List all email logs (filter: `?type=`, `?status=`, `?booking=`) |
| `GET` | `/api/emails/logs/:id` | Get single email log |
| `POST` | `/api/emails/send-reminders` | Manually trigger tomorrow's reminders (dev only) |

### Payment Operations (Week 4)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/create-intent` | Create Stripe PaymentIntent |
| `POST` | `/api/payments/webhook` | Stripe webhook handler |
| `GET` | `/api/payments/:id` | Get payment details |
| `POST` | `/api/payments/:id/refund` | Full or partial refund |
| `POST` | `/api/payments/:id/confirm` | Manual confirm (dev only) |

### Booking Operations (Week 3)
- `POST /api/bookings` — Create booking (triggers confirmation email)
- `GET /api/bookings/user/:userId` — User's bookings
- `PUT /api/bookings/:id/cancel` — Cancel + refund + cancellation email
- `GET /api/rooms/:roomId/availability` — Check availability

---

## Testing Emails Locally

1. Configure Gmail App Password in `.env`
2. Create a booking — check logs: `GET /api/emails/logs`
3. Confirm payment: `POST /api/payments/:id/confirm` — triggers receipt email
4. Cancel booking: `PUT /api/bookings/:id/cancel` — triggers cancellation email
5. Test reminders: `POST /api/emails/send-reminders` (requires confirmed booking checking in tomorrow)

If email is not configured, emails are logged as `failed` with a helpful error message — the API still works normally.

---

## Previous Weeks

- **Week 1**: Environment setup, Hotel CRUD API
- **Week 2**: Room & User models, advanced queries, seeding
- **Week 3**: Booking management, availability checks, error handling
- **Week 4**: Stripe payment integration, webhooks, refunds
