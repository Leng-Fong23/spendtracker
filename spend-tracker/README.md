# Spend Tracker (Vercel + iPhone Shortcuts)

A small web app/PWA that records your spending alerts and shows them in a dashboard.
No Mac needed. The same pattern fits your SwiftUI expense tracker project later.

## How it works

iOS does not let any app read other apps' push notifications. What iOS *does* allow is
**Shortcuts personal automations**, which can fire on:

| Trigger | Covers |
|---|---|
| **Transaction** (Wallet) | Apple Pay / cards in Apple Wallet, gives merchant + amount directly |
| **Message** (SMS) | Bank SMS alerts (Maybank, CIMB, Public Bank, etc.) |
| **Email** | Email receipts/alerts (e.g. TNG eWallet, bank e-alerts) |

Each automation POSTs the text to `/api/ingest`. The server extracts amount, merchant and
category, and stores it. The dashboard at `/` shows month totals and categories.

What this **cannot** do: read app-only push notifications (e.g. a Maybank MAE push with no SMS/email).
For those, turn on SMS/email alerts in the bank app, or use the manual add form.

## 1. Deploy (Windows, no CLI required)

1. Push this folder to a new GitHub repo.
2. In Vercel: **Add New → Project → import the repo → Deploy**.
3. In the project: **Storage → Marketplace → Upstash Redis → Create**, connect it to the project
   (this adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`).
4. **Settings → Environment Variables**: add `API_KEY` with a long random value
   (e.g. 32+ random characters). Keep a copy; you need it on the phone.
5. **Redeploy** so the env vars take effect.

Alternative: `npx vercel` from this folder, then `npx vercel env add API_KEY`.

## 2. Install on iPhone

Open `https://YOUR-APP.vercel.app` in Safari, enter the API key, then
**Share → Add to Home Screen**.

## 3. Create the automations (Shortcuts app)

### A. Apple Pay / Wallet
**Automation → + → Transaction** → choose your cards → **Run Immediately**.
Add action **Get Contents of URL**:
- URL: `https://YOUR-APP.vercel.app/api/ingest`
- Method: `POST`
- Headers: `x-api-key` = your key, `Content-Type` = `application/json`
- Request Body: **JSON**
  - `amount` → variable **Amount** (from Shortcut Input)
  - `merchant` → variable **Merchant**
  - `card` → variable **Card or Pass**

### B. Bank SMS
**Automation → + → Message** → Sender: the bank's SMS sender → Message Contains: `RM`
→ **Run Immediately**. Same Get Contents of URL action, with Request Body JSON:
- `text` → **Shortcut Input**

### C. Email alerts
Same as B but trigger **Email** (filter by sender or subject).

Variable names in the Transaction trigger can differ slightly by iOS version; pick them from the
variable picker.

## Test it

```bash
npm test    # parser tests

curl -X POST https://YOUR-APP.vercel.app/api/ingest \
  -H "x-api-key: YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"text":"RM12.50 spent at STARBUCKS KLCC using Maybank Visa"}'
```

## API

- `POST /api/ingest` – `{text}` or `{amount, merchant, card}`; header `x-api-key`
- `GET /api/transactions` – list
- `POST /api/transactions` – manual add
- `DELETE /api/transactions?id=...` – remove

## Notes

- Single-user: one shared `API_KEY`. Anyone with it can read your data, so keep it private.
- Parsing rules live in `lib/parse.js`; add keywords to `CATEGORY_RULES` and sample messages
  to `test/parse.test.js` as you see real alerts from your banks.
- Duplicate guard ignores an identical alert arriving within 2 minutes.
