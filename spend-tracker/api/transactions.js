import { addTransaction, deleteTransaction, listTransactions, checkAuth } from '../lib/store.js';
import { categorize } from '../lib/parse.js';

// GET    /api/transactions            -> list
// POST   /api/transactions            -> manual add {amount, merchant, category?, type?}
// DELETE /api/transactions?id=...     -> remove
export default async function handler(req, res) {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ transactions: await listTransactions() });
    }
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const amount = Number(b.amount);
      if (!(amount > 0)) return res.status(422).json({ error: 'Invalid amount' });
      const merchant = String(b.merchant || '').slice(0, 80);
      const result = await addTransaction({
        amount,
        currency: 'MYR',
        merchant,
        category: b.category || categorize(merchant),
        type: b.type === 'income' ? 'income' : 'expense',
        source: 'manual',
        raw: `manual:${Date.now()}`,
        ts: b.ts || Date.now(),
      });
      return res.status(201).json(result);
    }
    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id required' });
      await deleteTransaction(id);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
