package com.batyrbek.finance.service;

import java.time.Duration;
import java.util.function.Supplier;

import com.batyrbek.finance.cache.PersistentCacheStore;
import com.batyrbek.finance.cache.VercelSnapshotMirror;

import com.batyrbek.finance.dto.CompanyFundamentals;
import com.batyrbek.finance.dto.CompanyFinancials;
import com.batyrbek.finance.dto.StockHistory;
import com.batyrbek.finance.dto.StockOverview;
import com.batyrbek.finance.dto.StockQuote;
import com.batyrbek.finance.exception.StockProviderException;
import com.batyrbek.finance.provider.ProviderRouter;
import com.batyrbek.finance.provider.StockDataProvider;
import com.batyrbek.finance.validation.TickerNormalizer;
import com.github.benmanes.caffeine.cache.Cache;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class StockService {
    private static final Duration QUOTE_FRESH = Duration.ofHours(24);
    private static final Duration QUOTE_STALE = Duration.ofDays(2);
    private static final Duration FUNDAMENTALS_FRESH = Duration.ofHours(24);
    private static final Duration FUNDAMENTALS_STALE = Duration.ofDays(30);
    private static final Duration FINANCIALS_FRESH = Duration.ofDays(7);
    private static final Duration FINANCIALS_STALE = Duration.ofDays(60);
    private static final Duration HISTORY_FRESH = Duration.ofHours(24);
    private static final Duration HISTORY_STALE = Duration.ofDays(30);
    private final ProviderRouter providerRouter;
    private final TickerNormalizer tickerNormalizer;
    private final Cache<String, StockQuote> quoteCache;
    private final Cache<String, StockQuote> staleQuoteCache;
    private final Cache<String, CompanyFundamentals> fundamentalsCache;
    private final Cache<String, CompanyFundamentals> staleFundamentalsCache;
    private final Cache<String, CompanyFinancials> financialsCache;
    private final Cache<String, CompanyFinancials> staleFinancialsCache;
    private final Cache<String, StockHistory> historyCache;
    private final Cache<String, StockHistory> staleHistoryCache;
    private final PersistentCacheStore persistentCache;
    private final VercelSnapshotMirror snapshotMirror;

    public StockService(ProviderRouter providerRouter, TickerNormalizer tickerNormalizer,
                        @Qualifier("quoteCache") Cache<String, StockQuote> quoteCache,
                        @Qualifier("staleQuoteCache") Cache<String, StockQuote> staleQuoteCache,
                        @Qualifier("fundamentalsCache") Cache<String, CompanyFundamentals> fundamentalsCache,
                        @Qualifier("staleFundamentalsCache") Cache<String, CompanyFundamentals> staleFundamentalsCache,
                        @Qualifier("financialsCache") Cache<String, CompanyFinancials> financialsCache,
                        @Qualifier("staleFinancialsCache") Cache<String, CompanyFinancials> staleFinancialsCache,
                        @Qualifier("historyCache") Cache<String, StockHistory> historyCache,
                        @Qualifier("staleHistoryCache") Cache<String, StockHistory> staleHistoryCache,
                        PersistentCacheStore persistentCache,
                        VercelSnapshotMirror snapshotMirror) {
        this.providerRouter = providerRouter;
        this.tickerNormalizer = tickerNormalizer;
        this.quoteCache = quoteCache;
        this.staleQuoteCache = staleQuoteCache;
        this.fundamentalsCache = fundamentalsCache;
        this.staleFundamentalsCache = staleFundamentalsCache;
        this.financialsCache = financialsCache;
        this.staleFinancialsCache = staleFinancialsCache;
        this.historyCache = historyCache;
        this.staleHistoryCache = staleHistoryCache;
        this.persistentCache = persistentCache;
        this.snapshotMirror = snapshotMirror;
    }

    public StockOverview getOverview(String rawTicker) {
        String ticker = tickerNormalizer.normalize(rawTicker);
        StockDataProvider provider = providerRouter.forOverview(ticker);
        CachedResult<StockQuote> quote = cached("quotes-enriched", ticker, StockQuote.class, QUOTE_FRESH, QUOTE_STALE,
                quoteCache, staleQuoteCache,
                () -> provider.fetchQuote(ticker));
        CachedResult<CompanyFundamentals> fundamentals = cached("fundamentals-enriched", ticker, CompanyFundamentals.class,
                FUNDAMENTALS_FRESH, FUNDAMENTALS_STALE, fundamentalsCache, staleFundamentalsCache, () -> provider.fetchFundamentals(ticker));
        StockQuote q = quote.value();
        CompanyFundamentals f = fundamentals.value();
        StockOverview overview = new StockOverview(ticker, f.companyName(), f.currency(), q.price(), q.change(),
                q.changePercent(), f.marketCap(), firstNumber(q.peRatio(), f.peRatio()), firstNumber(q.eps(), f.eps()), q.volume(),
                firstNumber(q.week52High(), f.week52High()), firstNumber(q.week52Low(), f.week52Low()), f.exchange(), f.sector(), f.industry(), f.description(),
                f.ceo(), f.employees(), f.headquarters(), f.website(), f.revenueGrowth(), f.netMargin(),
                f.freeCashFlow(), "FMP", q.updatedAt(), quote.stale() || fundamentals.stale());
        snapshotMirror.backup("overview", ticker, overview.updatedAt(), overview);
        return overview;
    }

    public CompanyFinancials getFinancials(String rawTicker) {
        String ticker = tickerNormalizer.normalize(rawTicker);
        StockDataProvider provider = providerRouter.forFinancials(ticker);
        CachedResult<CompanyFinancials> result = cached("financials", ticker, CompanyFinancials.class,
                FINANCIALS_FRESH, FINANCIALS_STALE, financialsCache, staleFinancialsCache,
                () -> provider.fetchFinancials(ticker));
        return result.stale() ? result.value().asStale() : result.value();
    }

    public StockHistory getHistory(String rawTicker, String range) {
        String ticker = tickerNormalizer.normalize(rawTicker);
        StockDataProvider provider = providerRouter.forHistory(ticker);
        if (!"5y".equalsIgnoreCase(range == null ? "" : range.trim())) {
            throw new IllegalArgumentException("Only the 5y history range is supported; shorter ranges are derived client-side.");
        }
        CachedResult<StockHistory> history = cached("history", ticker, StockHistory.class, HISTORY_FRESH, HISTORY_STALE,
                historyCache, staleHistoryCache,
                () -> provider.fetchHistory(ticker));
        StockHistory value = history.value();
        StockHistory response = new StockHistory(value.ticker(), value.currency(), value.range(), value.resolution(),
                value.points(), value.updatedAt(), history.stale());
        snapshotMirror.backup("history", ticker, response.updatedAt(), response);
        return response;
    }

    private static Double firstNumber(Double preferred, Double fallback) {
        return preferred != null ? preferred : fallback;
    }

    private <T> CachedResult<T> cached(String namespace, String key, Class<T> type,
                                       Duration freshFor, Duration staleFor,
                                       Cache<String, T> freshCache, Cache<String, T> staleCache,
                                       Supplier<T> loader) {
        T memoryValue = freshCache.getIfPresent(key);
        if (memoryValue != null) return new CachedResult<>(memoryValue, false);

        T diskFresh = persistentCache.read(namespace, key, type, freshFor).orElse(null);
        if (diskFresh != null) {
            staleCache.put(key, diskFresh);
            return new CachedResult<>(diskFresh, false);
        }
        try {
            T value = freshCache.get(key, ignored -> {
                T loaded = loader.get();
                staleCache.put(key, loaded);
                persistentCache.write(namespace, key, loaded);
                return loaded;
            });
            return new CachedResult<>(value, false);
        } catch (StockProviderException exception) {
            T stale = staleCache.getIfPresent(key);
            if (stale == null) stale = persistentCache.read(namespace, key, type, staleFor).orElse(null);
            if (stale != null) return new CachedResult<>(stale, true);
            throw exception;
        }
    }

    private record CachedResult<T>(T value, boolean stale) {}
}
