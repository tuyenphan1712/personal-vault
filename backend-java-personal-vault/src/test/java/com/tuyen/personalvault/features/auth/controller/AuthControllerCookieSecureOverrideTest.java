package com.tuyen.personalvault.features.auth.controller;

import com.tuyen.personalvault.features.auth.dto.LoginResponse;
import com.tuyen.personalvault.features.auth.dto.LoginUserSummary;
import com.tuyen.personalvault.features.auth.entity.ClientType;
import com.tuyen.personalvault.features.auth.service.AuthService;
import com.tuyen.personalvault.shared.security.JwtProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies app.cookie.secure=false (a local-HTTP dev override, per AuthContext.md's known gap
 * note) actually turns off the Secure attribute — production keeps the hardcoded-true default
 * from application.properties.
 */
@WebMvcTest(AuthController.class)
@TestPropertySource(properties = "app.cookie.secure=false")
class AuthControllerCookieSecureOverrideTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtProperties jwtProperties;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(UUID.randomUUID().toString(), null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void refreshCookieIsNotSecureWhenOverrideDisablesIt() throws Exception {
        LoginUserSummary user = new LoginUserSummary(UUID.randomUUID(), "0900000000", "Nguyen Van A", "member");
        LoginResponse response = new LoginResponse(user, "access-token", null, 900L);
        when(authService.login(any(), any())).thenReturn(new AuthService.LoginResult(response, "raw-refresh-token", ClientType.web));
        when(jwtProperties.getRefreshTokenExpirationMs()).thenReturn(Duration.ofDays(30).toMillis());

        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"phone":"0900000000","password":"plain-password"}
                                """))
                .andExpect(status().isOk())
                .andExpect(cookie().secure("refreshToken", false));
    }
}
