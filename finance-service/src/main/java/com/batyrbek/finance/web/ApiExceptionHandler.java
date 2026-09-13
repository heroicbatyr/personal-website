package com.batyrbek.finance.web;

import java.time.Instant;

import com.batyrbek.finance.dto.ApiError;
import com.batyrbek.finance.exception.InvalidTickerException;
import com.batyrbek.finance.exception.ProviderRateLimitException;
import com.batyrbek.finance.exception.StockNotFoundException;
import com.batyrbek.finance.exception.StockProviderException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(InvalidTickerException.class)
    ResponseEntity<ApiError> invalidTicker(InvalidTickerException exception, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, "INVALID_TICKER", exception.getMessage(), request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiError> invalidRange(IllegalArgumentException exception, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, "INVALID_RANGE", exception.getMessage(), request);
    }

    @ExceptionHandler(StockNotFoundException.class)
    ResponseEntity<ApiError> notFound(StockNotFoundException exception, HttpServletRequest request) {
        return response(HttpStatus.NOT_FOUND, "TICKER_NOT_FOUND", exception.getMessage(), request);
    }

    @ExceptionHandler(ProviderRateLimitException.class)
    ResponseEntity<ApiError> providerRateLimited(ProviderRateLimitException exception, HttpServletRequest request) {
        return response(HttpStatus.TOO_MANY_REQUESTS, "PROVIDER_RATE_LIMITED", exception.getMessage(), request);
    }

    @ExceptionHandler(StockProviderException.class)
    ResponseEntity<ApiError> providerUnavailable(StockProviderException exception, HttpServletRequest request) {
        return response(HttpStatus.SERVICE_UNAVAILABLE, "PROVIDER_UNAVAILABLE",
                "Market data is temporarily unavailable. Please try again later.", request);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> unexpected(Exception exception, HttpServletRequest request) {
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "The stock-data service could not complete the request.", request);
    }

    private ResponseEntity<ApiError> response(HttpStatus status, String code, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(new ApiError(
                Instant.now(), status.value(), status.getReasonPhrase(), code, message, request.getRequestURI()));
    }
}
