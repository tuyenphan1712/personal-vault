package com.tuyen.personalvault.features.auth.controller;

import com.tuyen.personalvault.features.auth.dto.AuthUserResponse;
import com.tuyen.personalvault.features.auth.dto.LoginResponse;
import com.tuyen.personalvault.features.auth.dto.LoginUserSummary;
import com.tuyen.personalvault.features.auth.dto.RefreshResponse;
import com.tuyen.personalvault.features.auth.entity.ClientType;
import com.tuyen.personalvault.features.auth.exception.AccountLockedException;
import com.tuyen.personalvault.features.auth.exception.InvalidCredentialsException;
import com.tuyen.personalvault.features.auth.exception.InvalidCurrentPasswordException;
import com.tuyen.personalvault.features.auth.exception.InvalidRefreshTokenException;
import com.tuyen.personalvault.features.auth.exception.PhoneAlreadyRegisteredException;
import com.tuyen.personalvault.features.auth.exception.TooManyAttemptsException;
import com.tuyen.personalvault.features.auth.service.AuthService;
import com.tuyen.personalvault.features.credentials.exception.StaleCredentialSetException;
import com.tuyen.personalvault.features.users.exception.UserNotFoundException;
import com.tuyen.personalvault.shared.security.JwtProperties;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpHeaders;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Same slice-test convention as UserControllerTest: our real SecurityConfig isn't loaded here,
 * so a fake Authentication is seeded and CSRF tokens are attached manually. This only verifies
 * controller<->service contract (status/body/cookie), not real endpoint authorization.
 *
 * <p>Pins {@code app.cookie.secure=true} explicitly: the property defaults to {@code true} in
 * {@code application.properties}, but a developer's local {@code .env} (COOKIE_SECURE=false, for
 * local HTTP dev) is imported ahead of it and would otherwise leak into this test's context.
 */
@WebMvcTest(AuthController.class)
@TestPropertySource(properties = "app.cookie.secure=true")
class AuthControllerTest {

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
    void registerReturns201OnSuccess() throws Exception {
        AuthUserResponse response = new AuthUserResponse(UUID.randomUUID(), "0900000000", "Nguyen Van A", "member", "active");
        when(authService.register(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"phone":"0900000000","password":"plain-password","fullName":"Nguyen Van A"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.phone").value("0900000000"));
    }

    @Test
    void registerReturns400OnBlankPhone() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"phone":"","password":"plain-password","fullName":"Nguyen Van A"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("COMMON_001"));
    }

    @Test
    void registerReturns409WhenPhoneAlreadyRegistered() throws Exception {
        when(authService.register(any())).thenThrow(new PhoneAlreadyRegisteredException());

        mockMvc.perform(post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"phone":"0900000000","password":"plain-password","fullName":"Nguyen Van A"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("USER_002"));
    }

    @Test
    void webLoginSetsCookieAndOmitsRefreshTokenFromBody() throws Exception {
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
                .andExpect(jsonPath("$.data.accessToken").value("access-token"))
                .andExpect(jsonPath("$.data.refreshToken").doesNotExist())
                .andExpect(cookie().value("refreshToken", "raw-refresh-token"))
                .andExpect(cookie().httpOnly("refreshToken", true))
                .andExpect(cookie().secure("refreshToken", true));
    }

    @Test
    void mobileLoginReturnsRefreshTokenInBodyWithoutCookie() throws Exception {
        LoginUserSummary user = new LoginUserSummary(UUID.randomUUID(), "0900000000", "Nguyen Van A", "member");
        LoginResponse response = new LoginResponse(user, "access-token", "raw-refresh-token", 900L);
        when(authService.login(any(), any())).thenReturn(new AuthService.LoginResult(response, "raw-refresh-token", ClientType.mobile));

        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"phone":"0900000000","password":"plain-password","clientType":"mobile"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.refreshToken").value("raw-refresh-token"))
                .andExpect(header().doesNotExist(HttpHeaders.SET_COOKIE));
    }

