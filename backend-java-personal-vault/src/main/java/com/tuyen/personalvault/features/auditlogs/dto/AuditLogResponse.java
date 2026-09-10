package com.tuyen.personalvault.features.auditlogs.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        String action,
        String targetLabel,
        LocalDateTime createdAt,
        LocalDateTime readAt
) {
}
