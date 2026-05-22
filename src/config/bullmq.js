import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

/* eslint no-undef: off */
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not defined');
}

const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const createQueue = (queueName) => {
  return new Queue(queueName, { connection: redisConnection });
};

export const createWorker = (queueName, processor, options = {}) => {
  return new Worker(queueName, processor, {
    connection: redisConnection,
    ...options,
  });
};
