# Plan Template

```
📋 SEED PLAN: {entity} ({count} records)

Prerequisites:
  • build.gradle "net.datafaker:datafaker": {EXISTS ✓ | WILL ADD ⚠️}
  • src/main/java/.../devtools/seed/SeedRunner.java: {EXISTS ✓ | WILL CREATE ⚠️}

Dependencies to seed first:
  {numbered list: EXISTS ✓ | CREATE NEW | SKIP (already seeded)}

Target:
  {n}. {entity} ({count}) - {status}

Files to create:
  • {list, e.g. devtools/seed/CredentialSeeder.java}

Files to modify:
  • {list if any, e.g. build.gradle, devtools/seed/SeedRunner.java}

Command:
  $ ./gradlew bootRun --args='--spring.profiles.active=seed --seed.entity={entity} --seed.count={count}'

⚠️  This will INSERT real rows into whatever database application.properties/.env currently points at.
⚠️  Target database: {read from DB_URL in .env — show it, so the user confirms it's local/dev, not prod}

Proceed? (yes/no)
```

## Confirm responses

| Response | Action |
|----------|--------|
| yes, y, ok, proceed, tiếp tục | Execute |
| no, n, cancel, hủy | Abort |
