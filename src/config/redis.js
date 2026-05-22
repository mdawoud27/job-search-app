import Redis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

/* eslint no-undef: off */
/* eslint no-console: off */
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not defined');
}

const redis = new Redis(redisUrl, {
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
