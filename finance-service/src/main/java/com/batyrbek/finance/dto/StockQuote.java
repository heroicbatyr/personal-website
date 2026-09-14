package com.batyrbek.finance.dto;

import java.time.Instant;

public record StockQuote(
        Double price, Double change, Double changePercent, Long volume,
        Double peRatio, Double eps, Double week52High, Double week52Low,
        Instant updatedAt
) {}
