# Seeder Template (Spring Boot)

## File Structure

```
src/main/java/com/tuyen/personalvault/devtools/seed/
├── SeedRunner.java
├── UserSeeder.java
├── CredentialSeeder.java
└── DocumentSeeder.java
```

## build.gradle

Add once, if missing:

```groovy
dependencies {
    implementation 'net.datafaker:datafaker:2.4.2'
    // ... existing dependencies unchanged
}
```

## `SeedRunner.java`

```java
package com.tuyen.personalvault.devtools.seed;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
@Profile("seed")
public class SeedRunner implements CommandLineRunner {

    private final Environment env;
    private final UserSeeder userSeeder;
    private final CredentialSeeder credentialSeeder;
    private final DocumentSeeder documentSeeder;

    public SeedRunner(Environment env, UserSeeder userSeeder,
                       CredentialSeeder credentialSeeder, DocumentSeeder documentSeeder) {
        this.env = env;
        this.userSeeder = userSeeder;
        this.credentialSeeder = credentialSeeder;
        this.documentSeeder = documentSeeder;
    }

    @Override
    public void run(String... args) {
        if (java.util.Arrays.asList(env.getActiveProfiles()).contains("prod")) {
            System.err.println("Refusing to seed: 'prod' profile is active.");
            System.exit(1);
        }

        String entity = env.getProperty("seed.entity", "all");
        int count = Integer.parseInt(env.getProperty("seed.count", "10"));

        // Always seed dependencies first, regardless of target — cheap and idempotent.
        userSeeder.seed(5);

        switch (entity) {
            case "users" -> userSeeder.seed(count);
            case "credentials" -> credentialSeeder.seed(count);
            case "documents" -> documentSeeder.seed(count);
            case "all" -> {
                credentialSeeder.seed(count);
                documentSeeder.seed(count);
            }
            default -> System.err.println("Unknown seed.entity: " + entity);
        }
    }
}
```

## `UserSeeder.java`

```java
package com.tuyen.personalvault.devtools.seed;

import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import net.datafaker.Faker;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@Profile("seed")
public class UserSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Faker faker = new Faker();

    public UserSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void seed(int count) {
        seedFixedAccounts();

        long existing = userRepository.count();
        if (existing >= count) {
            System.out.println("⏭ users already seeded (" + existing + ")");
            return;
        }

        for (int i = 0; i < count - existing; i++) {
            User user = new User();
            user.setPhone("09" + faker.number().digits(8));
            user.setFullName(faker.name().fullName());
            user.setPasswordHash(passwordEncoder.encode("User@123"));
            user.setBirthday(LocalDate.now().minusYears(faker.number().numberBetween(18, 60)));
            user.setRole("member");
            user.setStatus("active");
            userRepository.save(user);
        }
        System.out.println("✓ Seeded " + count + " users");
    }

    private void seedFixedAccounts() {
        userRepository.findByPhone("0900000000").orElseGet(() -> {
            User admin = new User();
            admin.setPhone("0900000000");
            admin.setFullName("Admin Account");
            admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
            admin.setRole("admin");
            admin.setStatus("active");
            return userRepository.save(admin);
        });

        userRepository.findByPhone("0900000001").orElseGet(() -> {
            User member = new User();
            member.setPhone("0900000001");
            member.setFullName("Test Member");
            member.setPasswordHash(passwordEncoder.encode("User@123"));
            member.setRole("member");
            member.setStatus("active");
            return userRepository.save(member);
        });
    }
}
```

## `CredentialSeeder.java`

```java
package com.tuyen.personalvault.devtools.seed;

import com.tuyen.personalvault.features.credentials.entity.Credential;
import com.tuyen.personalvault.features.credentials.repository.CredentialRepository;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import net.datafaker.Faker;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.List;

@Component
@Profile("seed")
public class CredentialSeeder {

    private final CredentialRepository credentialRepository;
    private final UserRepository userRepository;
    private final Faker faker = new Faker();

    public CredentialSeeder(CredentialRepository credentialRepository, UserRepository userRepository) {
        this.credentialRepository = credentialRepository;
        this.userRepository = userRepository;
    }

    public void seed(int count) {
        long existing = credentialRepository.count();
        if (existing >= count) {
            System.out.println("⏭ credentials already seeded (" + existing + ")");
            return;
        }

        List<User> users = userRepository.findAll();
        if (users.isEmpty()) {
            System.err.println("No users to attach credentials to — seed users first.");
            return;
        }

        for (int i = 0; i < count - existing; i++) {
            Credential c = new Credential();
            c.setUser(faker.options().nextElement(users));
            c.setPlatformName(faker.internet().domainWord());
            c.setAccount(faker.internet().emailAddress());
            // Fake ciphertext only — the backend never decrypts this, but it also won't decrypt
            // correctly through the real FE/mobile AES-GCM flow. Fine for list/ownership testing.
            c.setEncryptedPassword(Base64.getEncoder().encodeToString(faker.random().hex(32).getBytes()));
            c.setNote(faker.bool().bool() ? faker.lorem().sentence() : null);
            credentialRepository.save(c);
        }
        System.out.println("✓ Seeded " + count + " credentials");
    }
}
```

## `DocumentSeeder.java`

```java
package com.tuyen.personalvault.devtools.seed;

import com.tuyen.personalvault.features.documents.entity.Document;
import com.tuyen.personalvault.features.documents.repository.DocumentRepository;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import net.datafaker.Faker;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@Component
@Profile("seed")
public class DocumentSeeder {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final Faker faker = new Faker();

    @Value("${STORAGE_PATH:./storage/documents}")
    private String storagePath;

    private static final String[] DOC_TYPES = {"cccd", "diploma", "passport"};

    public DocumentSeeder(DocumentRepository documentRepository, UserRepository userRepository) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
    }

    public void seed(int count) {
        long existing = documentRepository.count();
        if (existing >= count) {
            System.out.println("⏭ documents already seeded (" + existing + ")");
            return;
        }

        List<User> users = userRepository.findAll();
        if (users.isEmpty()) {
            System.err.println("No users to attach documents to — seed users first.");
            return;
        }

        for (int i = 0; i < count - existing; i++) {
            String fileName = UUID.randomUUID().toString();
            Document doc = new Document();
            doc.setUser(faker.options().nextElement(users));
            doc.setTitle(faker.file().fileName(null, null, "", "").isBlank()
                    ? "Sample document" : faker.commerce().productName() + " scan");
            doc.setDocType(faker.options().option(DOC_TYPES));
            doc.setMimeType("image/png");
            doc.setFileSize(faker.number().numberBetween(50_000, 2_000_000));
            doc.setStoragePath(storagePath + "/" + fileName);
            documentRepository.save(doc);

            writePlaceholderFile(fileName);
        }
        System.out.println("✓ Seeded " + count + " documents");
    }

    private void writePlaceholderFile(String fileName) {
        try {
            Path dir = Path.of(storagePath);
            Files.createDirectories(dir);
            Files.write(dir.resolve(fileName), "seed placeholder".getBytes());
        } catch (IOException e) {
            System.err.println("Could not write placeholder file for " + fileName + ": " + e.getMessage());
        }
    }
}
```

## Running it

```bash
./gradlew bootRun --args='--spring.profiles.active=seed --seed.entity=credentials --seed.count=20'
```

`SeedRunner` always seeds a handful of users first (cheap, idempotent), then seeds the requested entity. Omit `--seed.entity` to seed everything (`credentials` + `documents`).
