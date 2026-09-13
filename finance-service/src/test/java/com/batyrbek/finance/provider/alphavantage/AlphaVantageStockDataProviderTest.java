package com.batyrbek.finance.provider.alphavantage;

import java.time.LocalDate;
import java.time.ZoneOffset;

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
    void combinesFiveYearWeeklyAndRecentDailyHistory() {
        LocalDate recent = LocalDate.now(ZoneOffset.UTC).minusDays(7);
        LocalDate older = LocalDate.now(ZoneOffset.UTC).minusDays(14);
        LocalDate weeklyOlder = LocalDate.now(ZoneOffset.UTC).minusYears(2);
        LocalDate expired = LocalDate.now(ZoneOffset.UTC).minusYears(6);
        AlphaVantageStockDataProvider provider = providerFor((url) -> {
            if (url.contains("TIME_SERIES_WEEKLY")) {
                return "{\"Weekly Time Series\":{" +
                        "\"" + recent + "\":{\"4. close\":\"180.00\"}," +
                        "\"" + weeklyOlder + "\":{\"4. close\":\"80.00\"}," +
                        "\"" + expired + "\":{\"4. close\":\"40.00\"}}}";
            }
            return "{\"Time Series (Daily)\":{" +
                    "\"" + recent + "\":{\"4. close\":\"184.21\"}," +
                    "\"" + older + "\":{\"4. close\":\"175.00\"}}}";
        });

        StockHistory result = provider.fetchHistory("NVDA");

        assertThat(result.range()).isEqualTo("5y");
        assertThat(result.resolution()).isEqualTo("daily-weekly");
        assertThat(result.points()).hasSize(3);
        assertThat(result.points().getFirst().date()).isEqualTo(weeklyOlder);
        assertThat(result.points().getLast().date()).isEqualTo(recent);
        assertThat(result.points().getLast().close()).isEqualTo(184.21);
    }

    @Test
    void keepsWeeklyHistoryWhenOptionalDailyRequestIsRateLimited() {
        LocalDate date = LocalDate.now(ZoneOffset.UTC).minusDays(7);
        AlphaVantageStockDataProvider provider = providerFor((url) -> url.contains("TIME_SERIES_WEEKLY")
                ? "{\"Weekly Time Series\":{\"" + date + "\":{\"4. close\":\"184.21\"}}}"
                : "{\"Note\":\"rate limit\"}");

        StockHistory result = provider.fetchHistory("NVDA");

        assertThat(result.resolution()).isEqualTo("weekly");
        assertThat(result.points()).hasSize(1);
    }

    @Test
    void classifiesProviderRateLimits() {
        AlphaVantageStockDataProvider provider = providerFor((url) -> "{\"Information\":\"rate limit\"}");

        assertThatThrownBy(() -> provider.fetchQuote("NVDA"))
                .isInstanceOf(ProviderRateLimitException.class);
    }

    private AlphaVantageStockDataProvider providerFor(ResponseBody responseBody) {
        ExchangeFunction exchange = request -> Mono.just(ClientResponse.create(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(responseBody.forUrl(request.url().toString()))
                .build());
        return new AlphaVantageStockDataProvider(WebClient.builder().exchangeFunction(exchange).build(), "test-key");
    }

    private interface ResponseBody {
        String forUrl(String url);
    }
}
