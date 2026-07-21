/**
 * Standalone verification of the slot-lock logic against a real Redis
 * instance. Run with a local Redis running (redis-server) to confirm:
 *   1. Only one of two concurrent requests for the same slot wins the lock
 *   2. A wrong token cannot release someone else's lock
 *   3. Releasing with the correct token frees the slot for the next request
 *   4. An abandoned lock expires on its own via TTL
 *
 * Usage: node scripts/test-redis-lock.js  (REDIS_URL env var optional,
 * defaults to redis://localhost:6379)
 */
const Redis = require('ioredis');
const { randomUUID } = require('crypto');

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

const RELEASE_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;

async function acquire(slotId, ttlMs = 15000) {
  const token = randomUUID();
  const key = `slot-lock:${slotId}`;
  const result = await redis.set(key, token, 'PX', ttlMs, 'NX');
  return result === 'OK' ? token : null;
}

async function release(slotId, token) {
  const key = `slot-lock:${slotId}`;
  const result = await redis.eval(RELEASE_SCRIPT, 1, key, token);
  return result === 1;
}

async function main() {
  const slotId = 'test-slot-123';
  await redis.del(`slot-lock:${slotId}`); // clean slate

  console.log('--- Test 1: two concurrent requests for the same slot ---');
  const [tokenA, tokenB] = await Promise.all([acquire(slotId), acquire(slotId)]);
  console.log('Request A got lock:', tokenA !== null);
  console.log('Request B got lock:', tokenB !== null);
  if ((tokenA !== null) === (tokenB !== null)) {
    throw new Error('FAIL: both or neither request got the lock — expected exactly one');
  }
  console.log('PASS: exactly one request acquired the lock\n');

  console.log('--- Test 2: wrong token cannot release someone else\u2019s lock ---');
  const winnerToken = tokenA ?? tokenB;
  const releasedWithWrongToken = await release(slotId, 'not-the-real-token');
  console.log('Release with wrong token succeeded:', releasedWithWrongToken);
  if (releasedWithWrongToken) throw new Error('FAIL: wrong token released the lock');
  console.log('PASS: wrong token correctly rejected\n');

  console.log('--- Test 3: correct token releases the lock, then a new request can acquire it ---');
  const releasedCorrectly = await release(slotId, winnerToken);
  console.log('Release with correct token succeeded:', releasedCorrectly);
  const tokenC = await acquire(slotId);
  console.log('New request acquired lock after release:', tokenC !== null);
  if (!releasedCorrectly || tokenC === null) throw new Error('FAIL: release or re-acquire did not work');
  console.log('PASS: release + re-acquire works\n');

  console.log('--- Test 4: lock auto-expires via TTL ---');
  await release(slotId, tokenC);
  await acquire(slotId, 500); // 500ms TTL
  await new Promise((r) => setTimeout(r, 700));
  const tokenD = await acquire(slotId);
  console.log('Acquired after TTL expiry:', tokenD !== null);
  if (tokenD === null) throw new Error('FAIL: lock did not expire on its own');
  console.log('PASS: TTL expiry works\n');

  console.log('ALL TESTS PASSED \u2705');
  await redis.del(`slot-lock:${slotId}`);
  await redis.quit();
}

main().catch((e) => {
  console.error('TEST FAILED:', e.message);
  process.exit(1);
});
