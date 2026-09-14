package com.batyrbek.finance.dto;

import java.time.Instant;

public record StockQuote(
        Double price, Double change, Double changePercent, Long volume, Instant updatedAt
) {}
