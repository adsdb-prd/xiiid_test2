/* Static-host compatible; public endpoints, no API key embedded in the client.
 * BTC/SOL: Coinbase Exchange USD markets, rolling 24h change from open/last.
 * XIIID: DEX Screener, exact Solana base-token address, highest USD liquidity.
 * Docs: https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-stats
 *       https://docs.dexscreener.com/api/reference
 */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const counters = [...document.querySelectorAll('[data-count]')];
  // Future activity API integration: update data-count before starting this animation.
  const start = performance.now();
  function count(now) {
    const progress = reduced.matches ? 1 : Math.min((now - start) / 1600, 1);
    counters.forEach(node => {
      node.textContent = Math.round(Number(node.dataset.count) * (1 - (1 - progress) ** 3)).toLocaleString('en-US');
    });
    if (progress < 1) requestAnimationFrame(count);
  }
  requestAnimationFrame(count);

  const ribbon = document.querySelector('.x-ticker');
  if (!ribbon) return;
  const run = ribbon.querySelector('.x-ticker-run');
  const copy = run.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  run.parentNode.append(copy);
  const pause = ribbon.querySelector('button');
  pause.addEventListener('click', () => {
    const paused = ribbon.classList.toggle('is-paused');
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Resume price ticker' : 'Pause price ticker');
    pause.textContent = paused ? '▶' : 'Ⅱ';
  });
  const TOKEN = 'AtNfXEt9vSZtHovxVYKXrfFwATfddmeMvApugZzcdWiQ';
  const quotes = new Map();
  const valid = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
  async function json(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: 'omit' });
      if (!response.ok) throw new Error(`Market API: ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timeout); }
  }
  async function coinbase(symbol) {
    const data = await json(`https://api.exchange.coinbase.com/products/${symbol}-USD/stats`);
    if (!valid(data.last) || Number(data.last) <= 0 || !valid(data.open) || Number(data.open) <= 0) throw new Error('Invalid quote');
    return { price: Number(data.last), change: (Number(data.last) / Number(data.open) - 1) * 100, source: 'Coinbase' };
  }
  async function xiiid() {
    const data = await json(`https://api.dexscreener.com/tokens/v1/solana/${TOKEN}`);
    if (!Array.isArray(data)) throw new Error('Invalid pairs');
    const pair = data.filter(p => p.chainId === 'solana' && p.baseToken?.address === TOKEN && valid(p.priceUsd) && Number(p.priceUsd) > 0)
      .sort((a, b) => (Number(b.liquidity?.usd) || 0) - (Number(a.liquidity?.usd) || 0))[0];
    if (!pair) throw new Error('No XIIID market');
    return { price: Number(pair.priceUsd), change: valid(pair.priceChange?.h24) ? Number(pair.priceChange.h24) : null, source: 'DEX Screener' };
  }
  function render(symbol) {
    const quote = quotes.get(symbol);
    const stale = quote && (quote.failed || Date.now() - quote.time > 120000);
    ribbon.querySelectorAll(`[data-symbol="${symbol}"]`).forEach(node => {
      node.querySelector('.x-quote-price').textContent = quote ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: quote.price < 1 ? 8 : 2 }).format(quote.price) : '—';
      const change = node.querySelector('.x-quote-change');
      change.classList.remove('is-up', 'is-down');
      if (!quote) change.textContent = 'Unavailable';
      else if (stale) change.textContent = 'Stale';
      else if (quote.change === null) change.textContent = '24h —';
      else {
        change.textContent = `${quote.change > 0 ? '▲' : quote.change < 0 ? '▼' : '—'}${Math.abs(quote.change).toFixed(1)}%`;
        if (quote.change !== 0) change.classList.add(quote.change > 0 ? 'is-up' : 'is-down');
      }
      node.title = quote ? `${quote.source} · USD · 24h change · Updated ${new Date(quote.time).toLocaleTimeString()}${stale ? ' · Refresh unavailable' : ''}` : 'Price temporarily unavailable. Retrying automatically.';
    });
    ribbon.querySelector('.x-ticker-summary').textContent = [...run.querySelectorAll('.x-quote')].map(n => n.textContent).join('; ');
  }
  let busy = false;
  async function refresh() {
    if (busy || document.hidden) return;
    busy = true;
    try {
      await Promise.allSettled(['BTC', 'SOL', 'XIIID'].map(async symbol => {
        try {
          const quote = await (symbol === 'XIIID' ? xiiid() : coinbase(symbol));
          quotes.set(symbol, { ...quote, time: Date.now(), failed: false });
        } catch {
          if (quotes.has(symbol)) quotes.get(symbol).failed = true;
        }
        render(symbol);
      }));
    } finally { busy = false; }
  }
  refresh();
  setInterval(refresh, 60000);
  document.addEventListener('visibilitychange', () => {
    ['BTC', 'SOL', 'XIIID'].forEach(render);
    if (!document.hidden) refresh();
  });
})();
