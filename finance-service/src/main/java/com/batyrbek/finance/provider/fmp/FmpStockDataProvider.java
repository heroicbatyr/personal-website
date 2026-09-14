package com.batyrbek.finance.provider.fmp;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.TreeMap;

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

/** Maps FMP's stable endpoints into the provider-neutral dashboard models. */
@Component
public class FmpStockDataProvider implements StockDataProvider {
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(15);
    private final WebClient webClient;
    private final String apiKey;

    public FmpStockDataProvider(WebClient stockWebClient, @Value("${stock.provider.api-key:}") String apiKey) {
        this.webClient = stockWebClient;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
    }

    @Override
    public StockQuote fetchQuote(String ticker) {
        JsonNode quote = first(request("quote", ticker), ticker);
        return new StockQuote(number(quote, "price"), number(quote, "change"),
                number(quote, "changesPercentage", "changePercentage"), longNumber(quote, "volume"), Instant.now());
    }

    @Override
    public CompanyFundamentals fetchFundamentals(String ticker) {
        JsonNode profile = first(request("profile", ticker), ticker);
        JsonNode quote = first(request("quote", ticker), ticker);
        JsonNode metrics = first(request("key-metrics-ttm", ticker), ticker);
        JsonNode income = first(request("income-statement", ticker), ticker);
        return new CompanyFundamentals(text(profile, "companyName", "name"), text(profile, "currency"),
                longNumber(profile, "marketCap", "mktCap"), firstNumber(number(quote, "pe", "peRatio"), inverse(number(metrics, "earningsYieldTTM"))),
                firstNumber(number(quote, "eps"), number(income, "epsDiluted", "eps")), number(profile, "dividendYield"),
                number(quote, "yearHigh", "fiftyTwoWeekHigh"), number(quote, "yearLow", "fiftyTwoWeekLow"),
                Instant.now());
    }

    @Override
    public StockHistory fetchHistory(String ticker) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate cutoff = today.minusYears(5);
        JsonNode history = request("historical-price-eod/full", ticker, cutoff, today);
        if (!history.isArray() || history.isEmpty()) throw new StockNotFoundException(ticker);
        TreeMap<LocalDate, Double> points = new TreeMap<>();
        for (JsonNode point : history) {
            try {
                LocalDate date = LocalDate.parse(point.path("date").asText());
                Double close = number(point, "close");
                if (!date.isBefore(cutoff) && close != null) points.put(date, close);
            } catch (RuntimeException ignored) {
                // A malformed provider record must not discard an otherwise useful history series.
            }
        }
        if (points.isEmpty()) throw new StockNotFoundException(ticker);
        List<PricePoint> normalized = points.entrySet().stream()
                .map(entry -> new PricePoint(entry.getKey(), entry.getValue())).toList();
        return new StockHistory(ticker, "USD", "5y", "daily", normalized, Instant.now(), false);
    }

    private JsonNode request(String endpoint, String ticker) {
        return request(endpoint, ticker, null, null);
    }

    private JsonNode request(String endpoint, String ticker, LocalDate from, LocalDate to) {
        requireApiKey();
        try {
            JsonNode response = webClient.get().uri(uriBuilder -> {
                        var builder = uriBuilder.path("/stable/" + endpoint)
                                .queryParam("symbol", ticker).queryParam("apikey", apiKey);
                        if (from != null) builder.queryParam("from", from);
                        if (to != null) builder.queryParam("to", to);
                        return builder.build();
                    }).retrieve().onStatus(HttpStatusCode::isError, clientResponse -> clientResponse.createException()
                            .map(exception -> new StockProviderException("The market-data provider is temporarily unavailable.")))
                    .bodyToMono(JsonNode.class).block(REQUEST_TIMEOUT);
            if (response == null) throw new StockProviderException("The market-data provider returned an empty response.");
            if (response.has("Error Message") || response.has("error")) throw new StockNotFoundException(ticker);
            if (response.has("message") || response.has("Information") || response.has("Note")) {
                throw new ProviderRateLimitException();
            }
            return response;
        } catch (StockNotFoundException | StockProviderException exception) {
            throw exception;
        } catch (WebClientResponseException.TooManyRequests exception) {
            throw new ProviderRateLimitException();
        } catch (WebClientResponseException exception) {
            throw new StockProviderException("The market-data provider is temporarily unavailable.", exception);
        } catch (RuntimeException exception) {
            throw new StockProviderException("The market-data provider could not be reached.", exception);
        }
    }

    private static JsonNode first(JsonNode response, String ticker) {
        if (!response.isArray() || response.isEmpty()) throw new StockNotFoundException(ticker);
        return response.get(0);
    }

    private void requireApiKey() {
        if (apiKey.isBlank()) throw new StockProviderException("The stock-data service is not configured yet.");
    }

    private static String text(JsonNode node, String... fields) {
        for (String field : fields) {
            String value = node.path(field).asText("").trim();
            if (!value.isBlank() && !"null".equalsIgnoreCase(value)) return value;
        }
        return null;
    }

    private static Double number(JsonNode node, String... fields) {
        for (String field : fields) {
            JsonNode value = node.path(field);
            if (value.isNumber()) return value.doubleValue();
            String raw = value.asText("").trim();
            if (!raw.isBlank() && !"null".equalsIgnoreCase(raw)) {
                try { return Double.valueOf(raw.replace("%", "")); } catch (NumberFormatException ignored) { }
            }
        }
        return null;
    }

    private static Double firstNumber(Double preferred, Double fallback) {
        return preferred != null ? preferred : fallback;
    }

    private static Double inverse(Double value) {
        return value == null || value <= 0 ? null : 1 / value;
    }

    private static Long longNumber(JsonNode node, String... fields) {
        Double value = number(node, fields);
        return value == null ? null : value.longValue();
    }
}
