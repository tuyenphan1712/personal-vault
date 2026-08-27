package com.tuyen.personalvault.config;

import com.tuyen.personalvault.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Proves the gap flagged in AuthContext.md is closed: a missing/invalid access token must return
 * the project's standard { success:false, error:{...} } envelope, not Spring Security's default
 * response, and this can only be verified with the real security filter chain loaded.
 */
@AutoConfigureMockMvc
class SecurityEntryPointIT extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void missingTokenReturns401WithStandardErrorEnvelope() throws Exception {
        mockMvc.perform(get("/api/v1/credentials"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("AUTH_005"))
                .andExpect(jsonPath("$.error.message").isNotEmpty());
    }

    @Test
    void invalidTokenReturns401WithStandardErrorEnvelope() throws Exception {
        mockMvc.perform(get("/api/v1/credentials").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("AUTH_005"));
    }
}
