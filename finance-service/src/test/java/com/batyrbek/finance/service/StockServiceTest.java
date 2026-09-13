package com.batyrbek.finance.service;

import java.time.Instant;

import com.batyrbek.finance.dto.StockOverview;
import com.batyrbek.finance.exception.StockProviderException;
import com.batyrbek.finance.provider.StockDataProvider;
import com.batyrbek.finance.validation.TickerNormalizer;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StockServiceTest {
    private final StockDataProvider provider = mock(StockDataProvider.class);
    private final Cache<String, StockOverview> overview = Caffeine.newBuilder().build();
    private final Cache<String, StockOverview> staleOverview = Caffeine.newBuilder().build();
    private final StockService service = new StockService(provider, new TickerNormalizer(), overview, staleOverview,
            Caffeine.newBuilder().build(), Caffeine.newBuilder().build());

    @Test
    void cachesNormalizedOverviewRequests() {
        StockOverview stock = stock("NVDA");
        when(provider.fetchOverview("NVDA")).thenReturn(stock);

        assertThat(service.getOverview(" nvda ")).isSameAs(stock);
        assertThat(service.getOverview("NVDA")).isSameAs(stock);
        verify(provider, times(1)).fetchOverview("NVDA");
    }

    @Test
    void returnsStaleOverviewWhenProviderTemporarilyFails() {
        StockOverview stock = stock("AAPL");
        when(provider.fetchOverview("AAPL")).thenReturn(stock).thenThrow(new StockProviderException("offline"));
        service.getOverview("AAPL");
        overview.invalidate("AAPL");

        assertThat(service.getOverview("AAPL")).isSameAs(stock);
    }

    @Test
    void rejectsUnsupportedHistoryRangeBeforeCallingProvider() {
        assertThatThrownBy(() -> service.getHistory("AAPL", "5y"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("1y");
    }

    private StockOverview stock(String ticker) {
        return new StockOverview(ticker, ticker + " Inc.", "USD", 100.0, 1.0, 1.0,
                1_000_000L, 20.0, 5.0, null, 110.0, 70.0, Instant.now());
    }
}
