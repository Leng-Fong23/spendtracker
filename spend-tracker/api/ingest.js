import { parseNotification } from '../lib/parse.js';
import { addTransaction, checkAuth } from '../lib/store.js';

// POST /api/ingest   (header: x-api-key)
// Body options:
//   { "text": "<notification or SMS text>" }
//   { "amount": "12.50", "merchant": "Starbucks", "card": "Maybank Visa" }   (Wallet transaction automation)
//   optional: "source", "timestamp" (ms or ISO)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = { text: body }; }
    }
    const parsed = parseNotification(body);
    if (parsed.amount == null || !(parsed.amount > 0)) {
      return res.status(422).json({ error: 'No amount found', raw: parsed.raw });
    }
    const ts = body && body.timestamp ? new Date(body.timestamp).getTime() : Date.now();
    const result = await addTransaction({ ...parsed, ts: Number.isFinite(ts) ? ts : Date.now() });
    return res.status(result.duplicate ? 200 : 201).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
