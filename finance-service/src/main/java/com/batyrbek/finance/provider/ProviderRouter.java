package com.batyrbek.finance.provider;

import com.batyrbek.finance.service.SupportedStockCatalog;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class ProviderRouter {
    private final StockDataProvider fmpProvider;
    private final SupportedStockCatalog supportedStocks;

    public ProviderRouter(@Qualifier("fmpStockDataProvider") StockDataProvider fmpProvider,
                          SupportedStockCatalog supportedStocks) {
        this.fmpProvider = fmpProvider;
        this.supportedStocks = supportedStocks;
    }

    public StockDataProvider forOverview(String symbol) {
        supportedStocks.requireOverview(symbol);
        return fmpProvider;
    }

    public StockDataProvider forHistory(String symbol) {
        supportedStocks.requireHistory(symbol);
        return fmpProvider;
    }
}
