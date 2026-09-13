package com.batyrbek.finance.provider.alphavantage;

import java.time.LocalDate;
import java.time.ZoneOffset;

import com.batyrbek.finance.dto.StockHistory;
import com.batyrbek.finance.dto.StockOverview;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;

class AlphaVantageStockDataProviderTest {
    @Test
    void mapsQuoteAndFundamentalsIntoNormalizedOverview() {
        AlphaVantageStockDataProvider provider = providerFor((url) -> {
            if (url.contains("GLOBAL_QUOTE")) {
                return "{\"Global Quote\":{\"01. symbol\":\"NVDA\",\"05. price\":\"184.21\",\"09. change\":\"3.33\",\"10. change percent\":\"1.84%\"}}";
            }
            return "{\"Symbol\":\"NVDA\",\"Name\":\"NVIDIA Corporation\",\"Currency\":\"USD\",\"MarketCapitalization\":\"4500000000000\",\"PERatio\":\"42.8\",\"EPS\":\"4.3\",\"DividendYield\":\"0.0002\",\"52WeekHigh\":\"212.19\",\"52WeekLow\":\"86.62\"}";
        });

        StockOverview result = provider.fetchOverview("NVDA");

        assertThat(result.companyName()).isEqualTo("NVIDIA Corporation");
        assertThat(result.price()).isEqualTo(184.21);
        assertThat(result.changePercent()).isEqualTo(1.84);
        assertThat(result.marketCap()).isEqualTo(4_500_000_000_000L);
        assertThat(result.updatedAt()).isNotNull();
    }

    @Test
    void returnsOneYearHistoryInAscendingOrder() {
        LocalDate recent = LocalDate.now(ZoneOffset.UTC).minusDays(7);
        LocalDate older = LocalDate.now(ZoneOffset.UTC).minusDays(14);
        LocalDate expired = LocalDate.now(ZoneOffset.UTC).minusYears(2);
        String body = "{\"Weekly Time Series\":{" +
                "\"" + recent + "\":{\"4. close\":\"184.21\"}," +
                "\"" + expired + "\":{\"4. close\":\"50.00\"}," +
                "\"" + older + "\":{\"4. close\":\"175.00\"}}}";
        AlphaVantageStockDataProvider provider = providerFor((url) -> body);

        StockHistory result = provider.fetchHistory("NVDA", "1y");

        assertThat(result.points()).hasSize(2);
        assertThat(result.points().getFirst().date()).isEqualTo(older);
        assertThat(result.points().getLast().date()).isEqualTo(recent);
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
