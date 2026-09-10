package com.tuyen.personalvault.features.auth.dto;

import com.tuyen.personalvault.features.auth.entity.ClientType;

import java.time.LocalDateTime;
import java.util.UUID;

public record SessionResponse(
        UUID id,
        ClientType clientType,
        String deviceInfo,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        boolean isCurrent
) {
}
