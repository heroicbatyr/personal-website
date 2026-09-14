package com.batyrbek.finance.cache;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ProviderRateLimitCooldownStore {
    private static final Logger log = LoggerFactory.getLogger(ProviderRateLimitCooldownStore.class);
    private final ObjectMapper objectMapper;
    private final Path file;
    private final Map<String, Instant> blockedUntil = new ConcurrentHashMap<>();

    public ProviderRateLimitCooldownStore(ObjectMapper objectMapper,
                                          @Value("${stock.cache.directory:/app/data/cache}") String cacheDirectory) {
        this.objectMapper = objectMapper;
        this.file = Path.of(cacheDirectory).toAbsolutePath().normalize().resolve("provider-rate-limits.json");
    }

    @PostConstruct
    void load() {
        if (!Files.isRegularFile(file)) return;
        try {
            blockedUntil.putAll(objectMapper.readValue(file.toFile(), new TypeReference<Map<String, Instant>>() {}));
            blockedUntil.entrySet().removeIf(entry -> !entry.getValue().isAfter(Instant.now()));
        } catch (IOException | RuntimeException exception) {
            log.warn("Ignoring unreadable provider cooldown state");
        }
    }

    public boolean isBlocked(String apiKey) {
        Instant until = blockedUntil.get(hash(apiKey));
        return until != null && until.isAfter(Instant.now());
    }

    public void block(String apiKey, Duration duration) {
        blockedUntil.put(hash(apiKey), Instant.now().plus(duration));
        persist();
    }

    private void persist() {
        Path temporary = file.resolveSibling(file.getFileName() + ".tmp");
        try {
            Files.createDirectories(file.getParent());
            objectMapper.writeValue(temporary.toFile(), blockedUntil);
            try {
                Files.move(temporary, file, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException atomicMoveUnsupported) {
                Files.move(temporary, file, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException | RuntimeException exception) {
            log.warn("Unable to persist provider cooldown state");
        }
    }

    private static String hash(String value) {
        try {
            return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
