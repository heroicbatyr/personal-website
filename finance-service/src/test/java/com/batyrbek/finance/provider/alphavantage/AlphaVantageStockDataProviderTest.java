package com.batyrbek.finance.provider.alphavantage;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicInteger;

import com.batyrbek.finance.cache.ProviderRateLimitCooldownStore;
import com.batyrbek.finance.dto.CompanyFundamentals;
import com.batyrbek.finance.dto.StockHistory;
import com.batyrbek.finance.dto.StockQuote;
import com.batyrbek.finance.exception.ProviderRateLimitException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

class AlphaVantageStockDataProviderTest {
    @Test
    void mapsQuoteAndFundamentalsSeparately() {
        AlphaVantageStockDataProvider provider = providerFor((url) -> {
            if (url.contains("GLOBAL_QUOTE")) {
                return "{\"Global Quote\":{\"01. symbol\":\"NVDA\",\"05. price\":\"184.21\",\"09. change\":\"3.33\",\"10. change percent\":\"1.84%\"}}";
            }
            return "{\"Symbol\":\"NVDA\",\"Name\":\"NVIDIA Corporation\",\"Currency\":\"USD\",\"MarketCapitalization\":\"4500000000000\",\"PERatio\":\"42.8\",\"EPS\":\"4.3\",\"DividendYield\":\"0.0002\",\"52WeekHigh\":\"212.19\",\"52WeekLow\":\"86.62\"}";
        });

        StockQuote quote = provider.fetchQuote("NVDA");
        CompanyFundamentals fundamentals = provider.fetchFundamentals("NVDA");

        assertThat(quote.price()).isEqualTo(184.21);
        assertThat(quote.changePercent()).isEqualTo(1.84);
        assertThat(fundamentals.companyName()).isEqualTo("NVIDIA Corporation");
        assertThat(fundamentals.marketCap()).isEqualTo(4_500_000_000_000L);
    }

    @Test
    void returnsWeeklyFiveYearHistoryWithOneUpstreamSeries() {
        LocalDate recent = LocalDate.now(ZoneOffset.UTC).minusDays(7);
        LocalDate weeklyOlder = LocalDate.now(ZoneOffset.UTC).minusYears(2);
        LocalDate expired = LocalDate.now(ZoneOffset.UTC).minusYears(6);
        AlphaVantageStockDataProvider provider = providerFor((url) -> "{\"Weekly Time Series\":{\"" + recent + "\":{\"4. close\":\"180.00\"}," +
                "\"" + weeklyOlder + "\":{\"4. close\":\"80.00\"}," +
                "\"" + expired + "\":{\"4. close\":\"40.00\"}}}");

        StockHistory result = provider.fetchHistory("NVDA");

        assertThat(result.range()).isEqualTo("5y");
        assertThat(result.resolution()).isEqualTo("weekly");
        assertThat(result.points()).hasSize(2);
        assertThat(result.points().getFirst().date()).isEqualTo(weeklyOlder);
        assertThat(result.points().getLast().date()).isEqualTo(recent);
        assertThat(result.points().getLast().close()).isEqualTo(180.00);
    }

    @Test
    void doesNotRequestOptionalDailyHistory() {
        LocalDate date = LocalDate.now(ZoneOffset.UTC).minusDays(7);
        AtomicInteger dailyCalls = new AtomicInteger();
        AlphaVantageStockDataProvider provider = providerFor((url) -> {
            if (url.contains("TIME_SERIES_DAILY")) {
                dailyCalls.incrementAndGet();
                return "{\"Note\":\"rate limit\"}";
            }
            return "{\"Weekly Time Series\":{\"" + date + "\":{\"4. close\":\"184.21\"}}}";
        });

        StockHistory result = provider.fetchHistory("NVDA");

        assertThat(result.resolution()).isEqualTo("weekly");
        assertThat(result.points()).hasSize(1);
        assertThat(dailyCalls).hasValue(0);
    }

    @Test
    void classifiesProviderRateLimits() {
        AlphaVantageStockDataProvider provider = providerFor((url) -> "{\"Information\":\"rate limit\"}");

        assertThatThrownBy(() -> provider.fetchQuote("NVDA"))
                .isInstanceOf(ProviderRateLimitException.class);
    }

    @Test
    void fallsBackToTheNextConfiguredKeyAfterRateLimit() {
        AtomicInteger calls = new AtomicInteger();
        ExchangeFunction exchange = request -> {
            calls.incrementAndGet();
            String body = request.url().toString().contains("apikey=first-key")
                    ? "{\"Information\":\"rate limit\"}"
                    : "{\"Global Quote\":{\"05. price\":\"184.21\"}}";
            return Mono.just(ClientResponse.create(HttpStatus.OK)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .body(body).build());
        };
        AlphaVantageStockDataProvider provider = new AlphaVantageStockDataProvider(
                WebClient.builder().exchangeFunction(exchange).build(), "first-key, second-key",
                Duration.ofMinutes(15), mock(ProviderRateLimitCooldownStore.class));

        assertThat(provider.fetchQuote("NVDA").price()).isEqualTo(184.21);
        assertThat(calls).hasValue(2);
    }

    private AlphaVantageStockDataProvider providerFor(ResponseBody responseBody) {
        ExchangeFunction exchange = request -> Mono.just(ClientResponse.create(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(responseBody.forUrl(request.url().toString()))
                .build());
        return new AlphaVantageStockDataProvider(WebClient.builder().exchangeFunction(exchange).build(), "test-key",
                Duration.ofMinutes(15), mock(ProviderRateLimitCooldownStore.class));
    }

    private interface ResponseBody {
        String forUrl(String url);
    }
}
