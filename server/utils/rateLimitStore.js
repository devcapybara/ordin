const { RedisStore } = require('rate-limit-redis');
const { MemoryStore } = require('express-rate-limit');
const { getRedis } = require('../config/redis');

// Rate-limit store shared by all PM2 workers through Redis.
// Each worker keeps its own memory counter, so without Redis the effective limit grows with the worker count.
// If Redis is missing or a call fails, requests fall back to the memory counter instead of erroring.
class SharedRateLimitStore {
  constructor(prefix) {
    this.prefix = prefix;
    this.localKeys = false; // Counters are shared across processes when Redis is up
    this.memory = new MemoryStore();
    this.redis = null;
  }

  async init(options) {
    this.memory.init(options);
    this.redis = new RedisStore({
      prefix: this.prefix,
      sendCommand: (...args) => getRedis().sendCommand(args),
    });
    await this.redis.init(options);
  }

  async run(method, key) {
    const client = getRedis();
    if (this.redis && client && client.isReady) {
      try {
        return await this.redis[method](key);
      } catch (error) {
        console.error(`Rate limit Redis ${method} failed, using memory counter:`, error.message);
      }
    }
    return this.memory[method](key);
  }

  get(key) {
    return this.run('get', key);
  }

  increment(key) {
    return this.run('increment', key);
  }

  decrement(key) {
    return this.run('decrement', key);
  }

  resetKey(key) {
    return this.run('resetKey', key);
  }
}

module.exports = { SharedRateLimitStore };
