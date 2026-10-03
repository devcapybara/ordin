const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const { initSocket } = require('./config/socket');
const { initRedis } = require('./config/redis');
const errorHandler = require('./middlewares/errorHandler');
const { SharedRateLimitStore } = require('./utils/rateLimitStore');

// Load env vars
dotenv.config();

// Fail fast if JWT_SECRET is missing in production
require('./services/auth/tokenService').getJwtSecret();

// Connect to database
connectDB();
// Connect to Redis
initRedis();

const app = express();
app.set('trust proxy', 1); // Trust first proxy (CloudHost LB / Nginx)
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: new SharedRateLimitStore('rl:global:'),
});
app.use(limiter);

// Stricter limit for guessable credentials. Only failed attempts count, so normal logins are not affected.
// Keyed by IP: a restaurant's devices behind one NAT share the budget, so keep the number generous.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many failed attempts. Try again in 15 minutes.' },
  store: new SharedRateLimitStore('rl:credentials:'),
});
app.use('/api/auth/login', credentialLimiter);
app.use('/api/auth/verify-pin', credentialLimiter);

// Middleware
app.use(
  helmet({
    originAgentCluster: process.env.NODE_ENV === 'production',
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // React inline style props need this
        connectSrc: ["'self'", ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])],
      },
    },
    crossOriginOpenerPolicy: process.env.NODE_ENV === 'production' ? { policy: 'same-origin' } : false,
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: false } : false,
  })
);
app.use(cors({
    origin: process.env.CLIENT_URL || '*', // Restrict in production
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/restaurant', require('./routes/restaurants'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/promos', require('./routes/promos'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/ingredients', require('./routes/ingredients'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/config', require('./routes/config'));

// Health check for load balancers and Docker. Must stay above the production catch-all route.
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
