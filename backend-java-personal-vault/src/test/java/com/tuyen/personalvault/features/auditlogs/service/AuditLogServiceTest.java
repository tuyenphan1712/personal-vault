package com.tuyen.personalvault.features.auditlogs.service;

import com.tuyen.personalvault.features.auditlogs.dto.AuditLogResponse;
import com.tuyen.personalvault.features.auditlogs.entity.AuditAction;
import com.tuyen.personalvault.features.auditlogs.entity.AuditLog;
import com.tuyen.personalvault.features.auditlogs.mapper.AuditLogMapper;
import com.tuyen.personalvault.features.auditlogs.repository.AuditLogRepository;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import com.tuyen.personalvault.shared.response.PageMeta;
import com.tuyen.personalvault.shared.security.CurrentUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    private static final UUID CURRENT_USER_ID = UUID.randomUUID();

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private UserRepository userRepository;

    private final AuditLogMapper auditLogMapper = new AuditLogMapper();

    private AuditLogService auditLogService;

    private MockedStatic<CurrentUser> currentUserMock;

    @BeforeEach
    void setUp() {
        auditLogService = new AuditLogService(auditLogRepository, userRepository, auditLogMapper);
    }

    @AfterEach
    void tearDown() {
        if (currentUserMock != null) {
            currentUserMock.close();
        }
    }

    private void mockCurrentUser() {
        currentUserMock = Mockito.mockStatic(CurrentUser.class);
        currentUserMock.when(CurrentUser::id).thenReturn(CURRENT_USER_ID);
    }

    private User owner() {
        return new User(CURRENT_USER_ID, "0900000000", "Nguyen Van A", "hashed-password");
    }

    @Nested
    class Record {

        @Test
        void savesAnAuditLogEntryForTheGivenUser() {
            when(userRepository.getReferenceById(CURRENT_USER_ID)).thenReturn(owner());

            auditLogService.record(CURRENT_USER_ID, AuditAction.CREDENTIAL_DELETED, "Gmail");

            verify(auditLogRepository).save(any(AuditLog.class));
        }
    }

    @Nested
    class ListLogs {

        @Test
        void returnsItemsAndMetaScopedToCurrentUser() {
            mockCurrentUser();
            Pageable pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt"));
            AuditLog log = new AuditLog(UUID.randomUUID(), owner(), AuditAction.CREDENTIAL_DELETED, "Gmail");
            Page<AuditLog> page = new PageImpl<>(List.of(log), pageable, 1);
            when(auditLogRepository.findAllByUserId(eq(CURRENT_USER_ID), any())).thenReturn(page);

            AuditLogService.AuditLogListResult result = auditLogService.list(1, 20);

            assertThat(result.items()).hasSize(1);
            assertThat(result.items().getFirst().action()).isEqualTo("CREDENTIAL_DELETED");
            assertThat(result.meta()).isEqualTo(new PageMeta(1, 20, 1, 1));
        }
    }

    @Nested
    class UnreadCount {

        @Test
        void returnsCountOfUnreadEntriesForCurrentUser() {
            mockCurrentUser();
            when(auditLogRepository.countByUserIdAndReadAtIsNull(CURRENT_USER_ID)).thenReturn(3L);

            long count = auditLogService.unreadCount();

            assertThat(count).isEqualTo(3L);
        }
    }

    @Nested
    class MarkAllRead {

        @Test
        void marksAllUnreadEntriesReadForCurrentUser() {
            mockCurrentUser();

            auditLogService.markAllRead();

            verify(auditLogRepository).markAllReadForUser(eq(CURRENT_USER_ID), any(LocalDateTime.class));
        }
    }
}
