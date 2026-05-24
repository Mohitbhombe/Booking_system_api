# Hotel Booking System API

Welcome to the Hotel Booking System API development repository. This is a modular, production-ready backend project built on a systematic weekly progression.

---

## WEEK 2: Database Integration and Resource Management

This week implements resource expansions including Room and User schemas, nested RESTful routes, database seeding functionality, advanced query interfaces, and custom centralized error handling middleware.

### Folder Structure
```text
/config
  └── database.js      # MongoDB database connection configuration
/controllers
  ├── hotelController.js # Operations for Hotels (Search, Filter, Sort, Paginate)
  └── roomController.js  # CRUD logic for Rooms (with nested hotel parsing)
/middleware
  └── error.js         # Centralized database and request error interceptor
/models
  ├── Hotel.js         # Hotel mongoose schema
  ├── Room.js          # Room mongoose schema (linked to Hotel)
  └── User.js          # User mongoose schema (guest/admin roles)
/routes
  ├── hotelRoutes.js   # Route mapping for /api/hotels (supports nested room sub-routes)
  └── roomRoutes.js    # Route mapping for /api/rooms
/utils
  └── seedData.js      # Database purging and seeding script for test populations
.env                   # App configuration variables
.gitignore             # Excludes node modules and env secrets from version control
package.json           # Dependencies and custom script runner configurations
server.js              # Application bootstrapper and Express core
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
Populate the database with clean mockup data (purges existing record structures and inserts 2 Users, 4 Hotels, and 12 Rooms):
```bash
npm run seed
```

### 5. Start Server
Run in development hot-reloading mode:
```bash
npm run dev
```

---

## API Endpoints (Updated)

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
- **`GET /api/hotels/:hotelId/rooms`** — Retrieve all rooms belonging specifically to a given hotel (Nested Route).
- **`GET /api/rooms/:id`** — Single room retrieval (populates parent Hotel properties).
- **`POST /api/rooms`** — Add a new room (verifies parent hotel ID exists).
- **`PUT /api/rooms/:id`** — Edit room details.
- **`DELETE /api/rooms/:id`** — Delete room.

---

## Centralized Exception Handling
The API handles common errors elegantly through `middleware/error.js`, returning uniform error payloads with correct HTTP status codes:
- **`CastError` (400)**: Catches malformed MongoDB ObjectIds.
- **`ValidationError` (400)**: Collects and lists all missing/invalid mongoose fields.
- **`Duplicate Key (11000)` (400)**: Captures double email registration or duplicate room numbers in the same hotel.
- **`Generic Server Errors` (500)**: Safely logs and notifies of unhandled runtime exceptions.

---

## Database Models Layout

### Hotel Model
- `name` (String, required)
- `description` (String, required)
- `address` (String, required)
- `city` (String, required)
- `country` (String, required)
- `pricePerNight` (Number, required)
- `amenities` ([String])
- `images` ([String])
- `rating` (Number, range 0-5)
- `totalRooms` (Number, required)
- `availableRooms` (Number, required)

### Room Model
- `roomNumber` (String, required)
- `type` (String, required, enum: `Single`, `Double`, `Suite`, `Deluxe`)
- `hotel` (ObjectId -> Ref `Hotel`, required)
- `pricePerNight` (Number, required, min 0)
- `capacity` (Number, required, min 1)
- `amenities` ([String])
- `isAvailable` (Boolean, default true)
- *Compound unique index set on `{ roomNumber: 1, hotel: 1 }`*

### User Model
- `name` (String, required)
- `email` (String, required, unique, pattern checked)
- `password` (String, required, minlength 6)
- `role` (String, enum: `guest`, `admin`, default `guest`)
- `phone` (String)
- `bookings` ([ObjectId -> Ref Booking])
