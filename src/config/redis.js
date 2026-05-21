import Redis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

/* eslint no-undef: off */
/* eslint no-console: off */
const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

redis.on('connect', () => {
  console.log('Redis client connected');
});

redis.on('error', (err) => {
  console.log('Redis client error', err);
});

export default redis;
