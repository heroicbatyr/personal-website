package com.batyrbek.finance.web;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.batyrbek.finance.dto.PricePoint;
import com.batyrbek.finance.dto.StockHistory;
import com.batyrbek.finance.dto.StockOverview;
import com.batyrbek.finance.exception.StockNotFoundException;
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
        when(provider.fetchOverview("NVDA")).thenReturn(stock("NVDA", "NVIDIA Corporation", 184.21));
        when(provider.fetchOverview("AAPL")).thenReturn(stock("AAPL", "Apple Inc.", 230.10));
        when(provider.fetchHistory("NVDA", "1y")).thenReturn(history("NVDA"));
        when(provider.fetchHistory("AAPL", "1y")).thenReturn(history("AAPL"));
        when(provider.fetchOverview("UNKNOWN")).thenThrow(new StockNotFoundException("UNKNOWN"));
    }

    @Test
    void servesNormalizedNvdaOverviewWithNarrowCors() throws Exception {
        mockMvc.perform(get("/api/stocks/nvda").header("Origin", "https://batyrbek.com"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://batyrbek.com"))
                .andExpect(jsonPath("$.ticker").value("NVDA"))
                .andExpect(jsonPath("$.companyName").value("NVIDIA Corporation"))
                .andExpect(jsonPath("$.price").value(184.21));
    }

    @Test
    void servesAaplHistory() throws Exception {
        mockMvc.perform(get("/api/stocks/aapl/history").queryParam("range", "1y"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticker").value("AAPL"))
                .andExpect(jsonPath("$.range").value("1y"))
                .andExpect(jsonPath("$.points.length()").value(2));
    }

    @Test
    void rejectsInvalidTickerAndUnknownCompanyClearly() throws Exception {
        mockMvc.perform(get("/api/stocks/bad$ticker"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Ticker must be 1-10 letters, numbers, periods, or hyphens."));

        mockMvc.perform(get("/api/stocks/UNKNOWN"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("No public company was found for ticker UNKNOWN."));
    }

    private StockOverview stock(String ticker, String name, double price) {
        return new StockOverview(ticker, name, "USD", price, 1.2, 0.7, 1_000_000_000L,
                25.0, 5.0, 0.004, 250.0, 120.0, Instant.parse("2026-09-13T20:00:00Z"));
    }

    private StockHistory history(String ticker) {
        return new StockHistory(ticker, "1y", List.of(
                new PricePoint(LocalDate.parse("2025-09-13"), 120.42),
                new PricePoint(LocalDate.parse("2026-09-12"), 184.21)),
                Instant.parse("2026-09-13T20:00:00Z"));
    }
}
