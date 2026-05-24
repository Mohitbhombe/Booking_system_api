require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/error');
const { stripeWebhook } = require('./controllers/paymentController');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const logger = require('./config/logger');
let swaggerUi;
let specs;
let rateLimit;
let apicache;
try {
  // Only require these optional deps when available. Avoid loading in test env to prevent timers/handles.
  if (process.env.NODE_ENV !== 'test') {
    swaggerUi = require('swagger-ui-express');
    specs = require('./config/swagger');
    rateLimit = require('express-rate-limit');
    apicache = require('apicache');
  }
} catch (err) {
  // ignore missing optional deps
}

// Connect to Database
connectDB();

const app = express();

// Enable extended query string parsing (brackets notation)
app.set('query parser', 'extended');

// Trust proxy headers in production deployments behind a reverse proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:3000').split(',').map(origin => origin.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy does not allow access from origin ${origin}`));
  },
  credentials: true
}));

// Security headers
app.use(helmet());

// Compression
app.use(compression());

// Basic rate limiter and caching (skip during tests)
if (process.env.NODE_ENV !== 'test' && rateLimit && apicache) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200 // limit each IP
  });
  app.use(limiter);

  // Simple caching for GET responses
  const cache = apicache.middleware;
  app.use(cache('5 minutes'));
}

// Request logging (morgan) — forward logs to winston in production
if (process.env.NODE_ENV !== 'test') {
  if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
  } else {
    app.use(morgan('dev'));
  }
}

// Stripe webhook must receive raw body — mount before JSON parser
app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Hotel Booking System API is healthy',
    timestamp: new Date()
  });
});

// Import and mount routes
const hotelRoutes = require('./routes/hotelRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const emailRoutes = require('./routes/emailRoutes');
const authRoutes = require('./routes/authRoutes');
const { startReminderScheduler } = require('./utils/reminderScheduler');

// Mount versioned API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/hotels', hotelRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/emails', emailRoutes);

// Swagger UI (only when available and not in tests)
if (process.env.NODE_ENV !== 'test' && swaggerUi && specs) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Centralized Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    startReminderScheduler();
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.error(`Unhandled Rejection: ${err?.message}`);
    server.close(() => process.exit(1));
  });
}

module.exports = app;
