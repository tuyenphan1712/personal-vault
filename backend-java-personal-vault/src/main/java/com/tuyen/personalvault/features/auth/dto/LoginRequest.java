package com.tuyen.personalvault.features.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String phone,
        @NotBlank String password,
        String clientType
) {
}
