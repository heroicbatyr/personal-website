package com.batyrbek.finance.dto;

import java.time.Instant;
import java.util.List;

public record StockHistory(
        String ticker, String currency, String range, String resolution,
        List<PricePoint> points, Instant updatedAt, boolean stale
) {
    public StockHistory asStale() {
        return new StockHistory(ticker, currency, range, resolution, points, updatedAt, true);
    }
}
