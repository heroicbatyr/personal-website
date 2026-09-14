export {};
type StockOverview = {
  ticker: string; companyName: string | null; currency: string | null; price: number | null;
  marketCap: number | null; peRatio: number | null; eps: number | null;
  week52High: number | null; week52Low: number | null;
};
type PricePoint = { date: string; close: number };
type StockHistory = { ticker: string; points: PricePoint[] };
type CompareRange = '1m' | '6m' | '1y' | '5y';

const app = document.querySelector<HTMLElement>('[data-compare-app]');
if (app) {
  const apiBase = app.dataset.apiBase?.replace(/\/$/, '') || 'https://server.batyrbek.com';
  const firstSelect = app.querySelector<HTMLSelectElement>('[data-first-symbol]')!;
  const secondSelect = app.querySelector<HTMLSelectElement>('[data-second-symbol]')!;
  const status = app.querySelector<HTMLElement>('[data-compare-status]')!;
  const results = app.querySelector<HTMLElement>('[data-compare-results]')!;
  const table = app.querySelector<HTMLElement>('[data-comparison-table]')!;
  let activeRange: CompareRange = '1y';
  let overviews: [StockOverview, StockOverview] | null = null;
  let histories: [StockHistory, StockHistory] | null = null;

  const params = new URLSearchParams(window.location.search);
  const requested = (params.get('symbols') || 'NVDA,AMD').toUpperCase().split(',');
  if ([...firstSelect.options].some(option => option.value === requested[0])) firstSelect.value = requested[0];
  if ([...secondSelect.options].some(option => option.value === requested[1])) secondSelect.value = requested[1];

  const number = (value: number | null, digits = 2) => value == null ? '—'
    : new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value);
  const money = (value: number | null, currency: string | null, compact = false) => {
    if (value == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD',
      notation: compact ? 'compact' : 'standard', maximumFractionDigits: 2 }).format(value);
  };
  const setText = (selector: string, value: string) => {
    const element = app.querySelector<HTMLElement>(selector);
    if (element) element.textContent = value;
  };
  const fetchJson = async <T>(path: string) => {
    const response = await fetch(apiBase + path, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Market data is temporarily unavailable.');
    return response.json() as Promise<T>;
  };
  const pointDate = (point: PricePoint) => new Date(`${point.date}T00:00:00Z`);
  const startFor = (range: CompareRange, end: Date) => {
    const start = new Date(end);
    if (range === '1m') start.setUTCMonth(start.getUTCMonth() - 1);
    if (range === '6m') start.setUTCMonth(start.getUTCMonth() - 6);
    if (range === '1y') start.setUTCFullYear(start.getUTCFullYear() - 1);
    if (range === '5y') start.setUTCFullYear(start.getUTCFullYear() - 5);
    return start;
  };
  const visiblePoints = (history: StockHistory) => {
    const clean = history.points.filter(point => Number.isFinite(point.close));
    if (!clean.length) return clean;
    const start = startFor(activeRange, pointDate(clean.at(-1)!));
    return clean.filter(point => pointDate(point) >= start);
  };
  const performance = (points: PricePoint[]) => points.length < 2 ? null
    : ((points.at(-1)!.close / points[0].close) - 1) * 100;
  const formatReturn = (value: number | null) => value == null ? '—'
    : `${value > 0 ? '+' : ''}${number(value)}%`;
  const svgNode = <K extends keyof SVGElementTagNameMap>(name: K) =>
    document.createElementNS('http://www.w3.org/2000/svg', name);

  const renderChart = () => {
    if (!histories) return;
    const series = histories.map(visiblePoints) as [PricePoint[], PricePoint[]];
    const svg = app.querySelector<SVGSVGElement>('[data-compare-chart]')!;
    svg.replaceChildren();
    app.querySelectorAll<HTMLButtonElement>('[data-compare-range]').forEach(button =>
      button.setAttribute('aria-pressed', String(button.dataset.compareRange === activeRange)));
    const returns = series.map(performance);
    setText('[data-first-return]', formatReturn(returns[0]));
    setText('[data-second-return]', formatReturn(returns[1]));
    if (series.some(points => points.length < 2)) {
      setText('[data-chart-message]', 'Not enough overlapping history is available for this period.');
      return;
    }
    setText('[data-chart-message]', '');
    const normalized = series.map(points => points.map(point => ({ date: pointDate(point), value: point.close / points[0].close * 100 })));
    const all = normalized.flat();
    const minDate = Math.min(...all.map(point => point.date.getTime()));
    const maxDate = Math.max(...all.map(point => point.date.getTime()));
    const rawMin = Math.min(...all.map(point => point.value));
    const rawMax = Math.max(...all.map(point => point.value));
    const padding = (rawMax - rawMin || 5) * .1;
    const min = rawMin - padding; const max = rawMax + padding;
    const width = Math.max(svg.clientWidth, 320); const height = Math.max(svg.clientHeight, 260);
    const plot = { left: 8, top: 15, right: width - 58, bottom: height - 32 };
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    for (let index = 0; index < 4; index += 1) {
      const y = plot.top + index / 3 * (plot.bottom - plot.top);
      const line = svgNode('line'); line.setAttribute('x1', String(plot.left)); line.setAttribute('x2', String(plot.right));
      line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y)); line.setAttribute('class', 'compare-grid'); svg.append(line);
      const label = svgNode('text'); label.textContent = number(max - index / 3 * (max - min), 1);
      label.setAttribute('x', String(width - 4)); label.setAttribute('y', String(y + 3)); label.setAttribute('text-anchor', 'end'); label.setAttribute('class', 'compare-axis'); svg.append(label);
    }
    normalized.forEach((points, seriesIndex) => {
      const path = points.map((point, index) => {
        const x = plot.left + (point.date.getTime() - minDate) / (maxDate - minDate || 1) * (plot.right - plot.left);
        const y = plot.top + (max - point.value) / (max - min || 1) * (plot.bottom - plot.top);
        return `${index ? 'L' : 'M'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      }).join(' ');
      const line = svgNode('path'); line.setAttribute('d', path);
      line.setAttribute('class', seriesIndex === 0 ? 'compare-line-first' : 'compare-line-second'); svg.append(line);
    });
    const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', year: '2-digit', timeZone: 'UTC' });
    [0, .5, 1].forEach((ratio, index) => {
      const label = svgNode('text'); label.textContent = dateFormat.format(new Date(minDate + ratio * (maxDate - minDate)));
      label.setAttribute('x', String(plot.left + ratio * (plot.right - plot.left))); label.setAttribute('y', String(height - 7));
      label.setAttribute('text-anchor', index === 0 ? 'start' : index === 2 ? 'end' : 'middle'); label.setAttribute('class', 'compare-axis'); svg.append(label);
    });
  };

  const renderTable = () => {
    if (!overviews) return;
    const [first, second] = overviews;
    setText('[data-table-first]', first.ticker); setText('[data-table-second]', second.ticker);
    const rows: Array<[string, (stock: StockOverview) => string]> = [
      ['market-cap', stock => money(stock.marketCap, stock.currency, true)],
      ['pe', stock => number(stock.peRatio)], ['eps', stock => money(stock.eps, stock.currency)],
      ['low', stock => money(stock.week52Low, stock.currency)], ['high', stock => money(stock.week52High, stock.currency)]
    ];
    rows.forEach(([key, format]) => { setText(`[data-first-${key}]`, format(first)); setText(`[data-second-${key}]`, format(second)); });
  };

  const load = async () => {
    const first = firstSelect.value; const second = secondSelect.value;
    if (first === second) { status.textContent = 'Choose two different companies.'; status.dataset.kind = 'error'; return; }
    status.textContent = `Loading ${first} and ${second}…`; status.dataset.kind = 'loading';
    try {
      const [firstOverview, secondOverview, firstHistory, secondHistory] = await Promise.all([
        fetchJson<StockOverview>(`/api/stocks/${first}`), fetchJson<StockOverview>(`/api/stocks/${second}`),
        fetchJson<StockHistory>(`/api/stocks/${first}/history?range=5y`), fetchJson<StockHistory>(`/api/stocks/${second}/history?range=5y`)
      ]);
      overviews = [firstOverview, secondOverview]; histories = [firstHistory, secondHistory];
      setText('[data-compare-title]', `${first} vs ${second}`); setText('[data-first-label]', first); setText('[data-second-label]', second);
      window.history.replaceState({}, '', `/finance/compare?symbols=${first},${second}`);
      renderChart(); renderTable(); results.hidden = false; table.hidden = false;
      status.textContent = `${first} and ${second} comparison loaded.`; status.dataset.kind = 'success';
    } catch { status.textContent = 'Comparison data is temporarily unavailable. Your previous result is still shown.'; status.dataset.kind = 'error'; }
  };

  app.querySelector<HTMLFormElement>('[data-compare-form]')!.addEventListener('submit', event => { event.preventDefault(); void load(); });
  app.querySelectorAll<HTMLButtonElement>('[data-compare-range]').forEach(button => button.addEventListener('click', () => {
    activeRange = button.dataset.compareRange as CompareRange; renderChart();
  }));
  new ResizeObserver(() => { if (histories) renderChart(); }).observe(app.querySelector('[data-compare-chart]')!);
  void load();
}
