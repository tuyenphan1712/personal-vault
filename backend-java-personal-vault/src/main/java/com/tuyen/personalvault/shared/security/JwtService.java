package com.tuyen.personalvault.shared.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private static final String ROLE_CLAIM = "role";

    private final JwtProperties jwtProperties;
    private final SecretKey signingKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.signingKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(UUID userId, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim(ROLE_CLAIM, role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(jwtProperties.getAccessTokenExpirationMs())))
                .signWith(signingKey)
                .compact();
    }

    public long getAccessTokenExpirationSeconds() {
        return jwtProperties.getAccessTokenExpirationMs() / 1000;
    }

    public UUID parseUserId(String token) {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    public String parseRole(String token) {
        return parseClaims(token).get(ROLE_CLAIM, String.class);
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