    @Test
    void loginReturns401OnInvalidCredentials() throws Exception {
        when(authService.login(any(), any())).thenThrow(new InvalidCredentialsException());

        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"phone":"0900000000","password":"wrong-password"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("AUTH_001"));
    }

    @Test
    void loginReturns401WhenAccountLocked() throws Exception {
        when(authService.login(any(), any())).thenThrow(new AccountLockedException());

        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"phone":"0900000000","password":"plain-password"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("AUTH_002"));
    }

    @Test
    void loginReturns429WithRetryAfterSecondsWhenLockedOut() throws Exception {
        when(authService.login(any(), any())).thenThrow(new TooManyAttemptsException(600L));

        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"phone":"0900000000","password":"plain-password"}
                                """))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("AUTH_004"))
                .andExpect(jsonPath("$.error.details.retryAfterSeconds").value(600));
    }

    @Test
    void webRefreshReadsCookieAndRotatesIt() throws Exception {
        RefreshResponse response = new RefreshResponse("new-access-token", null, 900L);
        when(authService.refresh("old-raw-token")).thenReturn(new AuthService.RefreshResult(response, "new-raw-token", ClientType.web));
        when(jwtProperties.getRefreshTokenExpirationMs()).thenReturn(Duration.ofDays(30).toMillis());

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .with(csrf())
                        .cookie(new Cookie("refreshToken", "old-raw-token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").value("new-access-token"))
                .andExpect(jsonPath("$.data.refreshToken").doesNotExist())
                .andExpect(cookie().value("refreshToken", "new-raw-token"));
    }

    @Test
    void mobileRefreshReadsBodyAndReturnsNewTokenInBody() throws Exception {
        RefreshResponse response = new RefreshResponse("new-access-token", "new-raw-token", 900L);
        when(authService.refresh("old-raw-token")).thenReturn(new AuthService.RefreshResult(response, "new-raw-token", ClientType.mobile));

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"refreshToken":"old-raw-token"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.refreshToken").value("new-raw-token"))
                .andExpect(header().doesNotExist(HttpHeaders.SET_COOKIE));
    }

    @Test
    void refreshReturns401WhenNoTokenProvidedAtAll() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh").with(csrf()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("AUTH_003"));
    }

    @Test
    void refreshReturns401WhenServiceRejectsToken() throws Exception {
        when(authService.refresh("bad-token")).thenThrow(new InvalidRefreshTokenException());

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"refreshToken":"bad-token"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("AUTH_003"));
    }

    @Test
    void logoutReturns204AndClearsCookie() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout")
                        .with(csrf())
                        .cookie(new Cookie("refreshToken", "raw-token")))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("refreshToken", 0));
    }

    @Test
    void meReturns200WithCurrentUser() throws Exception {
        AuthUserResponse response = new AuthUserResponse(UUID.randomUUID(), "0900000000", "Nguyen Van A", "member", "active");
        when(authService.me()).thenReturn(response);

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.phone").value("0900000000"));
    }

    @Test
    void meReturns404WhenUserMissing() throws Exception {
        when(authService.me()).thenThrow(new UserNotFoundException());

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("USER_001"));
    }

    @Test
    void changePasswordReturns200AndPassesCookieTokenThrough() throws Exception {
        doNothing().when(authService).changePassword(any(), eq("raw-cookie-token"));

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .with(csrf())
                        .cookie(new Cookie("refreshToken", "raw-cookie-token"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currentPassword":"old-password","newPassword":"new-password","credentials":[]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").doesNotExist());

        verify(authService).changePassword(any(), eq("raw-cookie-token"));
    }

    @Test
    void changePasswordPassesNullCookieThroughWhenNoCookiePresent() throws Exception {
        doNothing().when(authService).changePassword(any(), isNull());

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currentPassword":"old-password","newPassword":"new-password","credentials":[]}
                                """))
                .andExpect(status().isOk());

        verify(authService).changePassword(any(), isNull());
    }

    @Test
    void changePasswordReturns400WhenNewPasswordTooShort() throws Exception {
        mockMvc.perform(post("/api/v1/auth/change-password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currentPassword":"old-password","newPassword":"short","credentials":[]}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("COMMON_001"));
    }

    @Test
    void changePasswordReturns401WhenCurrentPasswordIsWrong() throws Exception {
        doThrow(new InvalidCurrentPasswordException()).when(authService).changePassword(any(), any());

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currentPassword":"wrong-password","newPassword":"new-password","credentials":[]}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("AUTH_006"));
    }

    @Test
    void changePasswordReturns409WhenCredentialSetIsStale() throws Exception {
        doThrow(new StaleCredentialSetException()).when(authService).changePassword(any(), any());

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currentPassword":"old-password","newPassword":"new-password","credentials":[]}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("CREDENTIAL_002"));
    }
}
