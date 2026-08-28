package com.tuyen.personalvault.devtools.seed;

import com.tuyen.personalvault.features.documents.entity.Document;
import com.tuyen.personalvault.features.documents.repository.DocumentRepository;
import com.tuyen.personalvault.features.users.entity.User;
import net.datafaker.Faker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@Component
@Profile("seed")
public class DocumentSeeder {

    private static final Logger log = LoggerFactory.getLogger(DocumentSeeder.class);
    private static final String[] DOC_TYPES = {"cccd", "diploma", "passport"};
    private static final byte[] PLACEHOLDER_PNG = {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3, 4,
    };

    private final DocumentRepository documentRepository;
    private final Faker faker = new Faker();
    private final Path storageRoot;

    public DocumentSeeder(DocumentRepository documentRepository,
                           @Value("${app.storage.path}") String storagePath) {
        this.documentRepository = documentRepository;
        this.storageRoot = Path.of(storagePath).toAbsolutePath().normalize();
    }

    public void seed(int count, List<User> users) {
        long existing = documentRepository.count();
        long toCreate = Math.max(0, count - existing);

        try {
            Files.createDirectories(storageRoot);
        } catch (IOException e) {
            throw new UncheckedIOException("Unable to prepare seed storage directory", e);
        }

        for (int i = 0; i < toCreate; i++) {
            User owner = users.get(faker.random().nextInt(users.size()));
            String docType = DOC_TYPES[faker.random().nextInt(DOC_TYPES.length)];
            String fileName = UUID.randomUUID().toString();
            Path filePath = storageRoot.resolve(fileName);
            writePlaceholderFile(filePath);

            Document document = new Document(
                    UUID.randomUUID(),
                    owner,
                    faker.lorem().words(3).stream().reduce((a, b) -> a + " " + b).orElse("Document"),
                    docType,
                    filePath.toString(),
                    "image/png",
                    PLACEHOLDER_PNG.length
            );
            documentRepository.save(document);
        }

        log.info("Documents: {} created with placeholder PNG files at {} (total in DB: {})",
                toCreate, storageRoot, documentRepository.count());
    }

    private void writePlaceholderFile(Path filePath) {
        try {
            Files.write(filePath, PLACEHOLDER_PNG);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to write seed document file", e);
        }
    }
}
