# Faker Examples (net.datafaker, this schema)

All fields match `DATABASE.md` exactly — column names below are the Java entity field names (camelCase), not the raw `snake_case` DB columns.

## User

```java
Faker faker = new Faker();

user.setPhone("09" + faker.number().digits(8));
user.setFullName(faker.name().fullName());
user.setPasswordHash(passwordEncoder.encode("User@123")); // never a raw/fake hash string
user.setBirthday(LocalDate.now().minusYears(faker.number().numberBetween(18, 60)));
user.setRole("member");   // or "admin" for fixed accounts only
user.setStatus("active"); // never seed status="locked" unless specifically testing that case
```

> There is no `email` column on `users` — `phone` is the login identifier. Don't invent an email field.

## Credential

```java
credential.setPlatformName(faker.internet().domainWord()); // e.g. "gmail", "facebook"
credential.setAccount(faker.internet().emailAddress());
credential.setEncryptedPassword(
    Base64.getEncoder().encodeToString(faker.random().hex(32).getBytes())
); // fake ciphertext only — backend never decrypts it, but it won't decrypt via the real FE/mobile AES-GCM flow either
credential.setNote(faker.bool().bool() ? faker.lorem().sentence() : null);
```

## Document

```java
document.setTitle(faker.commerce().productName() + " scan");
document.setDocType(faker.options().option("cccd", "diploma", "passport"));
document.setMimeType("image/png"); // or "image/jpeg" / "application/pdf" — must be one of the 3 allowed types
document.setFileSize(faker.number().numberBetween(50_000, 2_000_000)); // bytes, must stay under the 10MB MVP limit
document.setStoragePath(storagePath + "/" + UUID.randomUUID());
```

> `documents.storage_path` must point at a real file under `STORAGE_PATH` for `GET /documents/{id}/download` to work in dev — write a small placeholder file at that path (see `DocumentSeeder` in `../templates/seeder.md`), don't just fake the DB row.

## Fixed Dev Accounts

Phone-based login, not email:

```java
// Admin
{ phone: "0900000000", password: "Admin@123", role: "admin" }

// Test member
{ phone: "0900000001", password: "User@123", role: "member" }
```

Both must go through `passwordEncoder.encode(...)` before saving — never insert the plaintext password or a hand-rolled "fake hash" string into `password_hash`.

## Never Fake

- `refresh_tokens` — no fake rows; real sessions only come from `/auth/login`.
- `password_hash` as plaintext or a non-BCrypt string.
- A `status = "locked"` user unless the seeding request is specifically to test the locked-account flow.
