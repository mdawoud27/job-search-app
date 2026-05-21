import redis from '../config/redis.js';

export const TTL = {
  JOB_LIST: 60 * 5,
  JOB_ITEM: 60 * 10,
};

export const CacheKeys = {
  jobList: (query) => `jobs:list:${JSON.stringify(query)}`,
  job: (id) => `jobs:item:${id}`,
};

export async function getOrSet(key, fetcher, ttl) {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    const fresh = await fetcher();
    await redis.setex(key, ttl, JSON.stringify(fresh));
    return fresh;
  } catch {
    // dont break the API if redis down
    return fetcher();
  }
}

export async function invalidate(...patterns) {
  try {
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch {
    // silence pass
  }
}
