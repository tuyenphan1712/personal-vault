package com.tuyen.personalvault.features.users.controller;

import com.tuyen.personalvault.features.users.dto.ProfileResponse;
import com.tuyen.personalvault.features.users.exception.UserNotFoundException;
import com.tuyen.personalvault.features.users.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Our real SecurityConfig/JwtAuthenticationFilter aren't loaded in this @WebMvcTest slice —
 * Spring Boot's default security auto-config applies instead (which is why non-GET requests
 * need {@code .with(csrf())}; our real chain has CSRF disabled). A test Authentication is
 * seeded manually so CurrentUser.id() would resolve if the (mocked) service ever called it.
 * Missing/invalid JWT rejection belongs to a security-filter-level test, not here; see
 * UserServiceTest for the ownership/not-found unit coverage.
 */
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

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
    void getProfileReturns200WithProfile() throws Exception {
        ProfileResponse response = new ProfileResponse(
                UUID.randomUUID(), "0900000000", "Nguyen Van A", "member", "active", LocalDate.of(1999, 1, 1));
        when(userService.getProfile()).thenReturn(response);

        mockMvc.perform(get("/api/v1/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.phone").value("0900000000"))
                .andExpect(jsonPath("$.data.fullName").value("Nguyen Van A"));
    }

    @Test
    void patchProfileReturns200WithUpdatedProfile() throws Exception {
        ProfileResponse response = new ProfileResponse(
                UUID.randomUUID(), "0900000000", "Nguyen Van B", "member", "active", LocalDate.of(1999, 1, 1));
        when(userService.updateProfile(any())).thenReturn(response);

        mockMvc.perform(patch("/api/v1/profile")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Nguyen Van B","birthday":"1999-01-01"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Nguyen Van B"));
    }

    @Test
    void patchProfileReturns400WhenFullNameBlank() throws Exception {
        mockMvc.perform(patch("/api/v1/profile")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"","birthday":null}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("COMMON_001"));
    }

    @Test
    void getProfileReturns404WhenUserMissing() throws Exception {
        when(userService.getProfile()).thenThrow(new UserNotFoundException());

        mockMvc.perform(get("/api/v1/profile"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("USER_001"));
    }
}
