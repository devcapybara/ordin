const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const { authenticate } = require('../services/auth/tokenService');

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

      socket.data.restaurantId = user.restaurantId.toString();
      next();
    } catch (error) {
      next(new Error('Not authorized, token failed'));
    }
  });

  const redisUrl = process.env.REDIS_URI || 'redis://localhost:6379';
  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();
  pubClient.connect().then(() => {
    subClient.connect().then(() => {
      io.adapter(createAdapter(pubClient, subClient));
    });
  }).catch(() => {});

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
