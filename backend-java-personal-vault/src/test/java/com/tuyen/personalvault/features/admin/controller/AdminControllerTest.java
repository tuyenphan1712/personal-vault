package com.tuyen.personalvault.features.admin.controller;

import com.tuyen.personalvault.features.admin.dto.AdminUserResponse;
import com.tuyen.personalvault.features.admin.service.AdminService;
import com.tuyen.personalvault.features.users.exception.UserNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Same slice-test convention as the other controllers — see UserControllerTest. Note
 * @PreAuthorize("hasRole('ADMIN')") on AdminController isn't enforced in this slice (method
 * security beans from SecurityConfig aren't loaded), so this only checks the MVC contract.
 */
@WebMvcTest(AdminController.class)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminService adminService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(UUID.randomUUID().toString(), null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private AdminUserResponse sampleUser() {
        return new AdminUserResponse(UUID.randomUUID(), "0900000000", "Nguyen Van A", "member", "active", LocalDateTime.now());
    }

    @Test
    void listReturns200WithItemsAndMeta() throws Exception {
        AdminUserResponse user = sampleUser();
        when(adminService.listUsers(1, 20, null, "createdAt", "desc"))
                .thenReturn(new PageImpl<>(List.of(user), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].phone").value("0900000000"))
                .andExpect(jsonPath("$.meta.total").value(1));
    }

    @Test
    void updateStatusReturns200OnSuccess() throws Exception {
        AdminUserResponse response = sampleUser();
        when(adminService.updateStatus(any(), any())).thenReturn(response);

        mockMvc.perform(patch("/api/v1/admin/users/{id}/status", response.id())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"locked"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.phone").value("0900000000"));
    }

    @Test
    void updateStatusReturns400OnInvalidStatusValue() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/users/{id}/status", UUID.randomUUID())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"banned"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("COMMON_001"));
    }

    @Test
    void updateStatusReturns400WhenStatusMissing() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/users/{id}/status", UUID.randomUUID())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("COMMON_001"));
    }

    @Test
    void updateStatusReturns404WhenUserMissing() throws Exception {
        when(adminService.updateStatus(any(), any())).thenThrow(new UserNotFoundException());

        mockMvc.perform(patch("/api/v1/admin/users/{id}/status", UUID.randomUUID())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"locked"}
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("USER_001"));
    }

    @Test
    void deleteReturns204OnSuccess() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/users/{id}", UUID.randomUUID()).with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteReturns404WhenUserMissing() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new UserNotFoundException()).when(adminService).deleteUser(id);

        mockMvc.perform(delete("/api/v1/admin/users/{id}", id).with(csrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("USER_001"));
    }
}
