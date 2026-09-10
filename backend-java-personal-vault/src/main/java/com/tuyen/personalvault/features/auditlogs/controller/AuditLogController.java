package com.tuyen.personalvault.features.auditlogs.controller;

import com.tuyen.personalvault.features.auditlogs.dto.AuditLogResponse;
import com.tuyen.personalvault.features.auditlogs.dto.UnreadCountResponse;
import com.tuyen.personalvault.features.auditlogs.service.AuditLogService;
import com.tuyen.personalvault.shared.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ApiResponse<List<AuditLogResponse>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        AuditLogService.AuditLogListResult result = auditLogService.list(page, limit);
        return ApiResponse.of(result.items(), result.meta());
    }

    @GetMapping("/unread-count")
    public ApiResponse<UnreadCountResponse> unreadCount() {
        return ApiResponse.of(new UnreadCountResponse(auditLogService.unreadCount()));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> readAll() {
        auditLogService.markAllRead();
        return ResponseEntity.noContent().build();
    }
}
