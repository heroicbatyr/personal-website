package com.batyrbek.finance.config;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

import com.batyrbek.finance.dto.StockHistory;
import com.batyrbek.finance.dto.StockOverview;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class FinanceConfiguration {
    @Bean
    WebClient stockWebClient(@Value("${stock.provider.base-url}") String baseUrl) {
        return WebClient.builder()
                .baseUrl(baseUrl)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024))
                .build();
    }

    @Bean
    Cache<String, StockOverview> overviewCache() {
        return Caffeine.newBuilder().maximumSize(250).expireAfterWrite(Duration.ofMinutes(15)).build();
    }

    @Bean
    Cache<String, StockOverview> staleOverviewCache() {
        return Caffeine.newBuilder().maximumSize(250).expireAfterWrite(Duration.ofHours(24)).build();
    }

    @Bean
    Cache<String, StockHistory> historyCache() {
        return Caffeine.newBuilder().maximumSize(250).expireAfterWrite(Duration.ofHours(24)).build();
    }

    @Bean
    Cache<String, StockHistory> staleHistoryCache() {
        return Caffeine.newBuilder().maximumSize(250).expireAfterWrite(Duration.ofDays(7)).build();
    }

    @Bean
    CorsFilter corsFilter(@Value("${stock.cors.allowed-origins}") String origins) {
        List<String> allowedOrigins = Arrays.stream(origins.split(",")).map(String::trim).filter(origin -> !origin.isBlank()).toList();
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Accept", "Content-Type"));
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/stocks/**", configuration);
        return new CorsFilter(source);
    }
}
