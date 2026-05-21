import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

/* eslint no-undef: off */
const redisConnection = new IORedis(process.env.REDIS_URL, {
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
