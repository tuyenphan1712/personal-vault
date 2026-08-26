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
import org.springframework.data.domain.Pageable;
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

    private static final Set<String> SUPPORTED_DOC_TYPES = Set.of("cccd", "diploma", "passport");

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

    public DocumentListResult list(Pageable pageable) {
        Page<Document> page = documentRepository.findAllByUserId(CurrentUser.id(), pageable);
        return new DocumentListResult(
                page.map(documentMapper::toResponse).getContent(),
                new PageMeta(pageable.getPageNumber() + 1, pageable.getPageSize(),
                        page.getTotalElements(), page.getTotalPages())
        );
    }

    public DocumentResponse get(UUID id) {
        return documentMapper.toResponse(findOwned(id));
    }

    @Transactional
    public DocumentResponse upload(MultipartFile file, String title, String docType) {
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
        documentRepository.save(document);
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

    private void validateDocType(String docType) {
        if (docType != null && !SUPPORTED_DOC_TYPES.contains(docType)) {
            throw new AppException("COMMON_001", "Validation failed", HttpStatus.BAD_REQUEST,
                    List.of(Map.of("field", "docType",
                            "message", "docType must be one of: cccd, diploma, passport")));
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
