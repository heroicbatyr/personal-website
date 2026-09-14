package com.batyrbek.finance.dto;

import java.time.LocalDate;

public record AnnualFinancial(
        LocalDate date, String fiscalYear, Double revenue, Double operatingIncome,
        Double netIncome, Double eps, Double freeCashFlow, Double revenueGrowth,
        Double netMargin
) {}
