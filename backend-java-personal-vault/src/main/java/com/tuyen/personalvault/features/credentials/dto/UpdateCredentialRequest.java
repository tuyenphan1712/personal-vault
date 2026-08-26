package com.tuyen.personalvault.features.credentials.dto;

public record UpdateCredentialRequest(
        String platformName,
        String account,
        String encryptedPassword,
        Integer ciphertextVersion,
        String note
) {
}
