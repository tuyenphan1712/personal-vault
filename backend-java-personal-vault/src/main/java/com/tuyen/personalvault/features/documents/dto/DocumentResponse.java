package com.tuyen.personalvault.features.documents.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DocumentResponse(
        UUID id,
        String title,
        String docType,
        String mimeType,
        long fileSize,
        LocalDateTime createdAt
) {
}
