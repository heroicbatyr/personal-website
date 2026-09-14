package com.batyrbek.finance.provider.fmp;

import java.time.LocalDate;
import java.time.ZoneOffset;

import com.batyrbek.finance.exception.ProviderRateLimitException;
import com.batyrbek.finance.exception.StockNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FmpStockDataProviderTest {
    @Test
    void mapsQuoteAndFundamentalsFromFmpResponses() {
        FmpStockDataProvider provider = providerFor(url -> {
            if (url.contains("/profile")) {
                return "[{\"companyName\":\"NVIDIA Corporation\",\"currency\":\"USD\",\"marketCap\":4500000000000}]";
            }
            if (url.contains("key-metrics-ttm")) return "[{\"earningsYieldTTM\":0.023364}]";
            if (url.contains("income-statement")) return "[{\"epsDiluted\":4.3}]";
            return "[{\"price\":184.21,\"change\":3.33,\"changePercentage\":1.84,\"volume\":52000000,\"yearHigh\":212.19,\"yearLow\":86.62}]";
        });

        var quote = provider.fetchQuote("NVDA");
        assertThat(quote.price()).isEqualTo(184.21);
        assertThat(quote.volume()).isEqualTo(52_000_000L);
        var fundamentals = provider.fetchFundamentals("NVDA");
        assertThat(fundamentals.companyName()).isEqualTo("NVIDIA Corporation");
        assertThat(fundamentals.marketCap()).isEqualTo(4500000000000L);
        assertThat(fundamentals.peRatio()).isCloseTo(42.8, org.assertj.core.data.Offset.offset(0.01));
        assertThat(fundamentals.eps()).isEqualTo(4.3);
        assertThat(fundamentals.dividendYield()).isNull();
    }

    @Test
    void mapsDailyFiveYearHistory() {
        LocalDate recent = LocalDate.now(ZoneOffset.UTC).minusDays(1);
        LocalDate older = LocalDate.now(ZoneOffset.UTC).minusYears(2);
        FmpStockDataProvider provider = providerFor(url -> "[{\"date\":\"" + recent + "\",\"close\":184.21},{\"date\":\"" + older + "\",\"close\":80.00}]");

        var history = provider.fetchHistory("NVDA");

        assertThat(history.resolution()).isEqualTo("daily");
        assertThat(history.points()).hasSize(2);
        assertThat(history.points().getFirst().date()).isEqualTo(older);
        assertThat(history.points().getLast().close()).isEqualTo(184.21);
    }

    @Test
    void classifiesProviderMessagesAsRateLimits() {
        FmpStockDataProvider provider = providerFor(url -> "{\"message\":\"Limit reached\"}");

        assertThatThrownBy(() -> provider.fetchQuote("NVDA"))
                .isInstanceOf(ProviderRateLimitException.class);
    }

    @Test
    void classifiesEmptyArraysAsUnknownTickers() {
        FmpStockDataProvider provider = providerFor(url -> "[]");

        assertThatThrownBy(() -> provider.fetchQuote("NOPE"))
                .isInstanceOf(StockNotFoundException.class);
    }

    private static FmpStockDataProvider providerFor(ResponseBody responseBody) {
        ExchangeFunction exchange = request -> Mono.just(response(request, responseBody.forUrl(request.url().toString())));
        return new FmpStockDataProvider(WebClient.builder().exchangeFunction(exchange).build(), "test-key");
    }

    private static ClientResponse response(ClientRequest request, String body) {
        return ClientResponse.create(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE).body(body).build();
    }

    private interface ResponseBody {
        String forUrl(String url);
    }
}
