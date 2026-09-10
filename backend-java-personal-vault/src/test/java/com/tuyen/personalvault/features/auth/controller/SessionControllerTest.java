package com.tuyen.personalvault.features.auth.controller;

import com.tuyen.personalvault.features.auth.dto.SessionResponse;
import com.tuyen.personalvault.features.auth.entity.ClientType;
import com.tuyen.personalvault.features.auth.exception.CannotRevokeCurrentSessionException;
import com.tuyen.personalvault.features.auth.exception.SessionNotFoundException;
import com.tuyen.personalvault.features.auth.service.SessionService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SessionController.class)
class SessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SessionService sessionService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(UUID.randomUUID().toString(), null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private SessionResponse sampleResponse(boolean isCurrent) {
        return new SessionResponse(UUID.randomUUID(), ClientType.web, "test-agent",
                LocalDateTime.now(), LocalDateTime.now().plusDays(30), isCurrent);
    }

    @Test
    void listReturns200WithItems() throws Exception {
        when(sessionService.list(any())).thenReturn(List.of(sampleResponse(true)));

        mockMvc.perform(get("/api/v1/sessions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].isCurrent").value(true));
    }

    @Test
    void listPassesCookieTokenWhenPresent() throws Exception {
        when(sessionService.list(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/sessions").cookie(new jakarta.servlet.http.Cookie("refreshToken", "cookie-raw-token")))
                .andExpect(status().isOk());

        verify(sessionService).list(eq("cookie-raw-token"));
    }

    @Test
    void listPassesQueryParamWhenNoCookie() throws Exception {
        when(sessionService.list(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/sessions").param("currentRefreshToken", "mobile-raw-token"))
                .andExpect(status().isOk());

        verify(sessionService).list(eq("mobile-raw-token"));
    }

    @Test
    void revokeReturns204OnSuccess() throws Exception {
        mockMvc.perform(delete("/api/v1/sessions/{id}", UUID.randomUUID()).with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void revokeReturns404WhenNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new SessionNotFoundException()).when(sessionService).revoke(eq(id), any());

        mockMvc.perform(delete("/api/v1/sessions/{id}", id).with(csrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("SESSION_001"));
    }

    @Test
    void revokeReturns400WhenTargetingCurrentSession() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new CannotRevokeCurrentSessionException()).when(sessionService).revoke(eq(id), any());

        mockMvc.perform(delete("/api/v1/sessions/{id}", id).with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("SESSION_002"));
    }
}
