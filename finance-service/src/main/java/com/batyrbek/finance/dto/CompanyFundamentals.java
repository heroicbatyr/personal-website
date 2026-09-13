package com.batyrbek.finance.dto;

import java.time.Instant;

public record CompanyFundamentals(
        String companyName, String currency, Long marketCap, Double peRatio, Double eps,
        Double dividendYield, Double week52High, Double week52Low, Instant updatedAt
) {}
