package com.tuyen.personalvault.features.admin.service;

import com.tuyen.personalvault.features.admin.dto.AdminUserResponse;
import com.tuyen.personalvault.features.admin.dto.UpdateUserStatusRequest;
import com.tuyen.personalvault.features.admin.mapper.AdminUserMapper;
import com.tuyen.personalvault.features.documents.entity.Document;
import com.tuyen.personalvault.features.documents.repository.DocumentRepository;
import com.tuyen.personalvault.features.documents.service.DocumentStorageService;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.entity.UserStatus;
import com.tuyen.personalvault.features.users.exception.UserNotFoundException;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AdminService {

    private static final Set<String> SORTABLE_FIELDS = Set.of("createdAt", "fullName", "phone", "status", "role");

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final DocumentStorageService documentStorageService;
    private final AdminUserMapper adminUserMapper;

    public AdminService(UserRepository userRepository,
                         DocumentRepository documentRepository,
                         DocumentStorageService documentStorageService,
                         AdminUserMapper adminUserMapper) {
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.documentStorageService = documentStorageService;
        this.adminUserMapper = adminUserMapper;
    }

    public Page<AdminUserResponse> listUsers(int page, int limit, String search, String sortBy, String sortDirection) {
        String sortField = SORTABLE_FIELDS.contains(sortBy) ? sortBy : "createdAt";
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), Math.min(limit, 100), Sort.by(direction, sortField));

        Page<User> users = (search == null || search.isBlank())
                ? userRepository.findAll(pageable)
                : userRepository.findAllByPhoneContainingOrFullNameContainingIgnoreCase(search, search, pageable);

        return users.map(adminUserMapper::toResponse);
    }

    @Transactional
    public AdminUserResponse updateStatus(UUID userId, UpdateUserStatusRequest request) {
        User user = findUser(userId);
        user.setStatus(UserStatus.valueOf(request.status()));
        return adminUserMapper.toResponse(user);
    }

    @Transactional
    public void deleteUser(UUID userId) {
        User user = findUser(userId);

        List<Document> documents = documentRepository.findAllByUserId(userId);
        documents.forEach(document -> documentStorageService.delete(document.getStoragePath()));
        documentRepository.deleteAll(documents);

        userRepository.delete(user);
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
    }
}
