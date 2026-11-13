import { Redis } from '@upstash/redis';
import { randomUUID } from 'node:crypto';

// Works with both the Vercel Marketplace Upstash integration (KV_REST_API_*)
// and a plain Upstash database (UPSTASH_REDIS_REST_*).
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let redis;
function db() {
  if (!redis) {
    if (!url || !token) throw new Error('Redis env vars missing');
    redis = new Redis({ url, token });
  }
  return redis;
}

const INDEX = 'tx:index';

export function checkAuth(req) {
  const key = process.env.API_KEY;
  if (!key) return false;
  const given = req.headers['x-api-key'] || '';
  return given === key;
}

export async function addTransaction(tx) {
  const r = db();
  const ts = tx.ts || Date.now();

  // Duplicate guard: same raw text + amount within 2 minutes
  const dupKey = `tx:dup:${tx.amount}:${(tx.raw || '').slice(0, 80)}`;
  const isNew = await r.set(dupKey, 1, { nx: true, ex: 120 });
  if (!isNew) return { duplicate: true };

  const id = randomUUID();
  const record = { id, ...tx, ts };
  await r.set(`tx:${id}`, JSON.stringify(record));
  await r.zadd(INDEX, { score: ts, member: id });
  return { duplicate: false, record };
}

export async function listTransactions({ limit = 500 } = {}) {
  const r = db();
  const ids = await r.zrange(INDEX, 0, limit - 1, { rev: true });
  if (!ids.length) return [];
  const rows = await r.mget(...ids.map((id) => `tx:${id}`));
  return rows
    .filter(Boolean)
    .map((v) => (typeof v === 'string' ? JSON.parse(v) : v));
}

export async function deleteTransaction(id) {
  const r = db();
  await r.del(`tx:${id}`);
  await r.zrem(INDEX, id);
}
