package com.tuyen.personalvault.features.users.mapper;

import com.tuyen.personalvault.features.users.dto.ProfileResponse;
import com.tuyen.personalvault.features.users.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public ProfileResponse toProfileResponse(User user) {
        return new ProfileResponse(
                user.getId(),
                user.getPhone(),
                user.getFullName(),
                user.getRole().name(),
                user.getStatus().name(),
                user.getBirthday()
        );
    }
}
