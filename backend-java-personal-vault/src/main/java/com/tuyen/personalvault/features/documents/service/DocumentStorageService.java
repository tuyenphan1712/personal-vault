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
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class DocumentStorageService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "application/pdf"
    );

    private static final Map<String, byte[]> MAGIC_BYTES = Map.of(
            "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
            "image/png", new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A},
            "application/pdf", new byte[]{0x25, 0x50, 0x44, 0x46}
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
        if (!matchesMagicBytes(file, mimeType)) {
            throw new UnsupportedFileTypeException();
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

    private boolean matchesMagicBytes(MultipartFile file, String mimeType) {
        byte[] signature = MAGIC_BYTES.get(mimeType);
        try {
            byte[] header = file.getInputStream().readNBytes(signature.length);
            return java.util.Arrays.equals(header, signature);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to inspect document file content", e);
        }
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
