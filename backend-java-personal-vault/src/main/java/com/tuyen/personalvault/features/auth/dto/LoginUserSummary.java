package com.tuyen.personalvault.features.auth.dto;

import java.util.UUID;

public record LoginUserSummary(
        UUID id,
        String phone,
        String fullName,
        String role
) {
}
