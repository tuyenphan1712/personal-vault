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
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentStorageService documentStorageService;

    private final AdminUserMapper adminUserMapper = new AdminUserMapper();

    private AdminService adminService;

    private User user() {
        return new User(UUID.randomUUID(), "0900000000", "Nguyen Van A", "hashed-password");
    }

    private Page<User> emptyPage(Pageable pageable) {
        return new PageImpl<>(List.of(), pageable, 0);
    }

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        adminService = new AdminService(userRepository, documentRepository, documentStorageService, adminUserMapper);
    }

    @Nested
    class ListUsers {

        @Test
        void withoutSearchUsesFindAllWithRequestedSortAndPaging() {
            ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
            when(userRepository.findAll(captor.capture())).thenAnswer(inv -> emptyPage(captor.getValue()));

            adminService.listUsers(2, 10, null, "fullName", "asc");

            Pageable used = captor.getValue();
            assertThat(used.getPageNumber()).isEqualTo(1);
            assertThat(used.getPageSize()).isEqualTo(10);
            assertThat(used.getSort().getOrderFor("fullName").getDirection()).isEqualTo(Sort.Direction.ASC);
        }

        @Test
        void invalidSortByFallsBackToCreatedAt() {
            ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
            when(userRepository.findAll(captor.capture())).thenAnswer(inv -> emptyPage(captor.getValue()));

            adminService.listUsers(1, 20, null, "not-a-real-field", "desc");

            assertThat(captor.getValue().getSort().getOrderFor("createdAt")).isNotNull();
        }

        @Test
        void nonAscDirectionDefaultsToDescending() {
            ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
            when(userRepository.findAll(captor.capture())).thenAnswer(inv -> emptyPage(captor.getValue()));

            adminService.listUsers(1, 20, null, "createdAt", "whatever");

            assertThat(captor.getValue().getSort().getOrderFor("createdAt").getDirection())
                    .isEqualTo(Sort.Direction.DESC);
        }

        @Test
        void blankSearchUsesFindAllInsteadOfSearchQuery() {
            when(userRepository.findAll(any(Pageable.class))).thenAnswer(inv -> emptyPage(inv.getArgument(0)));

            adminService.listUsers(1, 20, "  ", "createdAt", "desc");

            verify(userRepository).findAll(any(Pageable.class));
            verify(userRepository, never())
                    .findAllByPhoneContainingOrFullNameContainingIgnoreCase(any(), any(), any());
        }

        @Test
        void nonBlankSearchUsesSearchQuery() {
            when(userRepository.findAllByPhoneContainingOrFullNameContainingIgnoreCase(
                    eq("0900"), eq("0900"), any(Pageable.class)))
                    .thenAnswer(inv -> emptyPage(inv.getArgument(2)));

            Page<AdminUserResponse> result = adminService.listUsers(1, 20, "0900", "createdAt", "desc");

            assertThat(result).isNotNull();
            verify(userRepository, never()).findAll(any(Pageable.class));
        }
    }

    @Nested
    class UpdateStatus {

        @Test
        void updatesUserStatus() {
            User user = user();
            when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
            UpdateUserStatusRequest request = new UpdateUserStatusRequest("locked");

            AdminUserResponse response = adminService.updateStatus(user.getId(), request);

            assertThat(response.status()).isEqualTo("locked");
            assertThat(user.getStatus()).isEqualTo(UserStatus.locked);
        }

        @Test
        void throwsUserNotFoundWhenMissing() {
            UUID id = UUID.randomUUID();
            when(userRepository.findById(id)).thenReturn(Optional.empty());
            UpdateUserStatusRequest request = new UpdateUserStatusRequest("active");

            assertThatThrownBy(() -> adminService.updateStatus(id, request))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    @Nested
    class DeleteUser {

        @Test
        void deletesDocumentFilesThenRowsThenUser() {
            User user = user();
            Document doc1 = new Document(UUID.randomUUID(), user, "Doc 1", "cccd", "/storage/1", "image/png", 10L);
            Document doc2 = new Document(UUID.randomUUID(), user, "Doc 2", "passport", "/storage/2", "image/png", 20L);
            when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
            when(documentRepository.findAllByUserId(user.getId())).thenReturn(List.of(doc1, doc2));

            adminService.deleteUser(user.getId());

            InOrder order = inOrder(documentStorageService, documentRepository, userRepository);
            order.verify(documentStorageService).delete("/storage/1");
            order.verify(documentStorageService).delete("/storage/2");
            order.verify(documentRepository).deleteAll(List.of(doc1, doc2));
            order.verify(userRepository).delete(user);
        }

        @Test
        void deletesUserWithoutDocumentsWithoutTouchingStorage() {
            User user = user();
            when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
            when(documentRepository.findAllByUserId(user.getId())).thenReturn(List.of());

            adminService.deleteUser(user.getId());

            verify(documentStorageService, never()).delete(any());
            verify(userRepository).delete(user);
        }

        @Test
        void throwsUserNotFoundWithoutTouchingDocuments() {
            UUID id = UUID.randomUUID();
            when(userRepository.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminService.deleteUser(id)).isInstanceOf(UserNotFoundException.class);
            verify(documentRepository, never()).findAllByUserId(any());
        }
    }
}
