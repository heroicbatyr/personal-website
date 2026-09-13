type StockOverview = {
  ticker: string;
  companyName: string | null;
  currency: string | null;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  marketCap: number | null;
  peRatio: number | null;
  eps: number | null;
  dividendYield: number | null;
  week52High: number | null;
  week52Low: number | null;
  updatedAt: string;
};

type PricePoint = { date: string; close: number };
type StockHistory = { ticker: string; range: string; points: PricePoint[]; updatedAt: string };
type ApiError = { message?: string };

const app = document.querySelector<HTMLElement>('[data-finance-app]');

if (app) {
  const configuredBase = app.dataset.apiBase?.replace(/\/$/, '') || 'https://server.batyrbek.com';
  const apiBase = window.location.hostname === 'server.batyrbek.com' ? window.location.origin : configuredBase;
  const form = app.querySelector<HTMLFormElement>('[data-stock-form]')!;
  const input = app.querySelector<HTMLInputElement>('[data-ticker-input]')!;
  const submit = app.querySelector<HTMLButtonElement>('[data-analyze]')!;
  const status = app.querySelector<HTMLElement>('[data-status]')!;
  const results = app.querySelector<HTMLElement>('[data-results]')!;
  const emptyState = app.querySelector<HTMLElement>('[data-empty-state]')!;

  const text = (selector: string, value: string) => {
    const element = app.querySelector<HTMLElement>(selector);
    if (element) element.textContent = value;
  };

  const number = (value: number | null, digits = 2) =>
    value == null ? '—' : new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value);

  const money = (value: number | null, currency: string | null) => {
    if (value == null) return '—';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2
      }).format(value);
    } catch {
      return `${number(value)} ${currency || ''}`.trim();
    }
  };

  const compactMoney = (value: number | null, currency: string | null) => {
    if (value == null) return '—';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: currency || 'USD', notation: 'compact', maximumFractionDigits: 2
      }).format(value);
    } catch {
      return number(value, 0);
    }
  };

  const setLoading = (loading: boolean) => {
    app.toggleAttribute('aria-busy', loading);
    submit.disabled = loading;
    submit.textContent = loading ? 'Loading…' : 'Analyze';
  };

  const fetchJson = async <T>(url: string): Promise<T> => {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const body = await response.json().catch(() => ({})) as T & ApiError;
    if (!response.ok) throw new Error(body.message || 'Market data is temporarily unavailable.');
    return body;
  };

  const renderOverview = (stock: StockOverview) => {
    const change = stock.changePercent;
    const direction = change == null || change === 0 ? 'neutral' : change > 0 ? 'positive' : 'negative';
    const sign = change != null && change > 0 ? '+' : '';
    text('[data-company-name]', stock.companyName || stock.ticker);
    text('[data-company-ticker]', stock.ticker);
    text('[data-price]', money(stock.price, stock.currency));
    text('[data-change]', change == null ? '—' : `${sign}${number(change)}%`);
    const changeElement = app.querySelector<HTMLElement>('[data-change]');
    if (changeElement) changeElement.dataset.direction = direction;
    text('[data-market-cap]', compactMoney(stock.marketCap, stock.currency));
    text('[data-pe]', number(stock.peRatio));
    text('[data-eps]', money(stock.eps, stock.currency));
    text('[data-dividend]', stock.dividendYield == null ? '—' : `${number(stock.dividendYield * 100)}%`);
    text('[data-week-low]', money(stock.week52Low, stock.currency));
    text('[data-week-high]', money(stock.week52High, stock.currency));
    text('[data-updated]', new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(stock.updatedAt)));
  };

  const svgElement = <K extends keyof SVGElementTagNameMap>(name: K) =>
    document.createElementNS('http://www.w3.org/2000/svg', name);

  const renderChart = (history: StockHistory) => {
    const svg = app.querySelector<SVGSVGElement>('[data-chart]')!;
    const points = history.points.filter(point => Number.isFinite(point.close));
    svg.replaceChildren();
    if (points.length < 2) {
      text('[data-chart-status]', 'Not enough historical data is available for this ticker.');
      return;
    }

    text('[data-chart-status]', '');
    text('[data-chart-start]', new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(`${points[0].date}T00:00:00Z`)));
    text('[data-chart-end]', new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(`${points.at(-1)!.date}T00:00:00Z`)));

    const width = 1000;
    const height = 360;
    const inset = 12;
    const values = points.map(point => point.close);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min || 1;
    const coordinates = points.map((point, index) => ({
      x: inset + (index / (points.length - 1)) * (width - inset * 2),
      y: inset + ((max - point.close) / spread) * (height - inset * 2)
    }));

    for (let index = 0; index < 4; index += 1) {
      const line = svgElement('line');
      const y = inset + (index / 3) * (height - inset * 2);
      line.setAttribute('x1', '0'); line.setAttribute('x2', String(width));
      line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y));
      line.setAttribute('class', 'chart-grid-line');
      svg.append(line);
    }

    const area = svgElement('path');
    const line = svgElement('path');
    const path = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
    area.setAttribute('d', `${path} L ${coordinates.at(-1)!.x.toFixed(2)} ${height} L ${coordinates[0].x.toFixed(2)} ${height} Z`);
    area.setAttribute('class', 'chart-area');
    line.setAttribute('d', path);
    line.setAttribute('class', 'chart-line');
    svg.append(area, line);
  };

  const analyze = async (rawTicker: string) => {
    const ticker = rawTicker.trim().toUpperCase();
    input.value = ticker;
    if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker)) {
      status.textContent = 'Enter a valid ticker using up to 10 letters, numbers, periods, or hyphens.';
      status.dataset.kind = 'error';
      return;
    }

    setLoading(true);
    status.textContent = `Loading ${ticker} market data…`;
    status.dataset.kind = 'loading';
    try {
      const [overviewResult, historyResult] = await Promise.allSettled([
        fetchJson<StockOverview>(`${apiBase}/api/stocks/${encodeURIComponent(ticker)}`),
        fetchJson<StockHistory>(`${apiBase}/api/stocks/${encodeURIComponent(ticker)}/history?range=1y`)
      ]);
      if (overviewResult.status === 'rejected') throw overviewResult.reason;
      renderOverview(overviewResult.value);
      if (historyResult.status === 'fulfilled') renderChart(historyResult.value);
      else text('[data-chart-status]', 'Price history is temporarily unavailable. The company metrics are still current.');
      emptyState.hidden = true;
      results.hidden = false;
      status.textContent = `${ticker} research loaded.`;
      status.dataset.kind = 'success';
    } catch (error) {
      results.hidden = true;
      emptyState.hidden = false;
      status.textContent = error instanceof Error ? error.message : 'Market data is temporarily unavailable.';
      status.dataset.kind = 'error';
    } finally {
      setLoading(false);
    }
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    void analyze(input.value);
  });

  app.querySelectorAll<HTMLButtonElement>('[data-quick-ticker]').forEach(button => {
    button.addEventListener('click', () => void analyze(button.dataset.quickTicker || ''));
  });

  void analyze('NVDA');
}
