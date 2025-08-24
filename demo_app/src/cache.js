const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({ url: redisUrl });

client.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Redis Client Error', err);
});

let isConnected = false;
async function ensureConnected() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
}

async function get(key) {
  await ensureConnected();
  return client.get(key);
}

async function setEx(key, ttlSeconds, value) {
  await ensureConnected();
  return client.setEx(key, ttlSeconds, value);
}

async function del(key) {
  await ensureConnected();
  return client.del(key);
}

async function ping() {
  await ensureConnected();
  return client.ping();
}

module.exports = { get, setEx, del, ping };


