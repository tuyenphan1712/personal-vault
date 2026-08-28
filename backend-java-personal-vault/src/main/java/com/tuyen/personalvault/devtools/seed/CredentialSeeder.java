package com.tuyen.personalvault.devtools.seed;

import com.tuyen.personalvault.features.credentials.entity.Credential;
import com.tuyen.personalvault.features.credentials.repository.CredentialRepository;
import com.tuyen.personalvault.features.users.entity.User;
import net.datafaker.Faker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Component
@Profile("seed")
public class CredentialSeeder {

    private static final Logger log = LoggerFactory.getLogger(CredentialSeeder.class);
    private static final String[] PLATFORMS = {"Gmail", "Facebook", "GitHub", "Netflix", "Dropbox", "Slack"};

    private final CredentialRepository credentialRepository;
    private final Faker faker = new Faker();

    public CredentialSeeder(CredentialRepository credentialRepository) {
        this.credentialRepository = credentialRepository;
    }

    public void seed(int count, List<User> users) {
        long existing = credentialRepository.count();
        long toCreate = Math.max(0, count - existing);

        for (int i = 0; i < toCreate; i++) {
            User owner = users.get(faker.random().nextInt(users.size()));
            Credential credential = new Credential(
                    UUID.randomUUID(),
                    owner,
                    PLATFORMS[faker.random().nextInt(PLATFORMS.length)],
                    faker.internet().emailAddress(),
                    fakeCiphertext(),
                    1,
                    faker.random().nextBoolean() ? faker.lorem().sentence() : null
            );
            credentialRepository.save(credential);
        }

        log.info("Credentials: {} created (total in DB: {})", toCreate, credentialRepository.count());
        log.warn("Seeded credentials use FAKE ciphertext (random bytes, not real AES-GCM output). "
                + "\"Show password\" in the real Frontend will show \"Could not decrypt\" for these rows "
                + "— only create real, decryptable credentials through the actual login + create-credential UI flow.");
    }

    private String fakeCiphertext() {
        String iv = Base64.getEncoder().encodeToString(faker.random().hex(12).getBytes());
        String ciphertext = Base64.getEncoder().encodeToString(faker.random().hex(32).getBytes());
        return iv + ":" + ciphertext;
    }
}
