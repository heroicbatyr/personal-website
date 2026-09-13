package com.batyrbek.finance.exception;

public class ProviderRateLimitException extends StockProviderException {
    public ProviderRateLimitException() {
        super("The market-data provider is temporarily rate limited. Please try again later.");
    }
}
