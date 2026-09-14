export {};
type SupportedStock = {
  symbol: string;
  name: string;
  sector: string;
  category: string;
  popular: boolean;
};

const app = document.querySelector<HTMLElement>('[data-finance-landing]');

if (app) {
  const stocks = JSON.parse(app.dataset.stocks || '[]') as SupportedStock[];
  const input = app.querySelector<HTMLInputElement>('[data-catalog-input]')!;
  const form = app.querySelector<HTMLFormElement>('[data-catalog-form]')!;
  const results = app.querySelector<HTMLElement>('[data-catalog-results]')!;
  const status = app.querySelector<HTMLElement>('[data-catalog-status]')!;

  const matches = (query: string) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return stocks.filter(stock => stock.popular).slice(0, 8);
    return stocks.filter(stock => stock.symbol.toLowerCase().startsWith(normalized)
      || stock.name.toLowerCase().includes(normalized)).slice(0, 8);
  };

  const renderMatches = (query: string) => {
    const visible = matches(query);
    results.replaceChildren(...visible.map(stock => {
      const link = document.createElement('a');
      link.href = `/finance/${stock.symbol}`;
      link.setAttribute('role', 'option');
      link.innerHTML = `<b>${stock.symbol}</b><span>${stock.name}</span><small>${stock.sector}</small>`;
      return link;
    }));
    results.hidden = visible.length === 0;
    status.textContent = visible.length === 0
      ? 'No confirmed FMP company matches that search.'
      : `${stocks.length} confirmed companies available.`;
    status.dataset.kind = visible.length === 0 ? 'error' : 'neutral';
  };

  input.addEventListener('input', () => renderMatches(input.value));
  input.addEventListener('focus', () => renderMatches(input.value));
  document.addEventListener('click', event => {
    if (!form.contains(event.target as Node)) results.hidden = true;
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const query = input.value.trim().toLowerCase();
    const exact = stocks.find(stock => stock.symbol.toLowerCase() === query
      || stock.name.toLowerCase() === query);
    const target = exact || matches(query)[0];
    if (target) window.location.href = `/finance/${target.symbol}`;
    else renderMatches(query);
  });

  const sectorResults = app.querySelector<HTMLElement>('[data-sector-results]')!;
  app.querySelectorAll<HTMLButtonElement>('[data-sector]').forEach(button => {
    button.addEventListener('click', () => {
      const sector = button.dataset.sector || '';
      app.querySelectorAll<HTMLButtonElement>('[data-sector]').forEach(item =>
        item.setAttribute('aria-pressed', String(item === button)));
      const sectorStocks = stocks.filter(stock => stock.sector === sector);
      sectorResults.replaceChildren(...sectorStocks.map(stock => {
        const link = document.createElement('a');
        link.href = `/finance/${stock.symbol}`;
        link.textContent = `${stock.symbol} · ${stock.name}`;
        return link;
      }));
      sectorResults.hidden = false;
    });
  });

  const recentSymbols = JSON.parse(localStorage.getItem('finance-recent') || '[]') as string[];
  const recentStocks = recentSymbols.map(symbol => stocks.find(stock => stock.symbol === symbol))
    .filter((stock): stock is SupportedStock => Boolean(stock)).slice(0, 6);
  if (recentStocks.length) {
    const recentSection = app.querySelector<HTMLElement>('[data-recent-section]')!;
    const recentList = app.querySelector<HTMLElement>('[data-recent-list]')!;
    recentList.replaceChildren(...recentStocks.map(stock => {
      const link = document.createElement('a');
      link.href = `/finance/${stock.symbol}`;
      link.textContent = `${stock.symbol} · ${stock.name}`;
      return link;
    }));
    recentSection.hidden = false;
  }
}
