package com.batyrbek.finance.dto;

import java.time.Instant;
import java.util.List;

public record StockHistory(String ticker, String range, List<PricePoint> points, Instant updatedAt) {}
