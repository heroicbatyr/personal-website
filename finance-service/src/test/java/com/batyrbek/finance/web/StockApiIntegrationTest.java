package com.batyrbek.finance.web;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.batyrbek.finance.dto.CompanyFundamentals;
import com.batyrbek.finance.dto.PricePoint;
import com.batyrbek.finance.dto.StockHistory;
import com.batyrbek.finance.dto.StockQuote;
import com.batyrbek.finance.exception.ProviderRateLimitException;
import com.batyrbek.finance.exception.StockNotFoundException;
import com.batyrbek.finance.exception.StockProviderException;
import com.batyrbek.finance.provider.StockDataProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class StockApiIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StockDataProvider provider;

    @BeforeEach
    void providerResponses() {
        when(provider.fetchQuote("NVDA")).thenReturn(quote(184.21));
        when(provider.fetchQuote("AAPL")).thenReturn(quote(230.10));
        when(provider.fetchFundamentals("NVDA")).thenReturn(fundamentals("NVIDIA Corporation"));
        when(provider.fetchFundamentals("AAPL")).thenReturn(fundamentals("Apple Inc."));
        when(provider.fetchHistory("NVDA")).thenReturn(history("NVDA"));
        when(provider.fetchHistory("AAPL")).thenReturn(history("AAPL"));
        when(provider.fetchQuote("META")).thenThrow(new StockNotFoundException("META"));
        when(provider.fetchQuote("AMZN")).thenThrow(new ProviderRateLimitException());
        when(provider.fetchQuote("TSLA")).thenThrow(new StockProviderException("internal provider detail"));
    }

    @Test
    void servesNormalizedNvdaOverviewWithNarrowCors() throws Exception {
        mockMvc.perform(get("/api/stocks/nvda").header("Origin", "https://batyrbek.com"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://batyrbek.com"))
                .andExpect(jsonPath("$.ticker").value("NVDA"))
                .andExpect(jsonPath("$.stale").value(false))
                .andExpect(jsonPath("$.companyName").value("NVIDIA Corporation"))
                .andExpect(jsonPath("$.price").value(184.21));
    }

    @Test
    void servesAaplHistory() throws Exception {
        mockMvc.perform(get("/api/stocks/aapl/history").queryParam("range", "5y"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticker").value("AAPL"))
                .andExpect(jsonPath("$.currency").value("USD"))
                .andExpect(jsonPath("$.range").value("5y"))
                .andExpect(jsonPath("$.resolution").value("weekly"))
                .andExpect(jsonPath("$.points.length()").value(2));
    }

    @Test
    void servesSupportedStockCatalogWithoutProviderCalls() throws Exception {
        mockMvc.perform(get("/api/finance/supported-stocks").header("Origin", "https://batyrbek.com"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://batyrbek.com"))
                .andExpect(jsonPath("$.length()").value(53))
                .andExpect(jsonPath("$[0].symbol").value("NVDA"))
                .andExpect(jsonPath("$[0].fmp.history").value(true));
    }

    @Test
    void rejectsInvalidTickerAndUnknownCompanyClearly() throws Exception {
        mockMvc.perform(get("/api/stocks/bad$ticker"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_TICKER"))
                .andExpect(jsonPath("$.message").value("Ticker must be 1-10 letters, numbers, periods, or hyphens."));

        mockMvc.perform(get("/api/stocks/UNKNOWN"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("UNSUPPORTED_TICKER"));

        mockMvc.perform(get("/api/stocks/META"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TICKER_NOT_FOUND"));

        mockMvc.perform(get("/api/stocks/AMZN"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("PROVIDER_RATE_LIMITED"));

        mockMvc.perform(get("/api/stocks/TSLA"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("PROVIDER_UNAVAILABLE"))
                .andExpect(jsonPath("$.message").value("Market data is temporarily unavailable. Please try again later."));

    }


    private StockQuote quote(double price) {
        return new StockQuote(price, 1.2, 0.7, 12_000_000L, Instant.parse("2026-09-13T20:00:00Z"));
    }

    private CompanyFundamentals fundamentals(String name) {
        return new CompanyFundamentals(name, "USD", 1_000_000_000L, 25.0, 5.0,
                0.004, 250.0, 120.0, Instant.parse("2026-09-13T19:00:00Z"));
    }

    private StockHistory history(String ticker) {
        return new StockHistory(ticker, null, "5y", "weekly", List.of(
                new PricePoint(LocalDate.parse("2025-09-13"), 120.42),
                new PricePoint(LocalDate.parse("2026-09-12"), 184.21)),
                Instant.parse("2026-09-13T20:00:00Z"), false);
    }
}
