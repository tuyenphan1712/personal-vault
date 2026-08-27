package com.tuyen.personalvault.features.documents.controller;

import com.tuyen.personalvault.features.documents.dto.DocumentResponse;
import com.tuyen.personalvault.features.documents.exception.DocumentNotFoundException;
import com.tuyen.personalvault.features.documents.exception.FileTooLargeException;
import com.tuyen.personalvault.features.documents.exception.UnsupportedFileTypeException;
import com.tuyen.personalvault.features.documents.service.DocumentService;
import com.tuyen.personalvault.shared.exception.AppException;
import com.tuyen.personalvault.shared.response.PageMeta;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Same slice-test convention as UserControllerTest/AuthControllerTest/CredentialControllerTest.
 */
@WebMvcTest(DocumentController.class)
class DocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DocumentService documentService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(UUID.randomUUID().toString(), null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private DocumentResponse sampleResponse() {
        return new DocumentResponse(UUID.randomUUID(), "Passport front", "passport",
                "image/png", 1024L, LocalDateTime.now());
    }

    @Test
    void listReturns200WithItemsAndMeta() throws Exception {
        DocumentService.DocumentListResult result = new DocumentService.DocumentListResult(
                List.of(sampleResponse()), new PageMeta(1, 20, 1, 1));
        when(documentService.list(anyInt(), anyInt(), any(), any(), any(), any())).thenReturn(result);

        mockMvc.perform(get("/api/v1/documents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].title").value("Passport front"))
                .andExpect(jsonPath("$.meta.total").value(1));
    }

    @Test
    void listPassesSearchDocTypeAndSortParamsToService() throws Exception {
        DocumentService.DocumentListResult result = new DocumentService.DocumentListResult(
                List.of(), new PageMeta(1, 20, 0, 0));
        when(documentService.list(1, 20, "front", "passport", "title", "asc")).thenReturn(result);

        mockMvc.perform(get("/api/v1/documents")
                        .param("search", "front")
                        .param("docType", "passport")
                        .param("sortBy", "title")
                        .param("sortDirection", "asc"))
                .andExpect(status().isOk());
    }

    @Test
    void uploadReturns201OnValidRequest() throws Exception {
        when(documentService.upload(any(), any(), any())).thenReturn(sampleResponse());
        MockMultipartFile file = new MockMultipartFile("file", "passport.png", "image/png", "x".getBytes());
        MockMultipartFile title = new MockMultipartFile("title", "", "text/plain", "Passport front".getBytes());
        MockMultipartFile docType = new MockMultipartFile("docType", "", "text/plain", "passport".getBytes());

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .file(title)
                        .file(docType)
                        .with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Passport front"))
                .andExpect(jsonPath("$.data.docType").value("passport"))
                .andExpect(jsonPath("$.data.mimeType").value("image/png"));
    }

    @Test
    void uploadReturns415OnUnsupportedFileType() throws Exception {
        when(documentService.upload(any(), any(), any())).thenThrow(new UnsupportedFileTypeException());
        MockMultipartFile file = new MockMultipartFile("file", "archive.zip", "application/zip", "x".getBytes());
        MockMultipartFile title = new MockMultipartFile("title", "", "text/plain", "Archive".getBytes());

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .file(title)
                        .with(csrf()))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.error.code").value("DOCUMENT_002"));
    }

    @Test
    void uploadReturns413OnOversizedFile() throws Exception {
        when(documentService.upload(any(), any(), any())).thenThrow(new FileTooLargeException());
        MockMultipartFile file = new MockMultipartFile("file", "big.png", "image/png", "x".getBytes());
        MockMultipartFile title = new MockMultipartFile("title", "", "text/plain", "Big file".getBytes());

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .file(title)
                        .with(csrf()))
                .andExpect(status().is(HttpStatus.CONTENT_TOO_LARGE.value()))
                .andExpect(jsonPath("$.error.code").value("DOCUMENT_003"));
    }

    @Test
    void uploadReturns400OnInvalidDocType() throws Exception {
        when(documentService.upload(any(), any(), any())).thenThrow(new AppException(
                "COMMON_001", "Validation failed", HttpStatus.BAD_REQUEST,
                List.of(Map.of("field", "docType", "message", "docType must be one of: cccd, diploma, passport"))));
        MockMultipartFile file = new MockMultipartFile("file", "passport.png", "image/png", "x".getBytes());
        MockMultipartFile title = new MockMultipartFile("title", "", "text/plain", "Passport front".getBytes());
        MockMultipartFile docType = new MockMultipartFile("docType", "", "text/plain", "not-a-real-type".getBytes());

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .file(title)
                        .file(docType)
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("COMMON_001"))
                .andExpect(jsonPath("$.error.details[0].field").value("docType"));
    }

    @Test
    void getReturns200() throws Exception {
        DocumentResponse response = sampleResponse();
        when(documentService.get(response.id())).thenReturn(response);

        mockMvc.perform(get("/api/v1/documents/{id}", response.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Passport front"));
    }

    @Test
    void getReturns404WhenNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(documentService.get(id)).thenThrow(new DocumentNotFoundException());

        mockMvc.perform(get("/api/v1/documents/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("DOCUMENT_001"));
    }

    @Test
    void downloadReturns200WithContentTypeAndDisposition() throws Exception {
        Resource resource = new ByteArrayResource("file-bytes".getBytes());
        DocumentService.DownloadableDocument downloadable =
                new DocumentService.DownloadableDocument(resource, "image/png", "Passport front");
        UUID id = UUID.randomUUID();
        when(documentService.download(id)).thenReturn(downloadable);

        mockMvc.perform(get("/api/v1/documents/{id}/download", id))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"Passport front\""))
                .andExpect(content().bytes("file-bytes".getBytes()));
    }

    @Test
    void downloadReturns404WhenNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(documentService.download(id)).thenThrow(new DocumentNotFoundException());

        mockMvc.perform(get("/api/v1/documents/{id}/download", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("DOCUMENT_001"));
    }

    @Test
    void deleteReturns204OnSuccess() throws Exception {
        mockMvc.perform(delete("/api/v1/documents/{id}", UUID.randomUUID()).with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteReturns404WhenNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new DocumentNotFoundException()).when(documentService).delete(id);

        mockMvc.perform(delete("/api/v1/documents/{id}", id).with(csrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("DOCUMENT_001"));
    }
}
