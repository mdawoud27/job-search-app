// to run => node --env-file=.env scripts/get-token.js
/* eslint no-console: 0 */
/* eslint no-undef: 0 */

import fetch from 'node-fetch';
import { createClient } from 'redis';

const BASE_URL = 'http://localhost:3000/api/v1';

async function getToken(email, password) {
  console.log(`\n🔑 Logging in as: ${email}`);

  const res = await fetch(`${BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('❌ Login failed:', data.message);
    process.exit(1);
  }

  console.log('✅ Access Token:\n', data.accessToken);
  console.log('\n📋 User ID:', data.user?.id || data.user?._id);
  console.log('📋 Role:', data.user?.role);

  // Confirm Redis stored the refresh token
  const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });
  await redis.connect();

  const keys = await redis.keys('*');
  const refreshKeys = keys.filter((k) => k.includes(data.user?.id || ''));
  console.log(
    '\n📦 Redis keys for this user:',
    refreshKeys.length ? refreshKeys : '(none found — check your key naming)',
  );

  await redis.quit();
  return data.accessToken;
}

// --- Run for both HR and User ---
const hrToken = await getToken('hr@example.com', 'yourpassword');
const userToken = await getToken('user@example.com', 'yourpassword');

console.log('\n\n=== COPY THESE INTO THE TEST PAGES ===');
console.log('HR Token:  ', hrToken);
console.log('User Token:', userToken);
