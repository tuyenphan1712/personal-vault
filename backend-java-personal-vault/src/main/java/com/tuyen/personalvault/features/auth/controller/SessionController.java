package com.tuyen.personalvault.features.auth.controller;

import com.tuyen.personalvault.features.auth.dto.SessionResponse;
import com.tuyen.personalvault.features.auth.service.SessionService;
import com.tuyen.personalvault.shared.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions")
public class SessionController {

    private static final String REFRESH_COOKIE_NAME = "refreshToken";

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping
    public ApiResponse<List<SessionResponse>> list(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String cookieToken,
            @RequestParam(required = false) String currentRefreshToken) {
        return ApiResponse.of(sessionService.list(resolveCurrentToken(cookieToken, currentRefreshToken)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> revoke(
            @PathVariable UUID id,
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String cookieToken,
            @RequestParam(required = false) String currentRefreshToken) {
        sessionService.revoke(id, resolveCurrentToken(cookieToken, currentRefreshToken));
        return ResponseEntity.noContent().build();
    }

    private String resolveCurrentToken(String cookieToken, String currentRefreshToken) {
        return cookieToken != null && !cookieToken.isBlank() ? cookieToken : currentRefreshToken;
    }
}
