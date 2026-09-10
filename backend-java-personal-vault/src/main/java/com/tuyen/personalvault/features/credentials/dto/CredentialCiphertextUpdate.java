package com.tuyen.personalvault.features.credentials.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CredentialCiphertextUpdate(
        @NotNull UUID id,
        @NotBlank String encryptedPassword,
        String encryptedPin,
        int ciphertextVersion
) {
}
