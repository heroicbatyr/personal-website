package com.batyrbek.finance.web;

import com.batyrbek.finance.dto.StockHistory;
import com.batyrbek.finance.dto.StockOverview;
import com.batyrbek.finance.service.StockService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stocks")
public class StockController {
    private final StockService stockService;

    public StockController(StockService stockService) { this.stockService = stockService; }

    @GetMapping("/{ticker}")
    public StockOverview overview(@PathVariable String ticker) { return stockService.getOverview(ticker); }

    @GetMapping("/{ticker}/history")
    public StockHistory history(@PathVariable String ticker, @RequestParam(defaultValue = "5y") String range) {
        return stockService.getHistory(ticker, range);
    }
}
