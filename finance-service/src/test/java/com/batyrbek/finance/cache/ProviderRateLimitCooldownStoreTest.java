package com.batyrbek.finance.cache;

import java.nio.file.Files;
import java.time.Duration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;

class ProviderRateLimitCooldownStoreTest {
    @TempDir
    java.nio.file.Path temporaryDirectory;

    @Test
    void restoresCooldownAcrossStoreInstancesWithoutPersistingTheRawKey() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        ProviderRateLimitCooldownStore first = new ProviderRateLimitCooldownStore(
                objectMapper, temporaryDirectory.toString());
        first.block("test-api-key", Duration.ofMinutes(15));

        ProviderRateLimitCooldownStore restarted = new ProviderRateLimitCooldownStore(
                objectMapper, temporaryDirectory.toString());
        restarted.load();

        String saved = Files.readString(temporaryDirectory.resolve("provider-rate-limits.json"));
        assertThat(restarted.isBlocked("test-api-key")).isTrue();
        assertThat(saved).doesNotContain("test-api-key");
    }
}
