package com.tuyen.personalvault.config;

import com.tuyen.personalvault.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * A browser preflight (OPTIONS) request to a protected endpoint carries no Authorization header
 * by spec, so it must be let through by Spring Security before authorization checks run — not
 * rejected as unauthenticated — otherwise the browser never sees the CORS headers and blocks the
 * real request client-side. This isn't observable via a plain 401 test (see SecurityEntryPointIT)
 * since the failure mode is specific to how the browser CORS handshake works.
 */
@AutoConfigureMockMvc
class CorsPreflightIT extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void preflightForProtectedEndpointSucceedsWithCorsHeaders() throws Exception {
        mockMvc.perform(options("/api/v1/credentials")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"));
    }
}
