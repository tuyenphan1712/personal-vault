package com.tuyen.personalvault.features.users.service;

import com.tuyen.personalvault.features.users.dto.ProfileResponse;
import com.tuyen.personalvault.features.users.dto.UpdateProfileRequest;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.exception.UserNotFoundException;
import com.tuyen.personalvault.features.users.mapper.UserMapper;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import com.tuyen.personalvault.shared.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    public ProfileResponse getProfile() {
        User user = findCurrentUser();
        return userMapper.toProfileResponse(user);
    }

    @Transactional
    public ProfileResponse updateProfile(UpdateProfileRequest request) {
        User user = findCurrentUser();
        user.setFullName(request.fullName());
        user.setBirthday(request.birthday());
        return userMapper.toProfileResponse(user);
    }

    private User findCurrentUser() {
        return userRepository.findById(CurrentUser.id())
                .orElseThrow(UserNotFoundException::new);
    }
}
