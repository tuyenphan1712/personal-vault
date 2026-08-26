package com.tuyen.personalvault.features.auth.controller;

import com.tuyen.personalvault.features.auth.dto.AuthUserResponse;
import com.tuyen.personalvault.features.auth.dto.LoginRequest;
import com.tuyen.personalvault.features.auth.dto.LoginResponse;
import com.tuyen.personalvault.features.auth.dto.RefreshRequest;
import com.tuyen.personalvault.features.auth.dto.RefreshResponse;
import com.tuyen.personalvault.features.auth.dto.RegisterRequest;
import com.tuyen.personalvault.features.auth.entity.ClientType;
import com.tuyen.personalvault.features.auth.exception.InvalidRefreshTokenException;
import com.tuyen.personalvault.features.auth.service.AuthService;
import com.tuyen.personalvault.shared.response.ApiResponse;
import com.tuyen.personalvault.shared.security.JwtProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refreshToken";
    private static final String REFRESH_COOKIE_PATH = "/api/v1/auth";

    private final AuthService authService;
    private final JwtProperties jwtProperties;

    public AuthController(AuthService authService, JwtProperties jwtProperties) {
        this.authService = authService;
        this.jwtProperties = jwtProperties;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthUserResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthUserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request,
                                                              HttpServletRequest httpRequest) {
        AuthService.LoginResult result = authService.login(request, httpRequest.getHeader(HttpHeaders.USER_AGENT));

        ResponseEntity.BodyBuilder builder = ResponseEntity.ok();
        if (result.clientType() == ClientType.web) {
            builder.header(HttpHeaders.SET_COOKIE, buildRefreshCookie(result.rawRefreshToken()).toString());
        }
        return builder.body(ApiResponse.of(result.response()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshResponse>> refresh(
            @RequestBody(required = false) RefreshRequest request,
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String cookieToken) {
        String rawToken = request != null && request.refreshToken() != null ? request.refreshToken() : cookieToken;
        if (rawToken == null || rawToken.isBlank()) {
            throw new InvalidRefreshTokenException();
        }

        AuthService.RefreshResult result = authService.refresh(rawToken);

        ResponseEntity.BodyBuilder builder = ResponseEntity.ok();
        if (result.clientType() == ClientType.web) {
            builder.header(HttpHeaders.SET_COOKIE, buildRefreshCookie(result.rawRefreshToken()).toString());
        }
        return builder.body(ApiResponse.of(result.response()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) RefreshRequest request,
                                        @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String cookieToken) {
        String rawToken = request != null && request.refreshToken() != null ? request.refreshToken() : cookieToken;
        authService.logout(rawToken);

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, buildExpiredRefreshCookie().toString())
                .build();
    }

    @GetMapping("/me")
    public ApiResponse<AuthUserResponse> me() {
        return ApiResponse.of(authService.me());
    }

    private ResponseCookie buildRefreshCookie(String rawToken) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, rawToken)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path(REFRESH_COOKIE_PATH)
                .maxAge(jwtProperties.getRefreshTokenExpirationMs() / 1000)
                .build();
    }

    private ResponseCookie buildExpiredRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path(REFRESH_COOKIE_PATH)
                .maxAge(0)
                .build();
    }
}
