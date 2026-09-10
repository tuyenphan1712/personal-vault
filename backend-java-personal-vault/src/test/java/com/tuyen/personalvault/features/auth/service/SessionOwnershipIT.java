package com.tuyen.personalvault.features.auth.service;

import com.tuyen.personalvault.AbstractIntegrationTest;
import com.tuyen.personalvault.features.auth.dto.SessionResponse;
import com.tuyen.personalvault.features.auth.entity.ClientType;
import com.tuyen.personalvault.features.auth.entity.RefreshToken;
import com.tuyen.personalvault.features.auth.exception.CannotRevokeCurrentSessionException;
import com.tuyen.personalvault.features.auth.exception.SessionNotFoundException;
import com.tuyen.personalvault.features.auth.repository.RefreshTokenRepository;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Exercises ownership scoping and current-session protection against a real MySQL instance
 * (Testcontainers), same convention as AdminServiceOwnershipAndCascadeIT.
 */
class SessionOwnershipIT extends AbstractIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private SessionService sessionService;

    private User persistUser(String phone) {
        return userRepository.save(new User(UUID.randomUUID(), phone, "Test User", "hashed-password"));
    }

    private RefreshToken persistToken(User user, String rawToken, ClientType clientType) {
        return refreshTokenRepository.save(new RefreshToken(UUID.randomUUID(), user, hash(rawToken), clientType,
                "test-agent", LocalDateTime.now().plusDays(1)));
    }

    private static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes()));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void actAs(UUID userId) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId.toString(), null, List.of()));
    }

    @Test
    void listOnlyReturnsTheCallingUsersOwnSessions() {
        User owner = persistUser("0900000020");
        User otherUser = persistUser("0900000021");
        persistToken(owner, "owner-token", ClientType.web);
        persistToken(otherUser, "other-token", ClientType.mobile);

        actAs(owner.getId());
        List<SessionResponse> sessions = sessionService.list(null);

        assertThat(sessions).hasSize(1);
    }

    @Test
    void revokeThrowsNotFoundWhenSessionBelongsToAnotherUser() {
        User owner = persistUser("0900000022");
        User otherUser = persistUser("0900000023");
        RefreshToken othersToken = persistToken(otherUser, "others-token", ClientType.web);

        actAs(owner.getId());

        assertThatThrownBy(() -> sessionService.revoke(othersToken.getId(), null))
                .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    void revokeBlocksTheCallersOwnCurrentSessionButAllowsOthers() {
        User owner = persistUser("0900000024");
        RefreshToken current = persistToken(owner, "current-token", ClientType.web);
        RefreshToken other = persistToken(owner, "other-device-token", ClientType.mobile);

        actAs(owner.getId());

        assertThatThrownBy(() -> sessionService.revoke(current.getId(), "current-token"))
                .isInstanceOf(CannotRevokeCurrentSessionException.class);

        sessionService.revoke(other.getId(), "current-token");
        assertThat(refreshTokenRepository.findById(other.getId()).orElseThrow().getRevokedAt()).isNotNull();
    }
}
