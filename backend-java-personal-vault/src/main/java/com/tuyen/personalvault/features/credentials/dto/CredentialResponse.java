package com.tuyen.personalvault.features.credentials.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CredentialResponse(
        UUID id,
        String platformName,
        String account,
        String encryptedPassword,
        int ciphertextVersion,
        String note,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
