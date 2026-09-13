package com.batyrbek.finance.dto;

import java.time.Instant;

public record StockQuote(
        Double price, Double change, Double changePercent, Instant updatedAt
) {}
