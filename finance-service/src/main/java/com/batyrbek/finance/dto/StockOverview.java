package com.batyrbek.finance.dto;

import java.time.Instant;

public record StockOverview(
        String ticker, String companyName, String currency, Double price, Double change,
        Double changePercent, Long marketCap, Double peRatio, Double eps, Long volume,
        Double week52High, Double week52Low, String exchange, String sector, String industry,
        String description, String ceo, Long employees, String headquarters, String website,
        Double revenueGrowth, Double netMargin, Double freeCashFlow,
        String source, Instant updatedAt, boolean stale
) {
    public StockOverview asStale() {
        return new StockOverview(ticker, companyName, currency, price, change, changePercent, marketCap,
                peRatio, eps, volume, week52High, week52Low, exchange, sector, industry,
                description, ceo, employees, headquarters, website, revenueGrowth, netMargin,
                freeCashFlow, source, updatedAt, true);
    }
}
