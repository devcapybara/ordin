const { createClient } = require('redis');

let redisClient = null;

const initRedis = async () => {
  const redisUrl = process.env.REDIS_URI || 'redis://localhost:6379';
  
  // Only connect if REDIS_URI is explicitly provided or we assume local default
  // But to be safe in environments without Redis, we can wrap this.
  
  redisClient = createClient({
    url: redisUrl
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
    // Don't crash the app, just log it.
  });

  redisClient.on('connect', () => {
    console.log('Redis Connected');
  });

  try {
    await redisClient.connect();
  } catch (error) {
    console.log('Redis Connection Failed (Caching Disabled):', error.message);
    redisClient = null; // Fallback to null so we know it's unavailable
  }
};

const getRedis = () => redisClient;

module.exports = { initRedis, getRedis };
