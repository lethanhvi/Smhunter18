export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const sources = [
    // Metals.live - free, no key
    async () => {
      const r = await fetch('https://api.metals.live/v1/spot/gold');
      const d = await r.json();
      const price = parseFloat(d?.[0]?.price || 0);
      if (price > 1000) return price;
      throw new Error('Invalid price');
    },
    // Yahoo Finance XAUUSD spot
    async () => {
      const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/XAUUSD%3DX?interval=1m&range=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const d = await r.json();
      const price = parseFloat(d?.chart?.result?.[0]?.meta?.regularMarketPrice || 0);
      if (price > 1000) return price;
      throw new Error('Invalid price');
    },
    // Yahoo Finance Gold Futures
    async () => {
      const r = await fetch('https://query2.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1m&range=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const d = await r.json();
      const price = parseFloat(d?.chart?.result?.[0]?.meta?.regularMarketPrice || 0);
      if (price > 1000) return price;
      throw new Error('Invalid price');
    },
  ];

  for (const src of sources) {
    try {
      const price = await src();
      return res.status(200).json({ price, ts: Date.now() });
    } catch (e) { continue; }
  }

  return res.status(503).json({ error: 'All price sources failed' });
}
