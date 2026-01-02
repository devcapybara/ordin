const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
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
    socket.on('join_restaurant', (restaurantId) => {
      if (restaurantId) {
        socket.join(`restaurant_${restaurantId}`);
        console.log(`Socket ${socket.id} joined restaurant_${restaurantId}`);
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
