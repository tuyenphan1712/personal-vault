package com.tuyen.personalvault.features.auditlogs.mapper;

import com.tuyen.personalvault.features.auditlogs.dto.AuditLogResponse;
import com.tuyen.personalvault.features.auditlogs.entity.AuditLog;
import org.springframework.stereotype.Component;

@Component
public class AuditLogMapper {

    public AuditLogResponse toResponse(AuditLog auditLog) {
        return new AuditLogResponse(
                auditLog.getId(),
                auditLog.getAction().name(),
                auditLog.getTargetLabel(),
                auditLog.getCreatedAt(),
                auditLog.getReadAt()
        );
    }
}
