package com.tuyen.personalvault.features.documents.service;

import com.tuyen.personalvault.features.documents.dto.DocumentResponse;
import com.tuyen.personalvault.features.documents.entity.Document;
import com.tuyen.personalvault.features.documents.exception.DocumentNotFoundException;
import com.tuyen.personalvault.features.documents.mapper.DocumentMapper;
import com.tuyen.personalvault.features.documents.repository.DocumentRepository;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import com.tuyen.personalvault.shared.exception.AppException;
import com.tuyen.personalvault.shared.security.CurrentUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    private static final UUID CURRENT_USER_ID = UUID.randomUUID();

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DocumentStorageService storageService;

    private final DocumentMapper documentMapper = new DocumentMapper();

    private DocumentService documentService;

    private MockedStatic<CurrentUser> currentUserMock;

    @BeforeEach
    void setUp() {
        documentService = new DocumentService(documentRepository, userRepository, documentMapper, storageService);
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

    private Document document() {
        return new Document(UUID.randomUUID(), owner(), "Passport front", "passport",
                "/storage/documents/abc", "image/png", 1024L);
    }

    @Nested
    class ListDocuments {

        @Test
        void returnsItemsAndMetaScopedToCurrentUser() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<Document> page = new PageImpl<>(List.of(document()), pageable, 1);
            when(documentRepository.findAllByUserId(CURRENT_USER_ID, pageable)).thenReturn(page);

            DocumentService.DocumentListResult result = documentService.list(pageable);

            assertThat(result.items()).hasSize(1);
            assertThat(result.meta().total()).isEqualTo(1);
        }
    }

    @Nested
    class Get {

        @Test
        void returnsDocumentWhenOwned() {
            Document document = document();
            when(documentRepository.findByIdAndUserId(document.getId(), CURRENT_USER_ID))
                    .thenReturn(Optional.of(document));

            DocumentResponse response = documentService.get(document.getId());

            assertThat(response.title()).isEqualTo("Passport front");
            assertThat(response.docType()).isEqualTo("passport");
        }

        @Test
        void throwsNotFoundWhenMissingOrOwnedByAnotherUser() {
            UUID id = UUID.randomUUID();
            when(documentRepository.findByIdAndUserId(id, CURRENT_USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> documentService.get(id)).isInstanceOf(DocumentNotFoundException.class);
        }
    }

    @Nested
    class Upload {

        @Test
        void storesFileAndSavesMetadataForSupportedDocType() {
            when(userRepository.getReferenceById(CURRENT_USER_ID)).thenReturn(owner());
            when(storageService.store(any())).thenReturn(
                    new DocumentStorageService.StoredFile("/storage/documents/xyz", "image/png", 2048L));
            MockMultipartFile file = new MockMultipartFile("file", "passport.png", "image/png", "x".getBytes());

            DocumentResponse response = documentService.upload(file, "Passport front", "passport");

            assertThat(response.title()).isEqualTo("Passport front");
            assertThat(response.docType()).isEqualTo("passport");
            assertThat(response.mimeType()).isEqualTo("image/png");
            assertThat(response.fileSize()).isEqualTo(2048L);
        }

        @Test
        void allowsNullDocType() {
            when(userRepository.getReferenceById(CURRENT_USER_ID)).thenReturn(owner());
            when(storageService.store(any())).thenReturn(
                    new DocumentStorageService.StoredFile("/storage/documents/xyz", "image/png", 10L));
            MockMultipartFile file = new MockMultipartFile("file", "note.png", "image/png", "x".getBytes());

            DocumentResponse response = documentService.upload(file, "Random image", null);

            assertThat(response.docType()).isNull();
        }

        @Test
        void rejectsUnsupportedDocTypeWithoutTouchingStorage() {
            MockMultipartFile file = new MockMultipartFile("file", "passport.png", "image/png", "x".getBytes());

            AppException ex = catchThrowableOfType(AppException.class,
                    () -> documentService.upload(file, "Passport front", "not-a-real-type"));

            assertThat(ex.getCode()).isEqualTo("COMMON_001");
            @SuppressWarnings("unchecked")
            List<Map<String, String>> details = (List<Map<String, String>>) ex.getDetails();
            assertThat(details.get(0).get("field")).isEqualTo("docType");
            verify(storageService, never()).store(any());
        }
    }

    @Nested
    class Download {

        @Test
        void returnsResourceMimeTypeAndTitleWhenOwned() {
            Document document = document();
            Resource resource = Mockito.mock(Resource.class);
            when(documentRepository.findByIdAndUserId(document.getId(), CURRENT_USER_ID))
                    .thenReturn(Optional.of(document));
            when(storageService.load(document.getStoragePath())).thenReturn(resource);

            DocumentService.DownloadableDocument result = documentService.download(document.getId());

            assertThat(result.resource()).isSameAs(resource);
            assertThat(result.mimeType()).isEqualTo("image/png");
            assertThat(result.title()).isEqualTo("Passport front");
        }

        @Test
        void throwsNotFoundWhenMissing() {
            UUID id = UUID.randomUUID();
            when(documentRepository.findByIdAndUserId(id, CURRENT_USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> documentService.download(id)).isInstanceOf(DocumentNotFoundException.class);
        }
    }

    @Nested
    class Delete {

        @Test
        void deletesFileBeforeDeletingRow() {
            Document document = document();
            when(documentRepository.findByIdAndUserId(document.getId(), CURRENT_USER_ID))
                    .thenReturn(Optional.of(document));

            documentService.delete(document.getId());

            InOrder order = inOrder(storageService, documentRepository);
            order.verify(storageService).delete(document.getStoragePath());
            order.verify(documentRepository).delete(document);
        }

        @Test
        void throwsNotFoundWhenMissing() {
            UUID id = UUID.randomUUID();
            when(documentRepository.findByIdAndUserId(id, CURRENT_USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> documentService.delete(id)).isInstanceOf(DocumentNotFoundException.class);
            verify(storageService, never()).delete(any());
            verify(documentRepository, never()).delete(any());
        }
    }
}
