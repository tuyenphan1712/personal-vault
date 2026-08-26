package com.tuyen.personalvault.features.admin.controller;

import com.tuyen.personalvault.features.admin.dto.AdminUserResponse;
import com.tuyen.personalvault.features.admin.dto.UpdateUserStatusRequest;
import com.tuyen.personalvault.features.admin.service.AdminService;
import com.tuyen.personalvault.shared.response.ApiResponse;
import com.tuyen.personalvault.shared.response.PageMeta;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping
    public ApiResponse<List<AdminUserResponse>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Page<AdminUserResponse> result = adminService.listUsers(page, limit, search, sortBy, sortDirection);
        PageMeta meta = new PageMeta(result.getNumber() + 1, result.getSize(),
                result.getTotalElements(), result.getTotalPages());
        return ApiResponse.of(result.getContent(), meta);
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<AdminUserResponse> updateStatus(@PathVariable UUID id,
                                                        @Valid @RequestBody UpdateUserStatusRequest request) {
        return ApiResponse.of(adminService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
