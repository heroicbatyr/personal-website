package com.batyrbek.finance.dto;

import java.time.Instant;

public record StockOverview(
        String ticker, String companyName, String currency, Double price, Double change,
        Double changePercent, Long marketCap, Double peRatio, Double eps, Long volume,
        Double week52High, Double week52Low, Instant updatedAt, boolean stale
) {
    public StockOverview asStale() {
        return new StockOverview(ticker, companyName, currency, price, change, changePercent, marketCap,
                peRatio, eps, volume, week52High, week52Low, updatedAt, true);
    }
}
