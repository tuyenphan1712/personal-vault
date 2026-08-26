package com.tuyen.personalvault.features.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RefreshResponse(
        String accessToken,
        String refreshToken,
        long expiresIn
) {
}
