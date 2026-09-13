package com.batyrbek.finance.provider;

import com.batyrbek.finance.dto.StockHistory;
import com.batyrbek.finance.dto.StockOverview;

public interface StockDataProvider {
    StockOverview fetchOverview(String ticker);
    StockHistory fetchHistory(String ticker, String range);
}
