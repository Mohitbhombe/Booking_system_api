# Hotel Booking System API

Welcome to the Hotel Booking System API development repository. This is a modular, production-ready backend project built on a systematic weekly progression.

---

## WEEK 3: Booking Management and Validation

This week implements the complete booking lifecycle — creating reservations with date validation, checking room availability, preventing double bookings, calculating prices, and centralized custom error handling.

### Folder Structure
```text
/config
  └── database.js           # MongoDB database connection configuration
/controllers
  ├── hotelController.js    # Operations for Hotels (Search, Filter, Sort, Paginate)
  ├── roomController.js     # CRUD logic for Rooms (with nested hotel parsing)
  └── bookingController.js  # Booking creation, cancellation, status updates, availability checks
/middleware
  └── error.js              # Centralized error handler (Mongoose + custom AppError classes)
/models
  ├── Hotel.js              # Hotel mongoose schema
  ├── Room.js               # Room mongoose schema (linked to Hotel)
  ├── User.js               # User mongoose schema (guest/admin roles)
  └── Booking.js            # Booking schema with guest details and status tracking
/routes
  ├── hotelRoutes.js        # Route mapping for /api/hotels (supports nested room sub-routes)
  ├── roomRoutes.js         # Route mapping for /api/rooms (includes availability endpoint)
  └── bookingRoutes.js      # Route mapping for /api/bookings
/utils
  ├── seedData.js           # Database purging and seeding script
  ├── errors.js             # Custom error classes (ValidationError, NotFoundError, etc.)
  └── roomAvailability.js   # Date validation, availability checks, price calculation
.env                        # App configuration variables
server.js                   # Application bootstrapper and Express core
```

---

## Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- A local [MongoDB](https://www.mongodb.com/) installation or a MongoDB Atlas connection.

### 2. Installation
Install core and dev dependencies:
```bash
npm install
```

### 3. Environment Setup
Configure your `.env` in the root:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hotel_booking
```

### 4. Seed the Database
Populate the database with clean mockup data (purges existing records and inserts 2 Users, 4 Hotels, 12 Rooms, and 1 sample Booking):
```bash
npm run seed
```

### 5. Start Server
Run in development hot-reloading mode:
```bash
npm run dev
```

---

## API Endpoints

### System Health
- **`GET /api/health`** — General server status.

### Hotel Operations
- **`GET /api/hotels`** — Fetch hotels. Supports:
  - **Fuzzy Search**: `?search=Grand` (matches on name, city, or country).
  - **Relational Filtering**: `?country=USA&pricePerNight[lte]=300` (brackets notation).
  - **Multi-Sort**: `?sort=-pricePerNight` (descending price) or `?sort=name` (ascending name).
  - **Pagination**: `?page=1&limit=2` (returns total matched count and prev/next page tokens).
- **`GET /api/hotels/:id`** — Single hotel retrieval.
- **`POST /api/hotels`** — Add hotel.
- **`PUT /api/hotels/:id`** — Edit hotel details.
- **`DELETE /api/hotels/:id`** — Delete hotel.

### Room Operations
- **`GET /api/rooms`** — Retrieve all rooms. Supports query parameters (e.g. `?type=Suite`).
- **`GET /api/hotels/:hotelId/rooms`** — Retrieve all rooms belonging to a given hotel (Nested Route).
- **`GET /api/rooms/:roomId/availability`** — Check room availability for a date range.
  - Query params: `?checkInDate=2026-06-01&checkOutDate=2026-06-05`
  - Returns availability status, nights, and calculated total price.
- **`GET /api/rooms/:id`** — Single room retrieval (populates parent Hotel properties).
- **`POST /api/rooms`** — Add a new room (verifies parent hotel ID exists).
- **`PUT /api/rooms/:id`** — Edit room details.
- **`DELETE /api/rooms/:id`** — Delete room.

### Booking Operations
- **`POST /api/bookings`** — Create a new booking.
  - Uses MongoDB transactions to prevent concurrent double bookings.
  - Validates dates, guest capacity, room-hotel association, and availability.
  - Calculates `totalPrice` automatically from room rate × number of nights.
- **`GET /api/bookings/user/:userId`** — Retrieve all bookings for a specific user.
- **`GET /api/bookings/:id`** — Retrieve a single booking with populated user, hotel, and room details.
- **`PUT /api/bookings/:id/cancel`** — Cancel a booking (sets status to `cancelled`).
- **`PUT /api/bookings/:id/status`** — Update booking status (`pending`, `confirmed`, `cancelled`).

#### Example: Create Booking
```json
POST /api/bookings
{
  "user": "<userId>",
  "hotel": "<hotelId>",
  "room": "<roomId>",
  "checkInDate": "2026-06-15",
  "checkOutDate": "2026-06-18",
  "guestDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0199",
    "guestCount": 2
  }
}
```

---

## Booking Validation Rules

| Rule | Description |
|------|-------------|
| Past dates | Check-in cannot be before today |
| Date order | Check-out must be after check-in |
| Minimum stay | At least 1 night required |
| Capacity | Guest count must not exceed room capacity |
| Double booking | Overlapping pending/confirmed bookings on the same room are rejected |
| Room status | Room must have `isAvailable: true` |
| Hotel-room link | Room must belong to the specified hotel |

---

## Centralized Exception Handling

The API uses custom error classes in `utils/errors.js` and a unified handler in `middleware/error.js`:

| Error Class | HTTP Status | Use Case |
|-------------|-------------|----------|
| `ValidationError` | 400 | Invalid dates, missing fields, capacity exceeded |
| `NotFoundError` | 404 | User, hotel, room, or booking not found |
| `ConflictError` | 409 | Room unavailable, double booking attempt |
| `UnauthorizedError` | 401 | Reserved for Week 6 auth |
| `ForbiddenError` | 403 | Reserved for Week 6 RBAC |
| `CastError` | 400 | Malformed MongoDB ObjectIds |
| `ValidationError` (Mongoose) | 400 | Schema validation failures |
| `Duplicate Key (11000)` | 400 | Duplicate email or room number |

---

## Database Models Layout

### Booking Model
- `user` (ObjectId → Ref `User`, required)
- `hotel` (ObjectId → Ref `Hotel`, required)
- `room` (ObjectId → Ref `Room`, required)
- `checkInDate` (Date, required)
- `checkOutDate` (Date, required)
- `totalPrice` (Number, required, min 0)
- `status` (String, enum: `pending`, `confirmed`, `cancelled`, default `pending`)
- `guestDetails` (Embedded: name, email, phone, guestCount)
- `timestamps` (`createdAt` & `updatedAt`)

### Hotel Model
- `name`, `description`, `address`, `city`, `country`
- `pricePerNight`, `amenities`, `images`, `rating`
- `totalRooms`, `availableRooms`

### Room Model
- `roomNumber`, `type` (enum: Single, Double, Suite, Deluxe)
- `hotel` (ObjectId → Ref `Hotel`)
- `pricePerNight`, `capacity`, `amenities`, `isAvailable`
- Compound unique index on `{ roomNumber, hotel }`

### User Model
- `name`, `email`, `password`, `role` (guest/admin)
- `phone`, `bookings` ([ObjectId → Ref Booking])

---

## Previous Weeks

- **Week 1**: Environment setup, MongoDB connection, Hotel CRUD API
- **Week 2**: Room & User models, advanced queries, database seeding, basic error handling
