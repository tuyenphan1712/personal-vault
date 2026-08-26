package com.tuyen.personalvault.features.users.controller;

import com.tuyen.personalvault.features.users.dto.ProfileResponse;
import com.tuyen.personalvault.features.users.dto.UpdateProfileRequest;
import com.tuyen.personalvault.features.users.service.UserService;
import com.tuyen.personalvault.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/profile")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ApiResponse<ProfileResponse> getProfile() {
        return ApiResponse.of(userService.getProfile());
    }

    @PatchMapping
    public ApiResponse<ProfileResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.of(userService.updateProfile(request));
    }
}
