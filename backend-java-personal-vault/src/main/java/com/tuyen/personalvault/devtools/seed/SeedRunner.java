package com.tuyen.personalvault.devtools.seed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component
@Profile("seed")
public class SeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedRunner.class);
    private static final Set<String> KNOWN_ENTITIES = Set.of("users", "credentials", "documents");

    private final Environment environment;
    private final UserSeeder userSeeder;
    private final CredentialSeeder credentialSeeder;
    private final DocumentSeeder documentSeeder;

    public SeedRunner(Environment environment, UserSeeder userSeeder,
                       CredentialSeeder credentialSeeder, DocumentSeeder documentSeeder) {
        this.environment = environment;
        this.userSeeder = userSeeder;
        this.credentialSeeder = credentialSeeder;
        this.documentSeeder = documentSeeder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (List.of(environment.getActiveProfiles()).contains("prod")) {
            log.error("Refusing to seed: 'prod' profile is active alongside 'seed'.");
            return;
        }

        String entity = firstOrDefault(args, "seed.entity", "users");
        int count = Integer.parseInt(firstOrDefault(args, "seed.count", "10"));

        if (!KNOWN_ENTITIES.contains(entity)) {
            log.error("Unknown --seed.entity '{}'. Expected one of {}.", entity, KNOWN_ENTITIES);
            return;
        }

        log.info("Seeding '{}' with target count {}", entity, count);

        var users = userSeeder.seed(count);
        if (entity.equals("credentials")) {
            credentialSeeder.seed(count, users);
        } else if (entity.equals("documents")) {
            documentSeeder.seed(count, users);
        }

        log.info("Seeding complete.");
    }

    private String firstOrDefault(ApplicationArguments args, String name, String fallback) {
        List<String> values = args.getOptionValues(name);
        return values == null || values.isEmpty() ? fallback : values.get(0);
    }
}
