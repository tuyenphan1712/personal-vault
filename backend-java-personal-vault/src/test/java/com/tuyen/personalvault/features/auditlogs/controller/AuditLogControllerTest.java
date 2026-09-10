package com.tuyen.personalvault.features.auditlogs.controller;

import com.tuyen.personalvault.features.auditlogs.dto.AuditLogResponse;
import com.tuyen.personalvault.features.auditlogs.dto.UnreadCountResponse;
import com.tuyen.personalvault.features.auditlogs.service.AuditLogService;
import com.tuyen.personalvault.shared.response.PageMeta;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuditLogController.class)
class AuditLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuditLogService auditLogService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(UUID.randomUUID().toString(), null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listReturns200WithItemsAndMeta() throws Exception {
        AuditLogResponse item = new AuditLogResponse(UUID.randomUUID(), "CREDENTIAL_DELETED", "Gmail",
                LocalDateTime.now(), null);
        AuditLogService.AuditLogListResult result = new AuditLogService.AuditLogListResult(
                List.of(item), new PageMeta(1, 20, 1, 1));
        when(auditLogService.list(anyInt(), anyInt())).thenReturn(result);

        mockMvc.perform(get("/api/v1/audit-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].action").value("CREDENTIAL_DELETED"))
                .andExpect(jsonPath("$.data[0].targetLabel").value("Gmail"))
                .andExpect(jsonPath("$.meta.total").value(1));
    }

    @Test
    void unreadCountReturns200WithCount() throws Exception {
        when(auditLogService.unreadCount()).thenReturn(5L);

        mockMvc.perform(get("/api/v1/audit-logs/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.count").value(5));
    }

    @Test
    void readAllReturns204AndMarksAllRead() throws Exception {
        mockMvc.perform(patch("/api/v1/audit-logs/read-all").with(csrf()))
                .andExpect(status().isNoContent());

        verify(auditLogService).markAllRead();
    }
}
