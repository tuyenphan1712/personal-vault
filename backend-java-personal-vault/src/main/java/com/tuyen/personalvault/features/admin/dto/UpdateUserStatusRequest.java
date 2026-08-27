package com.tuyen.personalvault.features.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateUserStatusRequest(
        @NotBlank
        @Pattern(regexp = "active|locked", message = "status must be 'active' or 'locked'") String status
) {
}
