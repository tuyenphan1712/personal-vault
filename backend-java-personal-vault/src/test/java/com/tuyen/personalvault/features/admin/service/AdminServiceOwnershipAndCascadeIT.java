package com.tuyen.personalvault.features.admin.service;

import com.tuyen.personalvault.AbstractIntegrationTest;
import com.tuyen.personalvault.features.auth.entity.ClientType;
import com.tuyen.personalvault.features.auth.entity.RefreshToken;
import com.tuyen.personalvault.features.auth.repository.RefreshTokenRepository;
import com.tuyen.personalvault.features.credentials.dto.CreateCredentialRequest;
import com.tuyen.personalvault.features.credentials.dto.CredentialResponse;
import com.tuyen.personalvault.features.credentials.exception.CredentialNotFoundException;
import com.tuyen.personalvault.features.credentials.repository.CredentialRepository;
import com.tuyen.personalvault.features.credentials.service.CredentialService;
import com.tuyen.personalvault.features.documents.dto.DocumentResponse;
import com.tuyen.personalvault.features.documents.exception.DocumentNotFoundException;
import com.tuyen.personalvault.features.documents.repository.DocumentRepository;
import com.tuyen.personalvault.features.documents.service.DocumentService;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Exercises ownership scoping and the admin delete-cascade against a real MySQL instance
 * (Testcontainers) instead of mocked repositories, per BE-PROJECT-RULES.md §8.
 */
class AdminServiceOwnershipAndCascadeIT extends AbstractIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CredentialRepository credentialRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private CredentialService credentialService;

    @Autowired
    private DocumentService documentService;

    @Autowired
    private AdminService adminService;

    private User persistUser(String phone) {
        User user = new User(UUID.randomUUID(), phone, "Test User", "hashed-password");
        return userRepository.save(user);
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
    void ownerAndOtherUserAccessAreCorrectlyScoped() {
        User owner = persistUser("0900000001");
        User otherUser = persistUser("0900000002");

        actAs(owner.getId());
        CredentialResponse credential = credentialService.create(
                new CreateCredentialRequest("Gmail", "owner@gmail.com", "iv:cipher", 1, null));

        actAs(otherUser.getId());
        assertThatThrownBy(() -> credentialService.get(credential.id()))
                .isInstanceOf(CredentialNotFoundException.class);

        actAs(owner.getId());
        assertThat(credentialService.get(credential.id()).platformName()).isEqualTo("Gmail");
    }

    @Test
    void deletingUserCascadesCredentialsRefreshTokensAndDeletesDocumentFiles() throws Exception {
        User user = persistUser("0900000003");
        actAs(user.getId());

        CredentialResponse credential = credentialService.create(
                new CreateCredentialRequest("Facebook", "owner@fb.com", "iv:cipher", 1, null));

        byte[] pngBytes = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};
        MockMultipartFile file = new MockMultipartFile("file", "id.png", "image/png", pngBytes);
        DocumentResponse document = documentService.upload(file, "ID card", "cccd");
        Path storedFilePath = Path.of(documentRepository.findById(document.id()).orElseThrow().getStoragePath());
        assertThat(Files.exists(storedFilePath)).isTrue();

        RefreshToken token = refreshTokenRepository.save(new RefreshToken(UUID.randomUUID(), user, "some-token-hash",
                ClientType.web, "test-agent", LocalDateTime.now().plusDays(1)));

        adminService.deleteUser(user.getId());

        assertThat(userRepository.findById(user.getId())).isEmpty();
        assertThat(credentialRepository.findById(credential.id())).isEmpty();
        assertThat(documentRepository.findAllByUserId(user.getId())).isEmpty();
        assertThat(refreshTokenRepository.findById(token.getId())).isEmpty();
        assertThat(Files.exists(storedFilePath)).isFalse();

        actAs(user.getId());
        assertThatThrownBy(() -> documentService.get(document.id())).isInstanceOf(DocumentNotFoundException.class);
    }
}
