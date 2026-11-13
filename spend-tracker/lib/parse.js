// Parses a bank / e-wallet notification or SMS text into a transaction.
// Tuned for common Malaysian formats (Maybank, CIMB, Public Bank, TNG eWallet, Apple Pay, GrabPay).

const AMOUNT_RE = /(?:RM|MYR)\s?([\d,]+(?:\.\d{1,2})?)/i;

const INCOME_HINTS = /\b(received|credited|credit of|refund|cashback|salary|deposit|transfer from|money in)\b/i;

const CATEGORY_RULES = [
  ['Food & Drink', /(mcdonald|kfc|starbucks|zus|tealive|grab\s?food|foodpanda|shopeefood|restoran|restaurant|cafe|kopitiam|mamak|bakery|pizza|sushi|chagee|99 speedmart)/i],
  ['Groceries', /(tesco|lotus|aeon|giant|mydin|jaya grocer|village grocer|econsave|speedmart|7-eleven|99\s?speed|kk mart)/i],
  ['Transport', /(grab(?!\s?food)|petronas|shell|petron|bhp|caltex|touch ?'?n ?go|tng|rapid ?kl|mrt|lrt|toll|plus ?highway|parking|setel|maxim|bolt)/i],
  ['Bills & Utilities', /(tnb|tenaga|syabas|air selangor|indah water|unifi|maxis|celcom|digi|yes ?4g|astro|tm ?net|bill payment|jompay)/i],
  ['Shopping', /(shopee|lazada|zalora|uniqlo|h&m|ikea|mr\.? ?diy|popular|watsons|guardian|amazon|apple\.com|app store)/i],
  ['Entertainment', /(netflix|spotify|disney|youtube|steam|gsc|tgv|cinema|playstation|xbox)/i],
  ['Health', /(clinic|klinik|hospital|pharmacy|farmasi|caring|dental)/i],
  ['Transfer', /(duitnow|transfer|ibg|giro|interbank|DuitNow QR)/i],
];

export function categorize(text) {
  for (const [name, re] of CATEGORY_RULES) if (re.test(text)) return name;
  return 'Other';
}

function extractMerchant(text) {
  const patterns = [
    /(?:\bat|@)\s+([A-Za-z0-9&'.\-\/ ]{2,40}?)(?=\s+(?:on|using|with|via|for|dated|ref|at)\b|[.,;\n]|$)/i,
    /\bto\s+([A-Za-z0-9&'.\-\/ ]{2,40}?)(?=\s+(?:on|using|with|via|for|dated|ref|from)\b|[.,;\n]|$)/i,
    /\bfrom\s+([A-Za-z0-9&'.\-\/ ]{2,40}?)(?=\s+(?:on|using|with|via|for|dated|ref|to)\b|[.,;\n]|$)/i,
    /merchant[:\s]+([A-Za-z0-9&'.\-\/ ]{2,40}?)(?=[.,;\n]|$)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1].trim().replace(/\s{2,}/g, ' ');
  }
  return '';
}

export function parseNotification(input) {
  // Structured input (e.g. from a Wallet "Transaction" automation)
  if (input && typeof input === 'object' && input.amount != null) {
    const amount = Number(String(input.amount).replace(/[^\d.]/g, ''));
    const merchant = String(input.merchant || '').trim();
    const text = [merchant, input.card].filter(Boolean).join(' ');
    return {
      amount: Number.isFinite(amount) ? amount : null,
      currency: 'MYR',
      merchant,
      category: categorize(text),
      type: INCOME_HINTS.test(text) ? 'income' : 'expense',
      source: input.source || 'wallet',
      raw: text,
    };
  }

  const text = String((input && input.text) || input || '').trim();
  const m = text.match(AMOUNT_RE);
  const amount = m ? Number(m[1].replace(/,/g, '')) : null;
  return {
    amount,
    currency: 'MYR',
    merchant: extractMerchant(text),
    category: categorize(text),
    type: INCOME_HINTS.test(text) ? 'income' : 'expense',
    source: (input && input.source) || 'notification',
    raw: text,
  };
}
