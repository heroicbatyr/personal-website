package com.batyrbek.finance.provider.alphavantage;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import com.batyrbek.finance.dto.PricePoint;
import com.batyrbek.finance.dto.StockHistory;
import com.batyrbek.finance.dto.StockOverview;
import com.batyrbek.finance.exception.StockNotFoundException;
import com.batyrbek.finance.exception.StockProviderException;
import com.batyrbek.finance.provider.StockDataProvider;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Component
public class AlphaVantageStockDataProvider implements StockDataProvider {
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(12);
    private static final Duration MINIMUM_REQUEST_INTERVAL = Duration.ofMillis(1200);
    private final WebClient webClient;
    private final String apiKey;
    private final Object requestLock = new Object();
    private long nextRequestNanos;

    public AlphaVantageStockDataProvider(WebClient stockWebClient, @Value("${stock.provider.api-key}") String apiKey) {
        this.webClient = stockWebClient;
        this.apiKey = apiKey;
    }

    @Override
    public StockOverview fetchOverview(String ticker) {
        requireApiKey();
        JsonNode quote = request("GLOBAL_QUOTE", ticker);
        JsonNode company = request("OVERVIEW", ticker);
        JsonNode globalQuote = quote.path("Global Quote");
        if (globalQuote.isMissingNode() || globalQuote.isEmpty() || company.path("Symbol").asText().isBlank()) {
            throw new StockNotFoundException(ticker);
        }
        return new StockOverview(ticker, textOrNull(company, "Name"), textOrNull(company, "Currency"),
                doubleOrNull(globalQuote, "05. price"), doubleOrNull(globalQuote, "09. change"),
                percentOrNull(globalQuote, "10. change percent"), longOrNull(company, "MarketCapitalization"),
                doubleOrNull(company, "PERatio"), doubleOrNull(company, "EPS"),
                doubleOrNull(company, "DividendYield"), doubleOrNull(company, "52WeekHigh"),
                doubleOrNull(company, "52WeekLow"), Instant.now());
    }

    @Override
    public StockHistory fetchHistory(String ticker, String range) {
        requireApiKey();
        JsonNode series = request("TIME_SERIES_WEEKLY", ticker).path("Weekly Time Series");
        if (series.isMissingNode() || !series.isObject() || series.isEmpty()) throw new StockNotFoundException(ticker);
        LocalDate cutoff = LocalDate.now(ZoneOffset.UTC).minusYears(1);
        List<PricePoint> points = new ArrayList<>();
        Iterator<Map.Entry<String, JsonNode>> fields = series.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            LocalDate date = LocalDate.parse(entry.getKey());
            if (!date.isBefore(cutoff)) points.add(new PricePoint(date, doubleOrNull(entry.getValue(), "4. close")));
        }
        points.removeIf(point -> point.close() == null);
        points.sort(Comparator.comparing(PricePoint::date));
        return new StockHistory(ticker, range, List.copyOf(points), Instant.now());
    }

    private JsonNode request(String function, String ticker) {
        synchronized (requestLock) {
            paceRequest();
            return executeRequest(function, ticker);
        }
    }

    private JsonNode executeRequest(String function, String ticker) {
        try {
            JsonNode response = webClient.get().uri(uriBuilder -> uriBuilder.path("/query")
                            .queryParam("function", function).queryParam("symbol", ticker)
                            .queryParam("apikey", apiKey).build())
                    .retrieve().onStatus(HttpStatusCode::isError, clientResponse -> clientResponse.createException()
                            .map(exception -> new StockProviderException("The market-data provider is temporarily unavailable.")))
                    .bodyToMono(JsonNode.class).block(REQUEST_TIMEOUT);
            if (response == null) throw new StockProviderException("The market-data provider returned an empty response.");
            if (response.has("Error Message")) throw new StockNotFoundException(ticker);
            if (response.has("Note") || response.has("Information")) {
                throw new StockProviderException("The market-data provider is temporarily rate limited.");
            }
            return response;
        } catch (StockNotFoundException | StockProviderException exception) {
            throw exception;
        } catch (WebClientResponseException exception) {
            throw new StockProviderException("The market-data provider is temporarily unavailable.", exception);
        } catch (RuntimeException exception) {
            throw new StockProviderException("The market-data provider could not be reached.", exception);
        }
    }

    private void paceRequest() {
        long remainingNanos = nextRequestNanos - System.nanoTime();
        if (remainingNanos > 0) {
            try {
                Thread.sleep(Duration.ofNanos(remainingNanos));
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new StockProviderException("The market-data request was interrupted.", exception);
            }
        }
        nextRequestNanos = System.nanoTime() + MINIMUM_REQUEST_INTERVAL.toNanos();
    }

    private void requireApiKey() {
        if (apiKey == null || apiKey.isBlank()) throw new StockProviderException("The stock-data service is not configured yet.");
    }

    private static String textOrNull(JsonNode node, String field) {
        String value = node.path(field).asText("").trim();
        return value.isBlank() || "None".equalsIgnoreCase(value) || "-".equals(value) ? null : value;
    }

    private static Double doubleOrNull(JsonNode node, String field) {
        String value = textOrNull(node, field);
        if (value == null) return null;
        try { return Double.valueOf(value); } catch (NumberFormatException ignored) { return null; }
    }

    private static Double percentOrNull(JsonNode node, String field) {
        String value = textOrNull(node, field);
        if (value == null) return null;
        try { return Double.valueOf(value.replace("%", "").trim()); } catch (NumberFormatException ignored) { return null; }
    }

    private static Long longOrNull(JsonNode node, String field) {
        String value = textOrNull(node, field);
        if (value == null) return null;
        try { return Long.valueOf(value); } catch (NumberFormatException ignored) { return null; }
    }
}
