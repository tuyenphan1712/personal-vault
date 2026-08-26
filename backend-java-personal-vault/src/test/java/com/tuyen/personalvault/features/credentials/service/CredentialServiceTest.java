package com.tuyen.personalvault.features.credentials.service;

import com.tuyen.personalvault.features.credentials.dto.CreateCredentialRequest;
import com.tuyen.personalvault.features.credentials.dto.CredentialResponse;
import com.tuyen.personalvault.features.credentials.dto.UpdateCredentialRequest;
import com.tuyen.personalvault.features.credentials.entity.Credential;
import com.tuyen.personalvault.features.credentials.exception.CredentialNotFoundException;
import com.tuyen.personalvault.features.credentials.mapper.CredentialMapper;
import com.tuyen.personalvault.features.credentials.repository.CredentialRepository;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.repository.UserRepository;
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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CredentialServiceTest {

    private static final UUID CURRENT_USER_ID = UUID.randomUUID();

    @Mock
    private CredentialRepository credentialRepository;

    @Mock
    private UserRepository userRepository;

    private final CredentialMapper credentialMapper = new CredentialMapper();

    private CredentialService credentialService;

    private MockedStatic<CurrentUser> currentUserMock;

    @BeforeEach
    void setUp() {
        credentialService = new CredentialService(credentialRepository, userRepository, credentialMapper);
        currentUserMock = Mockito.mockStatic(CurrentUser.class);
        currentUserMock.when(CurrentUser::id).thenReturn(CURRENT_USER_ID);
    }

    @AfterEach
    void tearDown() {
        currentUserMock.close();
    }

    private User owner() {
        return new User(CURRENT_USER_ID, "0900000000", "Nguyen Van A", "hashed-password");
    }

    private Credential credential() {
        return new Credential(UUID.randomUUID(), owner(), "Gmail", "user@gmail.com",
                "base64(iv):base64(cipher)", 1, "note");
    }

    @Nested
    class ListCredentials {

        @Test
        void returnsItemsAndMetaScopedToCurrentUser() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<Credential> page = new PageImpl<>(List.of(credential()), pageable, 1);
            when(credentialRepository.findAllByUserId(CURRENT_USER_ID, pageable)).thenReturn(page);

            CredentialService.CredentialListResult result = credentialService.list(pageable);

            assertThat(result.items()).hasSize(1);
            assertThat(result.meta().page()).isEqualTo(1);
            assertThat(result.meta().limit()).isEqualTo(20);
            assertThat(result.meta().total()).isEqualTo(1);
            assertThat(result.meta().totalPages()).isEqualTo(1);
        }
    }

    @Nested
    class Get {

        @Test
        void returnsCredentialWhenOwnedByCurrentUser() {
            Credential credential = credential();
            when(credentialRepository.findByIdAndUserId(credential.getId(), CURRENT_USER_ID))
                    .thenReturn(Optional.of(credential));

            CredentialResponse response = credentialService.get(credential.getId());

            assertThat(response.platformName()).isEqualTo("Gmail");
            assertThat(response.encryptedPassword()).isEqualTo("base64(iv):base64(cipher)");
        }

        @Test
        void throwsNotFoundWhenMissingOrOwnedByAnotherUser() {
            UUID id = UUID.randomUUID();
            when(credentialRepository.findByIdAndUserId(id, CURRENT_USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> credentialService.get(id))
                    .isInstanceOf(CredentialNotFoundException.class);
        }
    }

    @Nested
    class Create {

        @Test
        void createsCredentialWithProvidedCiphertextVersion() {
            when(userRepository.getReferenceById(CURRENT_USER_ID)).thenReturn(owner());
            CreateCredentialRequest request = new CreateCredentialRequest(
                    "Gmail", "user@gmail.com", "base64(iv):base64(cipher)", 2, "note");

            CredentialResponse response = credentialService.create(request);

            assertThat(response.platformName()).isEqualTo("Gmail");
            assertThat(response.ciphertextVersion()).isEqualTo(2);
            verify(credentialRepository).save(any(Credential.class));
        }

        @Test
        void defaultsCiphertextVersionToOneWhenOmitted() {
            when(userRepository.getReferenceById(CURRENT_USER_ID)).thenReturn(owner());
            CreateCredentialRequest request = new CreateCredentialRequest(
                    "Gmail", "user@gmail.com", "base64(iv):base64(cipher)", null, null);

            CredentialResponse response = credentialService.create(request);

            assertThat(response.ciphertextVersion()).isEqualTo(1);
        }
    }

    @Nested
    class Update {

        @Test
        void updatesOnlyNonNullFields() {
            Credential credential = credential();
            when(credentialRepository.findByIdAndUserId(credential.getId(), CURRENT_USER_ID))
                    .thenReturn(Optional.of(credential));
            UpdateCredentialRequest request = new UpdateCredentialRequest(null, null, null, null, "updated note");

            CredentialResponse response = credentialService.update(credential.getId(), request);

            assertThat(response.note()).isEqualTo("updated note");
            assertThat(response.platformName()).isEqualTo("Gmail");
            assertThat(response.account()).isEqualTo("user@gmail.com");
        }

        @Test
        void throwsNotFoundWhenMissing() {
            UUID id = UUID.randomUUID();
            when(credentialRepository.findByIdAndUserId(id, CURRENT_USER_ID)).thenReturn(Optional.empty());
            UpdateCredentialRequest request = new UpdateCredentialRequest(null, null, null, null, "x");

            assertThatThrownBy(() -> credentialService.update(id, request))
                    .isInstanceOf(CredentialNotFoundException.class);
        }
    }

    @Nested
    class Delete {

        @Test
        void deletesCredentialWhenOwned() {
            Credential credential = credential();
            when(credentialRepository.findByIdAndUserId(credential.getId(), CURRENT_USER_ID))
                    .thenReturn(Optional.of(credential));

            credentialService.delete(credential.getId());

            verify(credentialRepository).delete(credential);
        }

        @Test
        void throwsNotFoundWhenMissing() {
            UUID id = UUID.randomUUID();
            when(credentialRepository.findByIdAndUserId(id, CURRENT_USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> credentialService.delete(id))
                    .isInstanceOf(CredentialNotFoundException.class);
            verify(credentialRepository, never()).delete(any());
        }
    }
}
