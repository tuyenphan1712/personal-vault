package com.tuyen.personalvault.features.auth.repository;

import com.tuyen.personalvault.features.auth.entity.RefreshToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from RefreshToken t where t.tokenHash = :tokenHash")
    Optional<RefreshToken> findByTokenHashForUpdate(String tokenHash);

    Optional<RefreshToken> findByIdAndUserId(UUID id, UUID userId);

    @Query("""
            select t from RefreshToken t
            where t.user.id = :userId and t.revokedAt is null and t.expiresAt > :now
            order by t.createdAt desc
            """)
    List<RefreshToken> findAllUsableByUserId(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("""
            update RefreshToken t set t.revokedAt = CURRENT_TIMESTAMP
            where t.user.id = :userId
              and t.revokedAt is null
              and (:keepId is null or t.id <> :keepId)
            """)
    void revokeAllForUserExcept(@Param("userId") UUID userId, @Param("keepId") UUID keepId);
}
