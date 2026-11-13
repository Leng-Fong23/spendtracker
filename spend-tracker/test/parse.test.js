import assert from 'node:assert/strict';
import { parseNotification } from '../lib/parse.js';

const cases = [
  ['RM12.50 spent at STARBUCKS KLCC on 13/11 using Maybank Visa', { amount: 12.5, category: 'Food & Drink', type: 'expense' }],
  ['MAE: You paid RM1,250.00 to TNB via JomPAY', { amount: 1250, category: 'Bills & Utilities', type: 'expense' }],
  ['CIMB: RM300.00 received from AHMAD via DuitNow', { amount: 300, type: 'income' }],
  ['Touch n Go eWallet: RM5.00 paid at PLUS Highway toll', { amount: 5, category: 'Transport', type: 'expense' }],
  ['Your card was used at SHOPEE MALAYSIA for MYR 89.90', { amount: 89.9, category: 'Shopping', type: 'expense' }],
];

for (const [text, expect] of cases) {
  const r = parseNotification({ text });
  for (const [k, v] of Object.entries(expect)) {
    assert.equal(r[k], v, `"${text}" -> ${k}: got ${r[k]}, expected ${v}`);
  }
}

const w = parseNotification({ amount: 'RM 23.40', merchant: 'Tealive', card: 'Apple Card' });
assert.equal(w.amount, 23.4);
assert.equal(w.category, 'Food & Drink');

assert.equal(parseNotification({ text: 'OTP 123456 do not share' }).amount, null);

console.log(`All ${cases.length + 2} parser tests passed`);
