package com.batyrbek.finance.provider.alphavantage;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.atomic.AtomicInteger;

import com.batyrbek.finance.cache.ProviderRateLimitCooldownStore;
import com.batyrbek.finance.dto.CompanyFundamentals;
import com.batyrbek.finance.dto.PricePoint;
import com.batyrbek.finance.dto.StockHistory;
import com.batyrbek.finance.dto.StockQuote;
import com.batyrbek.finance.exception.ProviderRateLimitException;
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
    private static final Duration MINIMUM_REQUEST_INTERVAL = Duration.ofSeconds(12);
    private final WebClient webClient;
    private final List<String> apiKeys;
    private final ProviderRateLimitCooldownStore cooldownStore;
    private final Duration rateLimitCooldown;
    private final AtomicInteger nextApiKey = new AtomicInteger();
    private final Object requestLock = new Object();
    private long nextRequestNanos;

    public AlphaVantageStockDataProvider(WebClient stockWebClient,
                                         @Value("${stock.provider.api-keys}") String apiKeys,
                                         @Value("${stock.provider.rate-limit-cooldown:PT24H}") Duration rateLimitCooldown,
                                         ProviderRateLimitCooldownStore cooldownStore) {
        this.webClient = stockWebClient;
        this.apiKeys = apiKeys == null ? List.of() : java.util.Arrays.stream(apiKeys.split(","))
                .map(String::trim).filter(key -> !key.isBlank()).distinct().toList();
        this.rateLimitCooldown = rateLimitCooldown;
        this.cooldownStore = cooldownStore;
    }

    @Override
    public StockQuote fetchQuote(String ticker) {
        requireApiKey();
        JsonNode quote = request("GLOBAL_QUOTE", ticker);
        JsonNode globalQuote = quote.path("Global Quote");
        if (globalQuote.isMissingNode() || globalQuote.isEmpty()) throw new StockNotFoundException(ticker);
        return new StockQuote(doubleOrNull(globalQuote, "05. price"),
                doubleOrNull(globalQuote, "09. change"), percentOrNull(globalQuote, "10. change percent"),
                Instant.now());
    }

    @Override
    public CompanyFundamentals fetchFundamentals(String ticker) {
        requireApiKey();
        JsonNode company = request("OVERVIEW", ticker);
        if (company.path("Symbol").asText().isBlank()) throw new StockNotFoundException(ticker);
        return new CompanyFundamentals(textOrNull(company, "Name"), textOrNull(company, "Currency"),
                longOrNull(company, "MarketCapitalization"),
                doubleOrNull(company, "PERatio"), doubleOrNull(company, "EPS"),
                doubleOrNull(company, "DividendYield"), doubleOrNull(company, "52WeekHigh"),
                doubleOrNull(company, "52WeekLow"), Instant.now());
    }

    @Override
    public StockHistory fetchHistory(String ticker) {
        requireApiKey();
        JsonNode weeklySeries = request("TIME_SERIES_WEEKLY", ticker).path("Weekly Time Series");
        if (weeklySeries.isMissingNode() || !weeklySeries.isObject() || weeklySeries.isEmpty()) {
            throw new StockNotFoundException(ticker);
        }
        LocalDate cutoff = LocalDate.now(ZoneOffset.UTC).minusYears(5);
        TreeMap<LocalDate, Double> weekly = readSeries(weeklySeries, cutoff);
        List<PricePoint> points = weekly.entrySet().stream()
                .map(entry -> new PricePoint(entry.getKey(), entry.getValue())).toList();
        return new StockHistory(ticker, null, "5y", "weekly", points, Instant.now(), false);
    }

    private static TreeMap<LocalDate, Double> readSeries(JsonNode series, LocalDate cutoff) {
        TreeMap<LocalDate, Double> points = new TreeMap<>();
        Iterator<Map.Entry<String, JsonNode>> fields = series.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            LocalDate date = LocalDate.parse(entry.getKey());
            Double close = doubleOrNull(entry.getValue(), "4. close");
            if (!date.isBefore(cutoff) && close != null) points.put(date, close);
        }
        return points;
    }

    private JsonNode request(String function, String ticker) {
        synchronized (requestLock) {
            int startIndex = Math.floorMod(nextApiKey.getAndIncrement(), apiKeys.size());
            ProviderRateLimitException lastRateLimit = null;
            for (int offset = 0; offset < apiKeys.size(); offset++) {
                String apiKey = apiKeys.get((startIndex + offset) % apiKeys.size());
                if (cooldownStore.isBlocked(apiKey)) continue;
                paceRequest();
                try {
                    return executeRequest(function, ticker, apiKey);
                } catch (ProviderRateLimitException exception) {
                    cooldownStore.block(apiKey, rateLimitCooldown);
                    lastRateLimit = exception;
                }
            }
            throw lastRateLimit == null ? new ProviderRateLimitException() : lastRateLimit;
        }
    }

    private JsonNode executeRequest(String function, String ticker, String apiKey) {
        try {
            JsonNode response = webClient.get().uri(uriBuilder -> uriBuilder.path("/query")
                            .queryParam("function", function).queryParam("symbol", ticker)
                            .queryParam("apikey", apiKey).build())
                    .retrieve().onStatus(HttpStatusCode::isError, clientResponse -> clientResponse.createException()
                            .map(exception -> new StockProviderException("The market-data provider is temporarily unavailable.")))
                    .bodyToMono(JsonNode.class).block(REQUEST_TIMEOUT);
            if (response == null) throw new StockProviderException("The market-data provider returned an empty response.");
            if (response.has("Error Message")) throw new StockNotFoundException(ticker);
            if (response.has("Note") || response.has("Information")) throw new ProviderRateLimitException();
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
        if (apiKeys.isEmpty()) throw new StockProviderException("The stock-data service is not configured yet.");
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
