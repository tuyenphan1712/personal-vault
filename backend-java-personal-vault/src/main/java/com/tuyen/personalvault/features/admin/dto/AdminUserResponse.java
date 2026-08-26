package com.tuyen.personalvault.features.admin.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String phone,
        String fullName,
        String role,
        String status,
        LocalDateTime createdAt
) {
}
