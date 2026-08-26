package com.tuyen.personalvault.features.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 255) String fullName,
        LocalDate birthday
) {
}
