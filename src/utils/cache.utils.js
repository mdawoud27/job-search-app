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
  let cached = null;
  try {
    cached = await redis.get(key);
  } catch {
    // redis read failed; proceed to source fetch
  }

  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // corrupted cache payload; ignore and refetch
    }
  }

  const fresh = await fetcher();
  redis.setex(key, ttl, JSON.stringify(fresh)).catch(() => {});
  return fresh;
}

export async function invalidate(...patterns) {
  try {
    for (const pattern of patterns) {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          200,
        );
        cursor = nextCursor;
        if (keys.length) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    }
  } catch {
    // silence pass
  }
}
