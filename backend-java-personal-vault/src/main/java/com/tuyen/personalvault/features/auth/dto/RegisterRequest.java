package com.tuyen.personalvault.features.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Pattern(regexp = "^[0-9]{9,15}$", message = "Phone number is invalid") String phone,
        @NotBlank @Size(min = 8, max = 255) String password,
        @NotBlank @Size(max = 255) String fullName
) {
}
