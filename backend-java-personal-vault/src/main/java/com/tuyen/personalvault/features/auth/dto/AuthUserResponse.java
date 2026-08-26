package com.tuyen.personalvault.features.auth.dto;

import java.util.UUID;

public record AuthUserResponse(
        UUID id,
        String phone,
        String fullName,
        String role,
        String status
) {
}
