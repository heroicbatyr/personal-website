package com.batyrbek.finance.service;

import java.util.function.Supplier;

import com.batyrbek.finance.dto.CompanyFundamentals;
import com.batyrbek.finance.dto.StockHistory;
import com.batyrbek.finance.dto.StockOverview;
import com.batyrbek.finance.dto.StockQuote;
import com.batyrbek.finance.exception.StockProviderException;
import com.batyrbek.finance.provider.StockDataProvider;
import com.batyrbek.finance.validation.TickerNormalizer;
import com.github.benmanes.caffeine.cache.Cache;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class StockService {
    private final StockDataProvider provider;
    private final TickerNormalizer tickerNormalizer;
    private final Cache<String, StockQuote> quoteCache;
    private final Cache<String, StockQuote> staleQuoteCache;
    private final Cache<String, CompanyFundamentals> fundamentalsCache;
    private final Cache<String, CompanyFundamentals> staleFundamentalsCache;
    private final Cache<String, StockHistory> historyCache;
    private final Cache<String, StockHistory> staleHistoryCache;

    public StockService(StockDataProvider provider, TickerNormalizer tickerNormalizer,
                        @Qualifier("quoteCache") Cache<String, StockQuote> quoteCache,
                        @Qualifier("staleQuoteCache") Cache<String, StockQuote> staleQuoteCache,
                        @Qualifier("fundamentalsCache") Cache<String, CompanyFundamentals> fundamentalsCache,
                        @Qualifier("staleFundamentalsCache") Cache<String, CompanyFundamentals> staleFundamentalsCache,
                        @Qualifier("historyCache") Cache<String, StockHistory> historyCache,
                        @Qualifier("staleHistoryCache") Cache<String, StockHistory> staleHistoryCache) {
        this.provider = provider;
        this.tickerNormalizer = tickerNormalizer;
        this.quoteCache = quoteCache;
        this.staleQuoteCache = staleQuoteCache;
        this.fundamentalsCache = fundamentalsCache;
        this.staleFundamentalsCache = staleFundamentalsCache;
        this.historyCache = historyCache;
        this.staleHistoryCache = staleHistoryCache;
    }

    public StockOverview getOverview(String rawTicker) {
        String ticker = tickerNormalizer.normalize(rawTicker);
        CachedResult<StockQuote> quote = cached(ticker, quoteCache, staleQuoteCache,
                () -> provider.fetchQuote(ticker));
        CachedResult<CompanyFundamentals> fundamentals = cached(ticker, fundamentalsCache,
                staleFundamentalsCache, () -> provider.fetchFundamentals(ticker));
        StockQuote q = quote.value();
        CompanyFundamentals f = fundamentals.value();
        return new StockOverview(ticker, f.companyName(), f.currency(), q.price(), q.change(),
                q.changePercent(), f.marketCap(), f.peRatio(), f.eps(), f.dividendYield(),
                f.week52High(), f.week52Low(), q.updatedAt(), quote.stale() || fundamentals.stale());
    }

    public StockHistory getHistory(String rawTicker, String range) {
        String ticker = tickerNormalizer.normalize(rawTicker);
        if (!"5y".equalsIgnoreCase(range == null ? "" : range.trim())) {
            throw new IllegalArgumentException("Only the 5y history range is supported; shorter ranges are derived client-side.");
        }
        CachedResult<StockHistory> history = cached(ticker, historyCache, staleHistoryCache,
                () -> provider.fetchHistory(ticker));
        CachedResult<CompanyFundamentals> fundamentals = cached(ticker, fundamentalsCache,
                staleFundamentalsCache, () -> provider.fetchFundamentals(ticker));
        StockHistory value = history.value();
        return new StockHistory(value.ticker(), fundamentals.value().currency(), value.range(), value.resolution(),
                value.points(), value.updatedAt(), history.stale() || fundamentals.stale());
    }

    private <T> CachedResult<T> cached(String key, Cache<String, T> freshCache, Cache<String, T> staleCache,
                                       Supplier<T> loader) {
        try {
            T value = freshCache.get(key, ignored -> {
                T loaded = loader.get();
                staleCache.put(key, loaded);
                return loaded;
            });
            return new CachedResult<>(value, false);
        } catch (StockProviderException exception) {
            T stale = staleCache.getIfPresent(key);
            if (stale != null) return new CachedResult<>(stale, true);
            throw exception;
        }
    }

    private record CachedResult<T>(T value, boolean stale) {}
}
