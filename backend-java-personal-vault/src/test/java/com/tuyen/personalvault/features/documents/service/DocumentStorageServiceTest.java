package com.tuyen.personalvault.features.documents.service;

import com.tuyen.personalvault.features.documents.exception.FileTooLargeException;
import com.tuyen.personalvault.features.documents.exception.UnsupportedFileTypeException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DocumentStorageServiceTest {

    @TempDir
    private Path tempDir;

    private DocumentStorageService storageService;

    @BeforeEach
    void setUp() {
        storageService = new DocumentStorageService(tempDir.toString(), 1);
    }

    private long fileCount() throws IOException {
        try (var stream = Files.list(tempDir)) {
            return stream.count();
        }
    }

    @Nested
    class Store {

        private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

        private byte[] validPngBytes(String... extra) {
            byte[] tail = "fake-image-bytes".getBytes();
            byte[] content = new byte[PNG_SIGNATURE.length + tail.length];
            System.arraycopy(PNG_SIGNATURE, 0, content, 0, PNG_SIGNATURE.length);
            System.arraycopy(tail, 0, content, PNG_SIGNATURE.length, tail.length);
            return content;
        }

        @Test
        void writesFileAndReturnsMetadataForAllowedType() throws IOException {
            byte[] content = validPngBytes();
            MockMultipartFile file = new MockMultipartFile("file", "passport.png", "image/png", content);

            DocumentStorageService.StoredFile stored = storageService.store(file);

            assertThat(stored.mimeType()).isEqualTo("image/png");
            assertThat(stored.fileSize()).isEqualTo(content.length);
            assertThat(Path.of(stored.storagePath())).exists();
            assertThat(Files.readAllBytes(Path.of(stored.storagePath()))).isEqualTo(content);
        }

        @Test
        void usesRandomFileNameNotOriginalFileName() {
            MockMultipartFile file = new MockMultipartFile("file", "my-passport.png", "image/png", validPngBytes());

            DocumentStorageService.StoredFile stored = storageService.store(file);

            assertThat(Path.of(stored.storagePath()).getFileName().toString()).doesNotContain("my-passport");
        }

        @Test
        void rejectsUnsupportedMimeTypeWithoutWritingAFile() throws IOException {
            MockMultipartFile file = new MockMultipartFile("file", "archive.zip", "application/zip", "x".getBytes());

            assertThatThrownBy(() -> storageService.store(file))
                    .isInstanceOf(UnsupportedFileTypeException.class);
            assertThat(fileCount()).isZero();
        }

        @Test
        void rejectsContentWhoseMagicBytesDontMatchDeclaredMimeType() throws IOException {
            byte[] notActuallyPng = "this-is-plain-text-not-a-png".getBytes();
            MockMultipartFile file = new MockMultipartFile("file", "fake.png", "image/png", notActuallyPng);

            assertThatThrownBy(() -> storageService.store(file))
                    .isInstanceOf(UnsupportedFileTypeException.class);
            assertThat(fileCount()).isZero();
        }

        @Test
        void acceptsContentWhoseMagicBytesMatchDeclaredPngMimeType() {
            byte[] pngSignature = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};
            MockMultipartFile file = new MockMultipartFile("file", "real.png", "image/png", pngSignature);

            DocumentStorageService.StoredFile stored = storageService.store(file);

            assertThat(stored.mimeType()).isEqualTo("image/png");
        }

        @Test
        void rejectsOversizedFileWithoutWritingAFile() throws IOException {
            byte[] tooLarge = new byte[2 * 1024 * 1024];
            MockMultipartFile file = new MockMultipartFile("file", "big.png", "image/png", tooLarge);

            assertThatThrownBy(() -> storageService.store(file))
                    .isInstanceOf(FileTooLargeException.class);
            assertThat(fileCount()).isZero();
        }
    }

    @Nested
    class Delete {

        @Test
        void removesExistingFile() throws IOException {
            Path file = tempDir.resolve(UUID.randomUUID().toString());
            Files.writeString(file, "content");

            storageService.delete(file.toString());

            assertThat(file).doesNotExist();
        }

        @Test
        void doesNotThrowWhenFileMissing() {
            Path missing = tempDir.resolve(UUID.randomUUID().toString());

            storageService.delete(missing.toString());
        }
    }
}
