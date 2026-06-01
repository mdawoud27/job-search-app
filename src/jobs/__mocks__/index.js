import { jest } from '@jest/globals';

export const emailQueue = {
  add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
};

export const closeWorkers = jest.fn().mockResolvedValue(undefined);
export const initJobs = jest.fn().mockResolvedValue(undefined);
