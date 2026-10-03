const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const { authenticate } = require('../services/auth/tokenService');
const Restaurant = require('../models/Restaurant');
const { isRoleDisabled } = require('../services/roles');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  // Only authenticated staff with a restaurant may connect
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Not authorized, no token'));

      const user = await authenticate(token);
      if (!user.restaurantId) return next(new Error('Not authorized, no restaurant'));

      const restaurant = await Restaurant.findById(user.restaurantId);
      if (isRoleDisabled(restaurant, user.role)) return next(new Error('Role is turned off for this restaurant'));

      socket.data.restaurantId = user.restaurantId.toString();
      next();
    } catch (error) {
      next(new Error('Not authorized, token failed'));
    }
  });

  // Redis lets several PM2 workers share socket events. Without it, sockets still work on a single process.
  const redisUrl = process.env.REDIS_URI || 'redis://localhost:6379';
  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();

  // Without an 'error' listener, a Redis error event crashes the process
  pubClient.on('error', (err) => console.error('Socket Redis (pub) error:', err.message));
  subClient.on('error', (err) => console.error('Socket Redis (sub) error:', err.message));

  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Socket.io Redis adapter enabled');
    })
    .catch((err) => {
      console.warn('Socket.io Redis adapter disabled, running single-process only:', err.message);
    });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join restaurant room
    // Clients may only join the room of their own restaurant
    socket.on('join_restaurant', (restaurantId) => {
      if (restaurantId && String(restaurantId) === socket.data.restaurantId) {
        socket.join(`restaurant_${socket.data.restaurantId}`);
        console.log(`Socket ${socket.id} joined restaurant_${socket.data.restaurantId}`);
      } else {
        console.warn(`Socket ${socket.id} rejected join for restaurant ${restaurantId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };
