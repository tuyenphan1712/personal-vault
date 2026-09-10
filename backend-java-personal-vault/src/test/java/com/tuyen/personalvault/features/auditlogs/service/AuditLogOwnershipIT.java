package com.tuyen.personalvault.features.auditlogs.service;

import com.tuyen.personalvault.AbstractIntegrationTest;
import com.tuyen.personalvault.features.auditlogs.entity.AuditAction;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Exercises ownership scoping and mark-all-read against a real MySQL instance
 * (Testcontainers), same convention as AdminServiceOwnershipAndCascadeIT.
 */
class AuditLogOwnershipIT extends AbstractIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    private User persistUser(String phone) {
        return userRepository.save(new User(UUID.randomUUID(), phone, "Test User", "hashed-password"));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void actAs(UUID userId) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId.toString(), null, List.of()));
    }

    @Test
    void listAndUnreadCountAreScopedToTheOwningUserOnly() {
        User owner = persistUser("0900000010");
        User otherUser = persistUser("0900000011");

        auditLogService.record(owner.getId(), AuditAction.CREDENTIAL_DELETED, "Gmail");
        auditLogService.record(otherUser.getId(), AuditAction.DOCUMENT_DELETED, "Passport");

        actAs(owner.getId());
        assertThat(auditLogService.unreadCount()).isEqualTo(1);
        assertThat(auditLogService.list(1, 20).items()).hasSize(1);
        assertThat(auditLogService.list(1, 20).items().getFirst().targetLabel()).isEqualTo("Gmail");

        actAs(otherUser.getId());
        assertThat(auditLogService.unreadCount()).isEqualTo(1);
        assertThat(auditLogService.list(1, 20).items()).hasSize(1);
        assertThat(auditLogService.list(1, 20).items().getFirst().targetLabel()).isEqualTo("Passport");
    }

    @Test
    void markAllReadOnlyAffectsTheCallingUsersEntries() {
        User owner = persistUser("0900000012");
        User otherUser = persistUser("0900000013");
        auditLogService.record(owner.getId(), AuditAction.LOGIN_SUCCESS, null);
        auditLogService.record(otherUser.getId(), AuditAction.LOGIN_SUCCESS, null);

        actAs(owner.getId());
        auditLogService.markAllRead();

        assertThat(auditLogService.unreadCount()).isEqualTo(0);

        actAs(otherUser.getId());
        assertThat(auditLogService.unreadCount()).isEqualTo(1);
    }
}
