import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import logger from './logger.js';
dotenv.config();

/* eslint no-undef: off */
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not defined');
}

const redis = new Redis(redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('error', (err) => {
  logger.error('Redis client error', err);
});

export default redis;
