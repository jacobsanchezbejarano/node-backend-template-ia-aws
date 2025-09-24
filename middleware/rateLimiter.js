// middleware/rateLimiter.js
const Redis = require('ioredis');
require('dotenv').config();

// Connect to your Redis instance.
// For production, use environment variables.
const redisClient = new Redis({
  host: 'redis-11812.c73.us-east-1-2.ec2.redns.redis-cloud.com', 
  port: 11812,
  password: process.env.REDIS_PASSWORD, 
});

// Rate limiting configuration
const WINDOW_SIZE_IN_SECONDS = 60; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

/**
 * Middleware for rate limiting based on client IP.
 */
const rateLimiter = async (req, res, next) => {
  const clientIp = req.ip;

  try {
    // Increment the counter for the client's IP and set a TTL
    const [requestCount, ttl] = await redisClient
      .multi()
      .incr(clientIp)
      .ttl(clientIp) // Get the time-to-live
      .exec();

    // If the key is new, set its expiry time
    if (ttl[1] === -1) {
      await redisClient.expire(clientIp, WINDOW_SIZE_IN_SECONDS);
    }
    
    // Check if the request count exceeds the limit
    if (requestCount[1] > MAX_REQUESTS_PER_WINDOW) {
        const updatedTtl = await redisClient.ttl(clientIp);
      return res.status(429).json({
        message: 'Demasiadas peticiones. Por favor, inténtelo de nuevo más tarde.',
        retryAfter: updatedTtl // TTL shows time remaining until reset
      });
    }

    // Attach rate limit headers for client information
    const updatedTtl = await redisClient.ttl(clientIp);
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
    res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS_PER_WINDOW - requestCount[1]);
    res.setHeader('X-RateLimit-Reset', updatedTtl);

    next();
  } catch (error) {
    console.error('Error de Redis en el rate limiter:', error);
    // Fail-open: If Redis is down, allow requests to continue
    next();
  }
};

module.exports = rateLimiter;