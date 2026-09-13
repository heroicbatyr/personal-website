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
  stale: boolean;
};

type PricePoint = { date: string; close: number };
type StockHistory = {
  ticker: string;
  currency: string | null;
  range: string;
  resolution: 'daily-weekly' | 'weekly';
  points: PricePoint[];
  updatedAt: string;
  stale: boolean;
};
type ApiError = { code?: string; message?: string };
type ChartRange = '1w' | '1m' | '6m' | 'ytd' | '1y' | '5y';

class ApiRequestError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

const rangeLabels: Record<ChartRange, string> = {
  '1w': 'One week.', '1m': 'One month.', '6m': 'Six months.',
  ytd: 'Year to date.', '1y': 'One year.', '5y': 'Five years.'
};

const app = document.querySelector<HTMLElement>('[data-finance-app]');

if (app) {
  const configuredBase = app.dataset.apiBase?.replace(/\/$/, '') || 'https://server.batyrbek.com';
  const apiBase = window.location.hostname === 'server.batyrbek.com' ? window.location.origin : configuredBase;
  const snapshotBase = ['batyrbek.com', 'www.batyrbek.com'].includes(window.location.hostname)
    ? window.location.origin : null;
  const form = app.querySelector<HTMLFormElement>('[data-stock-form]')!;
  const input = app.querySelector<HTMLInputElement>('[data-ticker-input]')!;
  const chartWrap = app.querySelector<HTMLElement>('[data-chart-wrap]')!;
  let currentOverview: StockOverview | null = null;
  let currentHistory: StockHistory | null = null;
  let activeRange: ChartRange = '1y';
  let requestSequence = 0;
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
    if (!response.ok) throw new ApiRequestError(body.code || 'PROVIDER_UNAVAILABLE',
      body.message || 'Market data is temporarily unavailable.');
    return body;
  };

  const fetchMarketData = async <T>(url: string, ticker: string, kind: 'overview' | 'history'): Promise<T> => {
    try {
      return await fetchJson<T>(url);
    } catch (primaryError) {
      const canUseSnapshot = !(primaryError instanceof ApiRequestError)
        || ['PROVIDER_RATE_LIMITED', 'PROVIDER_UNAVAILABLE'].includes(primaryError.code);
      if (!snapshotBase || !canUseSnapshot) throw primaryError;
      try {
        const snapshotUrl = snapshotBase + '/api/finance-snapshot?ticker='
          + encodeURIComponent(ticker) + '&kind=' + kind;
        return await fetchJson<T>(snapshotUrl);
      } catch {
        throw primaryError;
      }
    }
  };

  const friendlyError = (error: unknown) => {
    if (!(error instanceof ApiRequestError)) return 'Market data is temporarily unavailable. Please try again.';
    if (error.code === 'TICKER_NOT_FOUND') return 'No public company was found for that ticker.';
    if (error.code === 'PROVIDER_RATE_LIMITED') return 'The market-data provider is rate limited. Please try again later.';
    if (error.code === 'INVALID_TICKER') return 'Enter a valid ticker using up to 10 letters, numbers, periods, or hyphens.';
    return 'Market data is temporarily unavailable. Please try again.';
  };

  const formatUpdatedTime = (value: string) => new Intl.DateTimeFormat('en', {
    hour: 'numeric', minute: '2-digit'
  }).format(new Date(value));

  const staleMessage = (updatedAt: string) =>
    `Live provider temporarily unavailable — showing cached data from ${formatUpdatedTime(updatedAt)}.`;

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

  const pointDate = (point: PricePoint) => new Date(`${point.date}T00:00:00Z`);

  const rangeStart = (range: ChartRange, end: Date) => {
    const start = new Date(end);
    if (range === '1w') start.setUTCDate(start.getUTCDate() - 7);
    if (range === '1m') start.setUTCMonth(start.getUTCMonth() - 1);
    if (range === '6m') start.setUTCMonth(start.getUTCMonth() - 6);
    if (range === 'ytd') start.setUTCMonth(0, 1);
    if (range === '1y') start.setUTCFullYear(start.getUTCFullYear() - 1);
    if (range === '5y') start.setUTCFullYear(start.getUTCFullYear() - 5);
    return start;
  };

  const pointsForRange = (history: StockHistory, range: ChartRange) => {
    const all = history.points.filter(point => Number.isFinite(point.close));
    if (!all.length) return all;
    const start = rangeStart(range, pointDate(all.at(-1)!));
    const visible = all.filter(point => pointDate(point) >= start);
    if (visible.length >= 2) return visible;
    const previous = all.filter(point => pointDate(point) < start).at(-1);
    return previous ? [previous, ...visible] : visible;
  };

  const appendText = (svg: SVGSVGElement, value: string, x: number, y: number, anchor: string) => {
    const label = svgElement('text');
    label.textContent = value;
    label.setAttribute('x', String(x)); label.setAttribute('y', String(y));
    label.setAttribute('text-anchor', anchor); label.setAttribute('class', 'chart-axis-label');
    svg.append(label);
  };

  const renderChart = (history: StockHistory) => {
    const svg = app.querySelector<SVGSVGElement>('[data-chart]')!;
    const tooltip = app.querySelector<HTMLElement>('[data-chart-tooltip]')!;
    const points = pointsForRange(history, activeRange);
    const currency = history.currency || currentOverview?.currency || 'USD';
    svg.replaceChildren();
    tooltip.hidden = true;
    text('[data-chart-heading]', rangeLabels[activeRange]);
    text('[data-resolution]', history.resolution === 'weekly' ? 'Weekly close' : 'Daily + weekly close');
    app.querySelectorAll<HTMLButtonElement>('[data-range]').forEach(button =>
      button.setAttribute('aria-pressed', String(button.dataset.range === activeRange)));
    if (points.length < 2) {
      text('[data-chart-status]', 'Not enough historical data is available for this period.');
      text('[data-performance]', '—');
      return;
    }

    text('[data-chart-status]', '');
    const performance = ((points.at(-1)!.close / points[0].close) - 1) * 100;
    const direction = performance === 0 ? 'neutral' : performance > 0 ? 'positive' : 'negative';
    const performanceElement = app.querySelector<HTMLElement>('[data-performance]')!;
    performanceElement.textContent = `${performance > 0 ? '+' : ''}${number(performance)}% over ${activeRange.toUpperCase()}`;
    performanceElement.dataset.direction = direction;

    const width = Math.max(chartWrap.clientWidth, 320);
    const height = Math.max(chartWrap.clientHeight, 240);
    const plot = { left: 8, top: 14, right: width - 72, bottom: height - 34 };
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const values = points.map(point => point.close);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const padding = (rawMax - rawMin || rawMax * .05 || 1) * .08;
    const min = rawMin - padding;
    const max = rawMax + padding;
    const spread = max - min;
    const startTime = pointDate(points[0]).getTime();
    const endTime = pointDate(points.at(-1)!).getTime();
    const timeSpread = endTime - startTime || 1;
    const coordinates = points.map(point => ({
      x: plot.left + ((pointDate(point).getTime() - startTime) / timeSpread) * (plot.right - plot.left),
      y: plot.top + ((max - point.close) / spread) * (plot.bottom - plot.top)
    }));

    for (let index = 0; index < 4; index += 1) {
      const y = plot.top + (index / 3) * (plot.bottom - plot.top);
      const grid = svgElement('line');
      grid.setAttribute('x1', String(plot.left)); grid.setAttribute('x2', String(plot.right));
      grid.setAttribute('y1', String(y)); grid.setAttribute('y2', String(y));
      grid.setAttribute('class', 'chart-grid-line');
      svg.append(grid);
      appendText(svg, money(max - (index / 3) * spread, currency), width - 4, y + 3, 'end');
    }

    const dateFormatter = new Intl.DateTimeFormat('en', activeRange === '1w' || activeRange === '1m'
      ? { month: 'short', day: 'numeric', timeZone: 'UTC' }
      : { month: 'short', year: '2-digit', timeZone: 'UTC' });
    const dateTicks = width < 560 ? 3 : 5;
    for (let index = 0; index < dateTicks; index += 1) {
      const ratio = index / (dateTicks - 1);
      const x = plot.left + ratio * (plot.right - plot.left);
      const date = new Date(startTime + ratio * timeSpread);
      appendText(svg, dateFormatter.format(date), x, height - 8,
        index === 0 ? 'start' : index === dateTicks - 1 ? 'end' : 'middle');
    }

    const path = coordinates.map((point, index) =>
      `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
    const area = svgElement('path');
    area.setAttribute('d', `${path} L ${coordinates.at(-1)!.x.toFixed(2)} ${plot.bottom} L ${coordinates[0].x.toFixed(2)} ${plot.bottom} Z`);
    area.setAttribute('class', 'chart-area');
    const line = svgElement('path');
    line.setAttribute('d', path); line.setAttribute('class', 'chart-line');
    const crosshair = svgElement('line');
    crosshair.setAttribute('y1', String(plot.top)); crosshair.setAttribute('y2', String(plot.bottom));
    crosshair.setAttribute('class', 'chart-crosshair'); crosshair.setAttribute('visibility', 'hidden');
    const dot = svgElement('circle');
    dot.setAttribute('r', '4'); dot.setAttribute('class', 'chart-hover-dot'); dot.setAttribute('visibility', 'hidden');
    svg.append(area, line, crosshair, dot);

    let selectedIndex = points.length - 1;
    const showPoint = (index: number) => {
      selectedIndex = Math.max(0, Math.min(points.length - 1, index));
      const coordinate = coordinates[selectedIndex];
      const point = points[selectedIndex];
      crosshair.removeAttribute('visibility'); dot.removeAttribute('visibility');
      tooltip.hidden = false;
      crosshair.setAttribute('x1', String(coordinate.x)); crosshair.setAttribute('x2', String(coordinate.x));
      dot.setAttribute('cx', String(coordinate.x)); dot.setAttribute('cy', String(coordinate.y));
      text('[data-tooltip-date]', new Intl.DateTimeFormat('en', {
        month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
      }).format(pointDate(point)));
      text('[data-tooltip-price]', money(point.close, currency));
      const tooltipWidth = tooltip.offsetWidth || 136;
      tooltip.style.left = `${Math.max(0, Math.min(width - tooltipWidth, coordinate.x - tooltipWidth / 2))}px`;
      tooltip.style.top = `${Math.max(4, coordinate.y - 72)}px`;
    };
    const hidePoint = () => {
      crosshair.setAttribute('visibility', 'hidden');
      dot.setAttribute('visibility', 'hidden');
      tooltip.hidden = true;
    };
    chartWrap.onpointermove = event => {
      const x = event.clientX - chartWrap.getBoundingClientRect().left;
      const nearest = coordinates.reduce((best, point, index) =>
        Math.abs(point.x - x) < Math.abs(coordinates[best].x - x) ? index : best, 0);
      showPoint(nearest);
    };
    chartWrap.onpointerleave = hidePoint;
    chartWrap.onkeydown = event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      showPoint(selectedIndex + (event.key === 'ArrowRight' ? 1 : -1));
    };
    svg.setAttribute('aria-label', `${history.ticker} ${activeRange.toUpperCase()} closing price chart, ${number(performance)} percent`);
  };

  const analyze = async (rawTicker: string) => {
    const sequence = ++requestSequence;
    const ticker = rawTicker.trim().toUpperCase();
    input.value = ticker;
    if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker)) {
      setLoading(false);
      status.textContent = 'Enter a valid ticker using up to 10 letters, numbers, periods, or hyphens.';
      status.dataset.kind = 'error';
      return;
    }

    setLoading(true);
    status.textContent = `Loading ${ticker} market data…`;
    status.dataset.kind = 'loading';
    try {
      const [overviewResult, historyResult] = await Promise.allSettled([
        fetchMarketData<StockOverview>(apiBase + '/api/stocks/' + encodeURIComponent(ticker), ticker, 'overview'),
        fetchMarketData<StockHistory>(apiBase + '/api/stocks/' + encodeURIComponent(ticker) + '/history?range=5y', ticker, 'history')
      ]);
      if (sequence !== requestSequence) return;
      if (overviewResult.status === 'rejected') throw overviewResult.reason;
      currentOverview = overviewResult.value;
      renderOverview(currentOverview);
      if (historyResult.status === 'fulfilled') {
        currentHistory = historyResult.value;
        activeRange = '1y';
        renderChart(currentHistory);
      } else {
        currentHistory = null;
        app.querySelector<SVGSVGElement>('[data-chart]')?.replaceChildren();
        text('[data-chart-status]', 'Price history is temporarily unavailable. The company metrics are still available.');
      }
      emptyState.hidden = true;
      results.hidden = false;
      const staleData = currentOverview.stale ? currentOverview :
        historyResult.status === 'fulfilled' && historyResult.value.stale ? historyResult.value : null;
      status.textContent = staleData ? staleMessage(staleData.updatedAt) :
        historyResult.status === 'rejected' ? `${ticker} metrics loaded; price history is temporarily unavailable.` :
          `${ticker} research loaded.`;
      status.dataset.kind = staleData || historyResult.status === 'rejected' ? 'notice' : 'success';
    } catch (error) {
      if (sequence !== requestSequence) return;
      status.textContent = friendlyError(error);
      status.dataset.kind = 'error';
      if (!currentOverview) {
        results.hidden = true;
        emptyState.hidden = false;
      }
    } finally {
      if (sequence === requestSequence) setLoading(false);
    }
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    void analyze(input.value);
  });

  app.querySelectorAll<HTMLButtonElement>('[data-quick-ticker]').forEach(button => {
    button.addEventListener('click', () => void analyze(button.dataset.quickTicker || ''));
  });


  app.querySelectorAll<HTMLButtonElement>('[data-range]').forEach(button => {
    button.addEventListener('click', () => {
      if (!currentHistory) return;
      activeRange = button.dataset.range as ChartRange;
      renderChart(currentHistory);
    });
  });

  let resizeFrame = 0;
  new ResizeObserver(() => {
    if (!currentHistory) return;
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      if (currentHistory) renderChart(currentHistory);
    });
  }).observe(chartWrap);
  void analyze('NVDA');
}
