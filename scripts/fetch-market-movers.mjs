// Fetches live NSE gainers/losers and writes market-movers.json for the site's ticker ribbon.
// Run by .github/workflows/market-movers.yml on a schedule (Node 20+, global fetch).

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'application/json',
};

const POOLS = ['NIFTY', 'NIFTYNEXT50'];

async function fetchSide(index) {
  const url = `https://www.nseindia.com/api/live-analysis-variations?index=${index}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`NSE request failed for index=${index}: ${res.status}`);
  return res.json();
}

function collect(json) {
  const rows = [];
  for (const pool of POOLS) {
    const data = json?.[pool]?.data;
    if (Array.isArray(data)) rows.push(...data);
  }
  return rows;
}

function dedupeBySymbol(rows) {
  const seen = new Map();
  for (const r of rows) {
    if (!seen.has(r.symbol)) seen.set(r.symbol, r);
  }
  return [...seen.values()];
}

async function main() {
  const [gainersJson, losersJson] = await Promise.all([
    fetchSide('gainers'),
    fetchSide('loosers'), // NSE's own spelling
  ]);

  const gainers = dedupeBySymbol(collect(gainersJson))
    .sort((a, b) => b.net_price - a.net_price)
    .slice(0, 10)
    .map((r) => ({ symbol: r.symbol, ltp: r.ltp, change: r.net_price, type: 'gainer' }));

  const losers = dedupeBySymbol(collect(losersJson))
    .sort((a, b) => a.net_price - b.net_price)
    .slice(0, 10)
    .map((r) => ({ symbol: r.symbol, ltp: r.ltp, change: r.net_price, type: 'loser' }));

  if (gainers.length === 0 || losers.length === 0) {
    throw new Error('NSE returned no gainers/losers data, aborting write');
  }

  const movers = [];
  for (let i = 0; i < Math.max(gainers.length, losers.length); i++) {
    if (gainers[i]) movers.push(gainers[i]);
    if (losers[i]) movers.push(losers[i]);
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    movers,
  };

  const fs = await import('node:fs/promises');
  await fs.writeFile('market-movers.json', JSON.stringify(payload, null, 2) + '\n');
  console.log(`Wrote market-movers.json with ${movers.length} movers`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
