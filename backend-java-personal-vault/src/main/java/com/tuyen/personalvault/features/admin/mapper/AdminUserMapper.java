package com.tuyen.personalvault.features.admin.mapper;

import com.tuyen.personalvault.features.admin.dto.AdminUserResponse;
import com.tuyen.personalvault.features.users.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AdminUserMapper {

    public AdminUserResponse toResponse(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getPhone(),
                user.getFullName(),
                user.getRole().name(),
                user.getStatus().name(),
                user.getCreatedAt()
        );
    }
}
