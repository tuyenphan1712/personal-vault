package com.tuyen.personalvault.features.auth.mapper;

import com.tuyen.personalvault.features.auth.dto.AuthUserResponse;
import com.tuyen.personalvault.features.auth.dto.LoginUserSummary;
import com.tuyen.personalvault.features.users.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {

    public AuthUserResponse toAuthUserResponse(User user) {
        return new AuthUserResponse(
                user.getId(),
                user.getPhone(),
                user.getFullName(),
                user.getRole().name(),
                user.getStatus().name()
        );
    }

    public LoginUserSummary toLoginUserSummary(User user) {
        return new LoginUserSummary(
                user.getId(),
                user.getPhone(),
                user.getFullName(),
                user.getRole().name()
        );
    }
}
