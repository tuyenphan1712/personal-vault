package com.tuyen.personalvault.features.admin.dto;

import jakarta.validation.constraints.Pattern;

public record UpdateUserStatusRequest(
        @Pattern(regexp = "active|locked", message = "status must be 'active' or 'locked'") String status
) {
}
