package com.tuyen.personalvault.features.credentials.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCredentialRequest(
        @NotBlank String platformName,
        @NotBlank String account,
        @NotBlank String encryptedPassword,
        Integer ciphertextVersion,
        String note
) {
    public int ciphertextVersionOrDefault() {
        return ciphertextVersion == null ? 1 : ciphertextVersion;
    }
}
