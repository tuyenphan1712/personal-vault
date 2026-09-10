package com.tuyen.personalvault.features.auth.dto;

import com.tuyen.personalvault.features.credentials.dto.CredentialCiphertextUpdate;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ChangePasswordRequest(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 8, max = 255) String newPassword,
        String currentRefreshToken,
        @NotNull List<@Valid CredentialCiphertextUpdate> credentials
) {
}
