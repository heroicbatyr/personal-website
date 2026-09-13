package com.batyrbek.finance.provider;

import com.batyrbek.finance.dto.CompanyFundamentals;
import com.batyrbek.finance.dto.StockHistory;
import com.batyrbek.finance.dto.StockQuote;

public interface StockDataProvider {
    StockQuote fetchQuote(String ticker);
    CompanyFundamentals fetchFundamentals(String ticker);
    StockHistory fetchHistory(String ticker);
}
