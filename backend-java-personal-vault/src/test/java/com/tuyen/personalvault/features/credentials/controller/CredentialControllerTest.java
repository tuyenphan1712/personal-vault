package com.tuyen.personalvault.features.credentials.controller;

import com.tuyen.personalvault.features.credentials.dto.CredentialResponse;
import com.tuyen.personalvault.features.credentials.exception.CredentialNotFoundException;
import com.tuyen.personalvault.features.credentials.service.CredentialService;
import com.tuyen.personalvault.shared.response.PageMeta;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Same slice-test convention as UserControllerTest/AuthControllerTest — see the note there.
 */
@WebMvcTest(CredentialController.class)
class CredentialControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CredentialService credentialService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(UUID.randomUUID().toString(), null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private CredentialResponse sampleResponse() {
        return new CredentialResponse(UUID.randomUUID(), "Gmail", "user@gmail.com",
                "base64(iv):base64(cipher)", 1, "note", LocalDateTime.now(), LocalDateTime.now());
    }

    @Test
    void listReturns200WithItemsAndMeta() throws Exception {
        CredentialService.CredentialListResult result = new CredentialService.CredentialListResult(
                List.of(sampleResponse()), new PageMeta(1, 20, 1, 1));
        when(credentialService.list(anyInt(), anyInt(), any(), any(), any())).thenReturn(result);

        mockMvc.perform(get("/api/v1/credentials"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].platformName").value("Gmail"))
                .andExpect(jsonPath("$.meta.total").value(1));
    }

    @Test
    void listPassesSearchAndSortParamsToService() throws Exception {
        CredentialService.CredentialListResult result = new CredentialService.CredentialListResult(
                List.of(), new PageMeta(1, 20, 0, 0));
        when(credentialService.list(1, 20, "gmail", "platformName", "asc")).thenReturn(result);

        mockMvc.perform(get("/api/v1/credentials")
                        .param("search", "gmail")
                        .param("sortBy", "platformName")
                        .param("sortDirection", "asc"))
                .andExpect(status().isOk());
    }

    @Test
    void createReturns201OnValidRequest() throws Exception {
        when(credentialService.create(any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/credentials")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"platformName":"Gmail","account":"user@gmail.com","encryptedPassword":"base64(iv):base64(cipher)"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.platformName").value("Gmail"))
                .andExpect(jsonPath("$.data.encryptedPassword").value("base64(iv):base64(cipher)"));
    }

    @Test
    void createReturns400OnBlankPlatformName() throws Exception {
        mockMvc.perform(post("/api/v1/credentials")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"platformName":"","account":"user@gmail.com","encryptedPassword":"base64(iv):base64(cipher)"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("COMMON_001"))
                .andExpect(jsonPath("$.error.details[0].field").value("platformName"))
                .andExpect(jsonPath("$.error.details[0].message").isNotEmpty());
    }

    @Test
    void getReturns200WithEncryptedPasswordIncluded() throws Exception {
        CredentialResponse response = sampleResponse();
        when(credentialService.get(response.id())).thenReturn(response);

        mockMvc.perform(get("/api/v1/credentials/{id}", response.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.encryptedPassword").value("base64(iv):base64(cipher)"));
    }

    @Test
    void getReturns404WhenNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(credentialService.get(id)).thenThrow(new CredentialNotFoundException());

        mockMvc.perform(get("/api/v1/credentials/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("CREDENTIAL_001"));
    }

    @Test
    void updateReturns200OnSuccess() throws Exception {
        CredentialResponse response = sampleResponse();
        when(credentialService.update(any(), any())).thenReturn(response);

        mockMvc.perform(patch("/api/v1/credentials/{id}", response.id())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"note":"updated"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.platformName").value("Gmail"));
    }

    @Test
    void updateReturns404WhenNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(credentialService.update(any(), any())).thenThrow(new CredentialNotFoundException());

        mockMvc.perform(patch("/api/v1/credentials/{id}", id)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"note":"updated"}
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("CREDENTIAL_001"));
    }

    @Test
    void deleteReturns204OnSuccess() throws Exception {
        mockMvc.perform(delete("/api/v1/credentials/{id}", UUID.randomUUID()).with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteReturns404WhenNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new CredentialNotFoundException()).when(credentialService).delete(id);

        mockMvc.perform(delete("/api/v1/credentials/{id}", id).with(csrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("CREDENTIAL_001"));
    }
}
