package com.tuyen.personalvault.features.auditlogs.service;

import com.tuyen.personalvault.features.auditlogs.dto.AuditLogResponse;
import com.tuyen.personalvault.features.auditlogs.entity.AuditAction;
import com.tuyen.personalvault.features.auditlogs.entity.AuditLog;
import com.tuyen.personalvault.features.auditlogs.mapper.AuditLogMapper;
import com.tuyen.personalvault.features.auditlogs.repository.AuditLogRepository;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import com.tuyen.personalvault.shared.response.PageMeta;
import com.tuyen.personalvault.shared.security.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final AuditLogMapper auditLogMapper;

    public AuditLogService(AuditLogRepository auditLogRepository,
                            UserRepository userRepository,
                            AuditLogMapper auditLogMapper) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.auditLogMapper = auditLogMapper;
    }

    @Transactional
    public void record(UUID userId, AuditAction action, String targetLabel) {
        User user = userRepository.getReferenceById(userId);
        auditLogRepository.save(new AuditLog(UUID.randomUUID(), user, action, targetLabel));
    }

    public AuditLogListResult list(int page, int limit) {
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), Math.min(limit, 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<AuditLog> resultPage = auditLogRepository.findAllByUserId(CurrentUser.id(), pageable);
        return new AuditLogListResult(
                resultPage.map(auditLogMapper::toResponse).getContent(),
                new PageMeta(pageable.getPageNumber() + 1, pageable.getPageSize(),
                        resultPage.getTotalElements(), resultPage.getTotalPages())
        );
    }

    public long unreadCount() {
        return auditLogRepository.countByUserIdAndReadAtIsNull(CurrentUser.id());
    }

    @Transactional
    public void markAllRead() {
        auditLogRepository.markAllReadForUser(CurrentUser.id(), LocalDateTime.now());
    }

    public record AuditLogListResult(List<AuditLogResponse> items, PageMeta meta) {
    }
}
