package com.tuyen.personalvault.features.documents.service;

import com.tuyen.personalvault.features.documents.dto.DocumentResponse;
import com.tuyen.personalvault.features.documents.entity.Document;
import com.tuyen.personalvault.features.documents.exception.DocumentNotFoundException;
import com.tuyen.personalvault.features.documents.mapper.DocumentMapper;
import com.tuyen.personalvault.features.documents.repository.DocumentRepository;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import com.tuyen.personalvault.shared.exception.AppException;
import com.tuyen.personalvault.shared.response.PageMeta;
import com.tuyen.personalvault.shared.security.CurrentUser;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class DocumentService {

    private static final int MAX_DOC_TYPE_LENGTH = 100;
    private static final Set<String> SORTABLE_FIELDS = Set.of("createdAt", "updatedAt", "title", "docType");

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final DocumentMapper documentMapper;
    private final DocumentStorageService storageService;

    public DocumentService(DocumentRepository documentRepository,
                            UserRepository userRepository,
                            DocumentMapper documentMapper,
                            DocumentStorageService storageService) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.documentMapper = documentMapper;
        this.storageService = storageService;
    }

    public DocumentListResult list(int page, int limit, String search, String docType, String sortBy, String sortDirection) {
        String sortField = SORTABLE_FIELDS.contains(sortBy) ? sortBy : "createdAt";
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), Math.min(limit, 100), Sort.by(direction, sortField));

        Page<Document> resultPage = documentRepository.search(CurrentUser.id(), search, docType, pageable);
        return new DocumentListResult(
                resultPage.map(documentMapper::toResponse).getContent(),
                new PageMeta(pageable.getPageNumber() + 1, pageable.getPageSize(),
                        resultPage.getTotalElements(), resultPage.getTotalPages())
        );
    }

    public DocumentResponse get(UUID id) {
        return documentMapper.toResponse(findOwned(id));
    }

    @Transactional
    public DocumentResponse upload(MultipartFile file, String title, String docType) {
        validateTitle(title);
        validateDocType(docType);

        DocumentStorageService.StoredFile stored = storageService.store(file);
        User user = userRepository.getReferenceById(CurrentUser.id());
        Document document = new Document(
                UUID.randomUUID(),
                user,
                title,
                docType,
                stored.storagePath(),
                stored.mimeType(),
                stored.fileSize()
        );
        try {
            documentRepository.save(document);
        } catch (RuntimeException e) {
            storageService.delete(stored.storagePath());
            throw e;
        }
        return documentMapper.toResponse(document);
    }

    public DownloadableDocument download(UUID id) {
        Document document = findOwned(id);
        Resource resource = storageService.load(document.getStoragePath());
        return new DownloadableDocument(resource, document.getMimeType(), document.getTitle());
    }

    @Transactional
    public void delete(UUID id) {
        Document document = findOwned(id);
        storageService.delete(document.getStoragePath());
        documentRepository.delete(document);
    }

    private void validateTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new AppException("COMMON_001", "Validation failed", HttpStatus.BAD_REQUEST,
                    List.of(Map.of("field", "title", "message", "title must not be blank")));
        }
    }

    private void validateDocType(String docType) {
        if (docType == null) {
            return;
        }
        if (docType.isBlank() || docType.length() > MAX_DOC_TYPE_LENGTH) {
            throw new AppException("COMMON_001", "Validation failed", HttpStatus.BAD_REQUEST,
                    List.of(Map.of("field", "docType",
                            "message", "docType must not be blank and at most " + MAX_DOC_TYPE_LENGTH + " characters")));
        }
    }

    private Document findOwned(UUID id) {
        return documentRepository.findByIdAndUserId(id, CurrentUser.id())
                .orElseThrow(DocumentNotFoundException::new);
    }

    public record DocumentListResult(List<DocumentResponse> items, PageMeta meta) {
    }

    public record DownloadableDocument(Resource resource, String mimeType, String title) {
    }
}
