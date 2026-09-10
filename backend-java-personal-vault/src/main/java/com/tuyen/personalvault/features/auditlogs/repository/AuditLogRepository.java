package com.tuyen.personalvault.features.auditlogs.repository;

import com.tuyen.personalvault.features.auditlogs.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findAllByUserId(UUID userId, Pageable pageable);

    long countByUserIdAndReadAtIsNull(UUID userId);

    @Modifying
    @Query("update AuditLog a set a.readAt = :readAt where a.user.id = :userId and a.readAt is null")
    void markAllReadForUser(@Param("userId") UUID userId, @Param("readAt") LocalDateTime readAt);
}
