package com.batyrbek.finance.dto;

import java.time.Instant;

public record StockOverview(
        String ticker, String companyName, String currency, Double price, Double change,
        Double changePercent, Long marketCap, Double peRatio, Double eps, Double dividendYield,
        Double week52High, Double week52Low, Instant updatedAt
) {}
