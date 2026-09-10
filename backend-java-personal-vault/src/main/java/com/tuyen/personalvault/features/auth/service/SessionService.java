package com.tuyen.personalvault.features.auth.service;

import com.tuyen.personalvault.features.auth.dto.SessionResponse;
import com.tuyen.personalvault.features.auth.entity.RefreshToken;
import com.tuyen.personalvault.features.auth.exception.CannotRevokeCurrentSessionException;
import com.tuyen.personalvault.features.auth.exception.SessionNotFoundException;
import com.tuyen.personalvault.features.auth.repository.RefreshTokenRepository;
import com.tuyen.personalvault.shared.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class SessionService {

    private final RefreshTokenRepository refreshTokenRepository;

    public SessionService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public List<SessionResponse> list(String rawCurrentToken) {
        String currentHash = hash(rawCurrentToken);
        return refreshTokenRepository.findAllUsableByUserId(CurrentUser.id(), LocalDateTime.now()).stream()
                .map(token -> toResponse(token, currentHash))
                .toList();
    }

    @Transactional
    public void revoke(UUID id, String rawCurrentToken) {
        RefreshToken token = refreshTokenRepository.findByIdAndUserId(id, CurrentUser.id())
                .orElseThrow(SessionNotFoundException::new);

        String currentHash = hash(rawCurrentToken);
        if (currentHash != null && currentHash.equals(token.getTokenHash())) {
            throw new CannotRevokeCurrentSessionException();
        }

        token.setRevokedAt(LocalDateTime.now());
    }

    private SessionResponse toResponse(RefreshToken token, String currentHash) {
        boolean isCurrent = currentHash != null && currentHash.equals(token.getTokenHash());
        return new SessionResponse(
                token.getId(),
                token.getClientType(),
                token.getDeviceInfo(),
                token.getCreatedAt(),
                token.getExpiresAt(),
                isCurrent
        );
    }

    private static String hash(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes()));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }
}
