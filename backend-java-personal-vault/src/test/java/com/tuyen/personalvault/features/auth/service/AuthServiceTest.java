package com.tuyen.personalvault.features.auth.service;

import com.tuyen.personalvault.features.auth.dto.AuthUserResponse;
import com.tuyen.personalvault.features.auth.dto.LoginRequest;
import com.tuyen.personalvault.features.auth.dto.RegisterRequest;
import com.tuyen.personalvault.features.auth.entity.ClientType;
import com.tuyen.personalvault.features.auth.entity.RefreshToken;
import com.tuyen.personalvault.features.auth.exception.AccountLockedException;
import com.tuyen.personalvault.features.auth.exception.InvalidCredentialsException;
import com.tuyen.personalvault.features.auth.exception.InvalidRefreshTokenException;
import com.tuyen.personalvault.features.auth.exception.PhoneAlreadyRegisteredException;
import com.tuyen.personalvault.features.auth.exception.TooManyAttemptsException;
import com.tuyen.personalvault.features.auth.mapper.AuthMapper;
import com.tuyen.personalvault.features.auth.repository.RefreshTokenRepository;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.entity.UserStatus;
import com.tuyen.personalvault.features.users.exception.UserNotFoundException;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import com.tuyen.personalvault.shared.security.CurrentUser;
import com.tuyen.personalvault.shared.security.JwtProperties;
import com.tuyen.personalvault.shared.security.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final UUID CURRENT_USER_ID = UUID.randomUUID();

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private final AuthMapper authMapper = new AuthMapper();

    private AuthService authService;

    private MockedStatic<CurrentUser> currentUserMock;

    @BeforeEach
    void setUp() {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setRefreshTokenExpirationMs(Duration.ofDays(30).toMillis());
        authService = new AuthService(userRepository, refreshTokenRepository, authMapper,
                passwordEncoder, jwtService, jwtProperties);
    }

    @AfterEach
    void tearDown() {
        if (currentUserMock != null) {
            currentUserMock.close();
        }
    }

    private User activeUser() {
        return new User(UUID.randomUUID(), "0900000000", "Nguyen Van A", "hashed-password");
    }

    @Nested
    class Register {

        @Test
        void createsUserWithEncodedPasswordWhenPhoneIsNew() {
            when(userRepository.existsByPhone("0900000000")).thenReturn(false);
            when(passwordEncoder.encode("plain-password")).thenReturn("hashed-password");
            RegisterRequest request = new RegisterRequest("0900000000", "plain-password", "Nguyen Van A");

            AuthUserResponse response = authService.register(request);

            assertThat(response.phone()).isEqualTo("0900000000");
            assertThat(response.fullName()).isEqualTo("Nguyen Van A");
            assertThat(response.role()).isEqualTo("member");
            assertThat(response.status()).isEqualTo("active");
            verify(userRepository).save(any(User.class));
        }

        @Test
        void throwsPhoneAlreadyRegisteredWhenPhoneExists() {
            when(userRepository.existsByPhone("0900000000")).thenReturn(true);
            RegisterRequest request = new RegisterRequest("0900000000", "plain-password", "Nguyen Van A");

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(PhoneAlreadyRegisteredException.class);
            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    class Login {

        @Test
        void webLoginDoesNotExposeRawTokenInResponseButReturnsItInResult() {
            User user = activeUser();
            when(userRepository.findByPhone("0900000000")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("plain-password", "hashed-password")).thenReturn(true);
            when(jwtService.generateAccessToken(user.getId(), "member")).thenReturn("access-token");
            when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(900L);
            LoginRequest request = new LoginRequest("0900000000", "plain-password", null);

            AuthService.LoginResult result = authService.login(request, "test-agent");

            assertThat(result.clientType()).isEqualTo(ClientType.web);
            assertThat(result.rawRefreshToken()).isNotBlank();
            assertThat(result.response().refreshToken()).isNull();
            assertThat(result.response().accessToken()).isEqualTo("access-token");
            verify(refreshTokenRepository).save(any(RefreshToken.class));
        }

        @Test
        void mobileLoginReturnsRawTokenInResponse() {
            User user = activeUser();
            when(userRepository.findByPhone("0900000000")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("plain-password", "hashed-password")).thenReturn(true);
            when(jwtService.generateAccessToken(user.getId(), "member")).thenReturn("access-token");
            when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(900L);
            LoginRequest request = new LoginRequest("0900000000", "plain-password", "mobile");

            AuthService.LoginResult result = authService.login(request, "test-agent");

            assertThat(result.clientType()).isEqualTo(ClientType.mobile);
            assertThat(result.response().refreshToken()).isEqualTo(result.rawRefreshToken());
        }

        @Test
        void throwsInvalidCredentialsWhenPhoneUnknown() {
            when(userRepository.findByPhone("0900000000")).thenReturn(Optional.empty());
            LoginRequest request = new LoginRequest("0900000000", "plain-password", null);

            assertThatThrownBy(() -> authService.login(request, "test-agent"))
                    .isInstanceOf(InvalidCredentialsException.class);
        }

        @Test
        void throwsAccountLockedWhenStatusIsLocked() {
            User user = activeUser();
            user.setStatus(UserStatus.locked);
            when(userRepository.findByPhone("0900000000")).thenReturn(Optional.of(user));
            LoginRequest request = new LoginRequest("0900000000", "plain-password", null);

            assertThatThrownBy(() -> authService.login(request, "test-agent"))
                    .isInstanceOf(AccountLockedException.class);
        }

        @Test
        void throwsTooManyAttemptsWhileLockoutWindowActive() {
            User user = activeUser();
            user.setLockoutUntil(LocalDateTime.now().plusMinutes(10));
            when(userRepository.findByPhone("0900000000")).thenReturn(Optional.of(user));
            LoginRequest request = new LoginRequest("0900000000", "plain-password", null);

            TooManyAttemptsException ex = catchThrowableOfType(
                    TooManyAttemptsException.class, () -> authService.login(request, "test-agent"));

            assertThat(ex).isNotNull();
            assertThat(ex.getCode()).isEqualTo("AUTH_004");
            @SuppressWarnings("unchecked")
            Map<String, Object> details = (Map<String, Object>) ex.getDetails();
            assertThat((Long) details.get("retryAfterSeconds")).isBetween(590L, 600L);
        }

        @Test
        void wrongPasswordBelowThresholdIncrementsAttemptsWithoutLockout() {
            User user = activeUser();
            when(userRepository.findByPhone("0900000000")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrong-password", "hashed-password")).thenReturn(false);
            LoginRequest request = new LoginRequest("0900000000", "wrong-password", null);

            assertThatThrownBy(() -> authService.login(request, "test-agent"))
                    .isInstanceOf(InvalidCredentialsException.class);
            assertThat(user.getFailedLoginAttempts()).isEqualTo(1);
            assertThat(user.getLockoutUntil()).isNull();
        }

        @Test
        void fifthWrongPasswordSetsLockoutUntil() {
            User user = activeUser();
            user.setFailedLoginAttempts(4);
            when(userRepository.findByPhone("0900000000")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrong-password", "hashed-password")).thenReturn(false);
            LoginRequest request = new LoginRequest("0900000000", "wrong-password", null);

            assertThatThrownBy(() -> authService.login(request, "test-agent"))
                    .isInstanceOf(InvalidCredentialsException.class);
            assertThat(user.getFailedLoginAttempts()).isEqualTo(5);
            assertThat(user.getLockoutUntil()).isAfter(LocalDateTime.now().plusMinutes(14));
        }
    }

    @Nested
    class Refresh {

        private RefreshToken usableToken(User user, ClientType clientType) {
            return new RefreshToken(UUID.randomUUID(), user, "hash", clientType, "test-agent",
                    LocalDateTime.now().plusDays(1));
        }

        @Test
        void rotatesTokenAndKeepsClientTypeFromStoredToken() {
            User user = activeUser();
            RefreshToken current = usableToken(user, ClientType.web);
            when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(current));
            when(jwtService.generateAccessToken(user.getId(), "member")).thenReturn("new-access-token");
            when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(900L);

            AuthService.RefreshResult result = authService.refresh("raw-refresh-token");

            assertThat(current.getRevokedAt()).isNotNull();
            assertThat(result.clientType()).isEqualTo(ClientType.web);
            assertThat(result.response().refreshToken()).isNull();
            assertThat(result.rawRefreshToken()).isNotBlank();
            verify(refreshTokenRepository).save(any(RefreshToken.class));
        }

        @Test
        void mobileRefreshReturnsRawTokenInResponse() {
            User user = activeUser();
            RefreshToken current = usableToken(user, ClientType.mobile);
            when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(current));
            when(jwtService.generateAccessToken(user.getId(), "member")).thenReturn("new-access-token");
            when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(900L);

            AuthService.RefreshResult result = authService.refresh("raw-refresh-token");

            assertThat(result.response().refreshToken()).isEqualTo(result.rawRefreshToken());
        }

        @Test
        void throwsInvalidRefreshTokenWhenNotFound() {
            when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.refresh("unknown-token"))
                    .isInstanceOf(InvalidRefreshTokenException.class);
        }

        @Test
        void throwsInvalidRefreshTokenWhenRevoked() {
            User user = activeUser();
            RefreshToken revoked = usableToken(user, ClientType.web);
            revoked.setRevokedAt(LocalDateTime.now());
            when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(revoked));

            assertThatThrownBy(() -> authService.refresh("raw-refresh-token"))
                    .isInstanceOf(InvalidRefreshTokenException.class);
        }

        @Test
        void throwsInvalidRefreshTokenWhenExpired() {
            User user = activeUser();
            RefreshToken expired = new RefreshToken(UUID.randomUUID(), user, "hash", ClientType.web,
                    "test-agent", LocalDateTime.now().minusMinutes(1));
            when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(expired));

            assertThatThrownBy(() -> authService.refresh("raw-refresh-token"))
                    .isInstanceOf(InvalidRefreshTokenException.class);
        }

        @Test
        void throwsAccountLockedWhenOwningUserIsLocked() {
            User user = activeUser();
            user.setStatus(UserStatus.locked);
            RefreshToken current = usableToken(user, ClientType.web);
            when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(current));

            assertThatThrownBy(() -> authService.refresh("raw-refresh-token"))
                    .isInstanceOf(AccountLockedException.class);
            verify(refreshTokenRepository, never()).save(any());
        }
    }

    @Nested
    class Logout {

        @Test
        void revokesUsableToken() {
            User user = activeUser();
            RefreshToken current = new RefreshToken(UUID.randomUUID(), user, "hash", ClientType.web,
                    "test-agent", LocalDateTime.now().plusDays(1));
            when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(current));

            authService.logout("raw-refresh-token");

            assertThat(current.getRevokedAt()).isNotNull();
        }

        @Test
        void doesNothingWhenTokenUnknown() {
            when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.empty());

            authService.logout("unknown-token");

            verify(refreshTokenRepository, times(0)).save(any());
        }

        @Test
        void doesNothingWhenTokenBlank() {
            authService.logout(" ");

            verify(refreshTokenRepository, never()).findByTokenHashForUpdate(anyString());
        }
    }

    @Nested
    class Me {

        @BeforeEach
        void mockCurrentUser() {
            currentUserMock = Mockito.mockStatic(CurrentUser.class);
            currentUserMock.when(CurrentUser::id).thenReturn(CURRENT_USER_ID);
        }

        @Test
        void returnsCurrentUserSummary() {
            User user = new User(CURRENT_USER_ID, "0900000000", "Nguyen Van A", "hashed-password");
            when(userRepository.findById(CURRENT_USER_ID)).thenReturn(Optional.of(user));

            AuthUserResponse response = authService.me();

            assertThat(response.id()).isEqualTo(CURRENT_USER_ID);
            assertThat(response.phone()).isEqualTo("0900000000");
        }

        @Test
        void throwsUserNotFoundWhenMissing() {
            when(userRepository.findById(CURRENT_USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.me())
                    .isInstanceOf(UserNotFoundException.class);
        }
    }
}
