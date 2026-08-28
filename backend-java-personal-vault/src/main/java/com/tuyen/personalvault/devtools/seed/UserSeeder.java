package com.tuyen.personalvault.devtools.seed;

import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.entity.UserRole;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import net.datafaker.Faker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@Profile("seed")
public class UserSeeder {

    private static final Logger log = LoggerFactory.getLogger(UserSeeder.class);
    private static final String ADMIN_PHONE = "0900000000";
    private static final String MEMBER_PHONE = "0900000001";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Faker faker = new Faker();

    public UserSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** Ensures the fixed dev accounts exist, then tops up random users until at least
     *  {@code count} exist. Returns every seeded/existing user for downstream seeders. */
    public List<User> seed(int count) {
        List<User> users = new ArrayList<>();
        users.add(ensureUser(ADMIN_PHONE, "Admin User", "Admin@123", UserRole.admin));
        users.add(ensureUser(MEMBER_PHONE, "Member User", "User@123", UserRole.member));

        long existing = userRepository.count();
        long toCreate = Math.max(0, count - existing);
        for (int i = 0; i < toCreate; i++) {
            users.add(createRandomUser());
        }

        log.info("Users: {} fixed accounts ensured, {} random accounts created (total in DB: {})",
                2, toCreate, userRepository.count());

        users.addAll(userRepository.findAll());
        return users.stream().distinct().toList();
    }

    private User ensureUser(String phone, String fullName, String rawPassword, UserRole role) {
        return userRepository.findByPhone(phone).orElseGet(() -> {
            User user = new User(UUID.randomUUID(), phone, fullName, passwordEncoder.encode(rawPassword));
            user.setRole(role);
            return userRepository.save(user);
        });
    }

    private User createRandomUser() {
        String phone = "09" + faker.number().digits(8);
        if (userRepository.existsByPhone(phone)) {
            return createRandomUser();
        }
        User user = new User(UUID.randomUUID(), phone, faker.name().fullName(),
                passwordEncoder.encode("Faker@123"));
        return userRepository.save(user);
    }
}
