package com.tuyen.personalvault.features.users.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ProfileResponse(
        UUID id,
        String phone,
        String fullName,
        String role,
        String status,
        LocalDate birthday
) {
}
