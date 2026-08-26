package com.tuyen.personalvault.features.documents.service;

import com.tuyen.personalvault.features.documents.exception.FileTooLargeException;
import com.tuyen.personalvault.features.documents.exception.UnsupportedFileTypeException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.UUID;

@Service
public class DocumentStorageService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "application/pdf"
    );

    private final Path storageRoot;
    private final long maxFileSizeBytes;

    public DocumentStorageService(@Value("${app.storage.path}") String storagePath,
                                   @Value("${app.storage.max-file-size-mb}") long maxFileSizeMb) {
        this.storageRoot = Path.of(storagePath).toAbsolutePath().normalize();
        this.maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
        try {
            Files.createDirectories(storageRoot);
        } catch (IOException e) {
            throw new UncheckedIOException("Unable to initialize document storage directory", e);
        }
    }

    public StoredFile store(MultipartFile file) {
        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType)) {
            throw new UnsupportedFileTypeException();
        }
        if (file.getSize() > maxFileSizeBytes) {
            throw new FileTooLargeException();
        }

        String fileName = UUID.randomUUID().toString();
        Path target = storageRoot.resolve(fileName).normalize();
        try {
            file.transferTo(target);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store document file", e);
        }

        return new StoredFile(target.toString(), mimeType, file.getSize());
    }

    public Resource load(String storagePath) {
        return new FileSystemResource(Path.of(storagePath));
    }

    public void delete(String storagePath) {
        try {
            Files.deleteIfExists(Path.of(storagePath));
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to delete document file", e);
        }
    }

    public record StoredFile(String storagePath, String mimeType, long fileSize) {
    }
}
