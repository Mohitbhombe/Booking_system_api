# Hotel Booking System API - Week 1

Welcome to Week 1 of the Hotel Booking System API. This week lays the groundwork by establishing the development environment, configuring database connection logic, creating an initial Hotel Mongoose model, and setting up basic Hotel CRUD (Create, Read, Update, Delete) routes.

## Tech Stack (Week 1)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Environment**: Dotenv
- **Process Manager**: Nodemon (Development)

---

## Folder Structure
```text
/config
  └── database.js      # MongoDB database connection configuration
/controllers
  └── hotelController.js # Logic for CRUD operations on Hotel resources
/models
  └── Hotel.js         # Mongoose schema and model definition for Hotels
/routes
  └── hotelRoutes.js   # Route-to-controller mapping for /api/hotels
.env                   # Local environment variable configuration
.gitignore             # Excludes sensitive and temp files from git
package.json           # Project dependencies and script runner configurations
server.js              # Core entrypoint file of the application
```

---

## Setup Instructions

### 1. Prerequisites
- Ensure you have [Node.js](https://nodejs.org/) installed (v16+ recommended).
- A running instance of MongoDB (either local installation or a MongoDB Atlas cluster).

### 2. Install Dependencies
Run the following command to download and install required npm packages:
```bash
npm install
```

### 3. Environment Variables Configuration
Configure a `.env` file in the root directory (a default has been created for you).
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hotel_booking
```
*Note: Adjust `MONGODB_URI` if using MongoDB Atlas.*

### 4. Running the Server

#### Development Mode (with hot-reloading)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

---

## API Endpoints (Week 1)

### Health Check
- **`GET /api/health`**
  - Description: Check server & system status.
  - Response: `200 OK`

### Hotel CRUD
- **`GET /api/hotels`**
  - Description: Retrieve list of all hotels.
  - Response: `200 OK`
- **`GET /api/hotels/:id`**
  - Description: Retrieve a single hotel by its unique MongoDB ObjectId.
  - Response: `200 OK` | `404 Not Found` | `400 Bad Request (Invalid ID)`
- **`POST /api/hotels`**
  - Description: Add a new hotel.
  - Request Body: JSON object representing the Hotel model.
  - Response: `201 Created` | `400 Bad Request`
- **`PUT /api/hotels/:id`**
  - Description: Update properties of an existing hotel by its ID.
  - Request Body: JSON object with fields to update.
  - Response: `200 OK` | `404 Not Found` | `400 Bad Request`
- **`DELETE /api/hotels/:id`**
  - Description: Remove a hotel by its ID from the database.
  - Response: `200 OK` | `404 Not Found` | `400 Bad Request`

---

## Hotel Model Structure
The Hotel mongoose schema contains:
- `name` (String, required)
- `description` (String, required)
- `address` (String, required)
- `city` (String, required)
- `country` (String, required)
- `pricePerNight` (Number, required)
- `amenities` (Array of Strings)
- `images` (Array of Strings)
- `rating` (Number, default 0)
- `totalRooms` (Number, required)
- `availableRooms` (Number, required)
- `timestamps` (`createdAt` & `updatedAt` generated automatically)
