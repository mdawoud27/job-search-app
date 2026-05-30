import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

/* eslint no-undef: off */
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not defined');
}

// Queue connection
const queueConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

// Worker connection
const workerConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

// Create a queue for general jobs
export const createQueue = (queueName) =>
  new Queue(queueName, { connection: queueConnection });

// Create a worker for general jobs
export const createWorker = (queueName, processor, options = {}) =>
  new Worker(queueName, processor, {
    connection: workerConnection,
    ...options,
  });
