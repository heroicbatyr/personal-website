package com.batyrbek.finance.service;

import com.batyrbek.finance.dto.StockHistory;
import com.batyrbek.finance.dto.StockOverview;
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
    private final Cache<String, StockOverview> overviewCache;
    private final Cache<String, StockOverview> staleOverviewCache;
    private final Cache<String, StockHistory> historyCache;
    private final Cache<String, StockHistory> staleHistoryCache;

    public StockService(StockDataProvider provider, TickerNormalizer tickerNormalizer,
                        @Qualifier("overviewCache") Cache<String, StockOverview> overviewCache,
                        @Qualifier("staleOverviewCache") Cache<String, StockOverview> staleOverviewCache,
                        @Qualifier("historyCache") Cache<String, StockHistory> historyCache,
                        @Qualifier("staleHistoryCache") Cache<String, StockHistory> staleHistoryCache) {
        this.provider = provider;
        this.tickerNormalizer = tickerNormalizer;
        this.overviewCache = overviewCache;
        this.staleOverviewCache = staleOverviewCache;
        this.historyCache = historyCache;
        this.staleHistoryCache = staleHistoryCache;
    }

    public StockOverview getOverview(String rawTicker) {
        String ticker = tickerNormalizer.normalize(rawTicker);
        StockOverview cached = overviewCache.getIfPresent(ticker);
        if (cached != null) return cached;
        try {
            StockOverview result = provider.fetchOverview(ticker);
            overviewCache.put(ticker, result);
            staleOverviewCache.put(ticker, result);
            return result;
        } catch (StockProviderException exception) {
            StockOverview stale = staleOverviewCache.getIfPresent(ticker);
            if (stale != null) return stale;
            throw exception;
        }
    }

    public StockHistory getHistory(String rawTicker, String range) {
        String ticker = tickerNormalizer.normalize(rawTicker);
        if (!"1y".equalsIgnoreCase(range == null ? "" : range.trim())) {
            throw new IllegalArgumentException("Only the 1y history range is currently supported.");
        }
        String key = ticker + ":1y";
        StockHistory cached = historyCache.getIfPresent(key);
        if (cached != null) return cached;
        try {
            StockHistory result = provider.fetchHistory(ticker, "1y");
            historyCache.put(key, result);
            staleHistoryCache.put(key, result);
            return result;
        } catch (StockProviderException exception) {
            StockHistory stale = staleHistoryCache.getIfPresent(key);
            if (stale != null) return stale;
            throw exception;
        }
    }
}
