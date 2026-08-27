package com.tuyen.personalvault.features.auth.service;

import com.tuyen.personalvault.features.auth.dto.AuthUserResponse;
import com.tuyen.personalvault.features.auth.dto.LoginRequest;
import com.tuyen.personalvault.features.auth.dto.LoginResponse;
import com.tuyen.personalvault.features.auth.dto.RefreshResponse;
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
import com.tuyen.personalvault.shared.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration LOCKOUT_DURATION = Duration.ofMinutes(15);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthMapper authMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final Duration refreshTokenDuration;

    public AuthService(UserRepository userRepository,
                        RefreshTokenRepository refreshTokenRepository,
                        AuthMapper authMapper,
                        PasswordEncoder passwordEncoder,
                        JwtService jwtService,
                        com.tuyen.personalvault.shared.security.JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.authMapper = authMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenDuration = Duration.ofMillis(jwtProperties.getRefreshTokenExpirationMs());
    }

    @Transactional
    public AuthUserResponse register(RegisterRequest request) {
        if (userRepository.existsByPhone(request.phone())) {
            throw new PhoneAlreadyRegisteredException();
        }
        User user = new User(UUID.randomUUID(), request.phone(), request.fullName(),
                passwordEncoder.encode(request.password()));
        userRepository.save(user);
        return authMapper.toAuthUserResponse(user);
    }

    @Transactional
    public LoginResult login(LoginRequest request, String deviceInfo) {
        User user = userRepository.findByPhone(request.phone())
                .orElseThrow(InvalidCredentialsException::new);

        if (user.getStatus() == UserStatus.locked) {
            throw new AccountLockedException();
        }

        LocalDateTime now = LocalDateTime.now();
        if (user.getLockoutUntil() != null && user.getLockoutUntil().isAfter(now)) {
            throw new TooManyAttemptsException(Duration.between(now, user.getLockoutUntil()).getSeconds());
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            registerFailedAttempt(user, now);
            throw new InvalidCredentialsException();
        }

        user.setFailedLoginAttempts(0);
        user.setLockoutUntil(null);

        ClientType clientType = "mobile".equalsIgnoreCase(request.clientType()) ? ClientType.mobile : ClientType.web;
        IssuedRefreshToken issued = issueRefreshToken(user, clientType, deviceInfo);
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getRole().name());

        LoginResponse response = new LoginResponse(
                authMapper.toLoginUserSummary(user),
                accessToken,
                clientType == ClientType.mobile ? issued.rawToken() : null,
                jwtService.getAccessTokenExpirationSeconds()
        );
        return new LoginResult(response, issued.rawToken(), clientType);
    }

    @Transactional
    public RefreshResult refresh(String rawRefreshToken) {
        RefreshToken current = requireUsableToken(rawRefreshToken);
        User user = current.getUser();

        if (user.getStatus() == UserStatus.locked) {
            throw new AccountLockedException();
        }

        current.setRevokedAt(LocalDateTime.now());

        IssuedRefreshToken issued = issueRefreshToken(user, current.getClientType(), current.getDeviceInfo());
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getRole().name());

        RefreshResponse response = new RefreshResponse(
                accessToken,
                current.getClientType() == ClientType.mobile ? issued.rawToken() : null,
                jwtService.getAccessTokenExpirationSeconds()
        );
        return new RefreshResult(response, issued.rawToken(), current.getClientType());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        findUsableToken(rawRefreshToken).ifPresent(token -> token.setRevokedAt(LocalDateTime.now()));
    }

    public AuthUserResponse me() {
        User user = userRepository.findById(CurrentUser.id())
                .orElseThrow(UserNotFoundException::new);
        return authMapper.toAuthUserResponse(user);
    }

    private void registerFailedAttempt(User user, LocalDateTime now) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setLockoutUntil(now.plus(LOCKOUT_DURATION));
        }
    }

    private RefreshToken requireUsableToken(String rawRefreshToken) {
        return findUsableToken(rawRefreshToken).orElseThrow(InvalidRefreshTokenException::new);
    }

    private Optional<RefreshToken> findUsableToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return Optional.empty();
        }
        return refreshTokenRepository.findByTokenHashForUpdate(hash(rawRefreshToken))
                .filter(token -> token.isUsable(LocalDateTime.now()));
    }

    private IssuedRefreshToken issueRefreshToken(User user, ClientType clientType, String deviceInfo) {
        String rawToken = generateRawToken();
        RefreshToken token = new RefreshToken(
                UUID.randomUUID(),
                user,
                hash(rawToken),
                clientType,
                deviceInfo,
                LocalDateTime.now().plus(refreshTokenDuration)
        );
        refreshTokenRepository.save(token);
        return new IssuedRefreshToken(rawToken);
    }

    private static String generateRawToken() {
        byte[] bytes = new byte[64];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes()));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    private record IssuedRefreshToken(String rawToken) {
    }

    public record RefreshResult(RefreshResponse response, String rawRefreshToken, ClientType clientType) {
    }

    public record LoginResult(LoginResponse response, String rawRefreshToken, ClientType clientType) {
    }
}
