package com.tuyen.personalvault.features.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LoginResponse(
        LoginUserSummary user,
        String accessToken,
        String refreshToken,
        long expiresIn
) {
}
