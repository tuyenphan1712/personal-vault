package com.tuyen.personalvault.features.auth.service;

import com.tuyen.personalvault.features.auth.dto.SessionResponse;
import com.tuyen.personalvault.features.auth.entity.ClientType;
import com.tuyen.personalvault.features.auth.entity.RefreshToken;
import com.tuyen.personalvault.features.auth.exception.CannotRevokeCurrentSessionException;
import com.tuyen.personalvault.features.auth.exception.SessionNotFoundException;
import com.tuyen.personalvault.features.auth.repository.RefreshTokenRepository;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.shared.security.CurrentUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    private static final UUID CURRENT_USER_ID = UUID.randomUUID();

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private SessionService sessionService;

    private MockedStatic<CurrentUser> currentUserMock;

    @BeforeEach
    void setUp() {
        sessionService = new SessionService(refreshTokenRepository);
        currentUserMock = Mockito.mockStatic(CurrentUser.class);
        currentUserMock.when(CurrentUser::id).thenReturn(CURRENT_USER_ID);
    }

    @AfterEach
    void tearDown() {
        currentUserMock.close();
    }

    private User owner() {
        return new User(CURRENT_USER_ID, "0900000000", "Nguyen Van A", "hashed-password");
    }

    private RefreshToken tokenFor(String rawToken, ClientType clientType) {
        return new RefreshToken(UUID.randomUUID(), owner(), hash(rawToken), clientType, "test-agent",
                LocalDateTime.now().plusDays(1));
    }

    private static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes()));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    @Nested
    class List_ {

        @Test
        void marksTheMatchingTokenAsCurrent() {
            RefreshToken current = tokenFor("raw-current-token", ClientType.web);
            RefreshToken other = tokenFor("raw-other-token", ClientType.mobile);
            when(refreshTokenRepository.findAllUsableByUserId(eq(CURRENT_USER_ID), any()))
                    .thenReturn(List.of(current, other));

            List<SessionResponse> result = sessionService.list("raw-current-token");

            SessionResponse currentResponse = result.stream().filter(r -> r.id().equals(current.getId())).findFirst().orElseThrow();
            SessionResponse otherResponse = result.stream().filter(r -> r.id().equals(other.getId())).findFirst().orElseThrow();
            assertThat(currentResponse.isCurrent()).isTrue();
            assertThat(otherResponse.isCurrent()).isFalse();
        }

        @Test
        void marksEveryTokenAsNotCurrentWhenNoCurrentTokenIsIdentifiable() {
            RefreshToken token = tokenFor("raw-token", ClientType.web);
            when(refreshTokenRepository.findAllUsableByUserId(eq(CURRENT_USER_ID), any())).thenReturn(List.of(token));

            List<SessionResponse> result = sessionService.list(null);

            assertThat(result.getFirst().isCurrent()).isFalse();
        }
    }

    @Nested
    class Revoke {

        @Test
        void revokesAnOwnedNonCurrentSession() {
            RefreshToken token = tokenFor("raw-other-token", ClientType.web);
            when(refreshTokenRepository.findByIdAndUserId(token.getId(), CURRENT_USER_ID)).thenReturn(Optional.of(token));

            sessionService.revoke(token.getId(), "raw-current-token");

            assertThat(token.getRevokedAt()).isNotNull();
        }

        @Test
        void throwsNotFoundWhenMissingOrNotOwned() {
            UUID id = UUID.randomUUID();
            when(refreshTokenRepository.findByIdAndUserId(id, CURRENT_USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> sessionService.revoke(id, "raw-current-token"))
                    .isInstanceOf(SessionNotFoundException.class);
        }

        @Test
        void throwsCannotRevokeCurrentSessionWhenTargetIsTheCallersOwnSession() {
            RefreshToken token = tokenFor("raw-current-token", ClientType.web);
            when(refreshTokenRepository.findByIdAndUserId(token.getId(), CURRENT_USER_ID)).thenReturn(Optional.of(token));

            assertThatThrownBy(() -> sessionService.revoke(token.getId(), "raw-current-token"))
                    .isInstanceOf(CannotRevokeCurrentSessionException.class);
            assertThat(token.getRevokedAt()).isNull();
        }
    }
}
