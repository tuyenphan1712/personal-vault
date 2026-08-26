package com.tuyen.personalvault.features.credentials.controller;

import com.tuyen.personalvault.features.credentials.dto.CreateCredentialRequest;
import com.tuyen.personalvault.features.credentials.dto.CredentialResponse;
import com.tuyen.personalvault.features.credentials.dto.UpdateCredentialRequest;
import com.tuyen.personalvault.features.credentials.service.CredentialService;
import com.tuyen.personalvault.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/credentials")
public class CredentialController {

    private final CredentialService credentialService;

    public CredentialController(CredentialService credentialService) {
        this.credentialService = credentialService;
    }

    @GetMapping
    public ApiResponse<List<CredentialResponse>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), Math.min(limit, 100));
        CredentialService.CredentialListResult result = credentialService.list(pageable);
        return ApiResponse.of(result.items(), result.meta());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CredentialResponse>> create(@Valid @RequestBody CreateCredentialRequest request) {
        CredentialResponse response = credentialService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(response));
    }

    @GetMapping("/{id}")
    public ApiResponse<CredentialResponse> get(@PathVariable UUID id) {
        return ApiResponse.of(credentialService.get(id));
    }

    @PatchMapping("/{id}")
    public ApiResponse<CredentialResponse> update(@PathVariable UUID id,
                                                   @Valid @RequestBody UpdateCredentialRequest request) {
        return ApiResponse.of(credentialService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        credentialService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
