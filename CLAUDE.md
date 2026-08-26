# Project: personal-vault

## Overview
A secure personal vault for managing credentials, personal identity data, and private documents with authentication, access control, and safe storage flows.

## Tech Stack
  - Frontend: React + Vite + TypeScript
  - Mobile: Expo + React Native + TypeScript
  - Backend: Spring Boot + Java + Gradle
  - Database: MySQL

## Structure
```
├── frontend-react-personal-vault/    → @frontend-react-personal-vault/CLAUDE.md
├── backend-java-personal-vault/      → @backend-java-personal-vault/CLAUDE.md
├── mobile-expo-personal-vault/       → @mobile-expo-personal-vault/CLAUDE.md
├── 01-share-docs/                    → Shared documentation
├── .claude/                          → Local AI configuration
└── .git/                             → Git metadata
```

## Shared Docs
- @01-share-docs/API_SPEC.md
- @01-share-docs/DATABASE.md

## Available Skills

Skills are scoped per app — each lives in that app's own `.claude/skills/`, not in the root `.claude/`. Claude Code auto-picks the scoped version when working inside that app's folder.

### Project Setup
- `/init-base [backend|frontend|mobile]` - Setup project architecture & environment (root-level skill, applies to all three apps)
- `/explain [code|concept|flow|why] [target] [be|fe|mobile]` - Beginner-friendly explanation of code, concepts, data flow, or design decisions, sourced from the docs — not a raw source-code dump (root-level skill)

### Git
- `/commit` - Preview + confirm a Conventional Commits message (auto-detects type/scope from the staged diff). Author is always the user's own git identity — never adds AI co-authorship.
- `/resolve-conflict [file-path]` - Read conflicted files, propose a resolution plan per pattern (keep-both / ask-user / etc.), confirm, then stage — never commits automatically.

### Feature Development

| Skill | App | Generates |
|---|---|---|
| `/be-crud [feature]` | Backend | Spring Boot entity, controller, service, repository, DTOs, mapper, exception, Flyway migration |
| `/be-test [feature]` | Backend | JUnit 5 unit tests, MockMvc controller tests, Testcontainers integration tests |
| `/fe-crud [feature]` | Frontend | React pages, components, hooks, services, types |
| `/fe-test [feature]` | Frontend | Vitest + React Testing Library component/hook/page tests |
| `/mobile-crud [feature]` | Mobile | Expo Router routes, screens, components, hooks, services, types |
| `/mobile-test [feature]` | Mobile | Jest + React Native Testing Library component/hook/screen tests |
| `/seed-data [entity] [count]` | Backend | Fake/seed rows via a `@Profile("seed")` Spring runner + `net.datafaker` — `users`, `credentials`, `documents` only, never `refresh_tokens` |

### Skill Routing

When user asks to:
- "tạo feature", "add entity", "generate crud" → ask (or infer from context) which app, then use `/be-crud`, `/fe-crud`, or `/mobile-crud`
- "viết test", "add tests" → use `/be-test`, `/fe-test`, or `/mobile-test` matching the app of the feature just created/edited
- "init project", "setup structure" → use `/init-base`
- "fake data", "seed", "tạo dữ liệu mẫu" → use `/seed-data` (backend only — frontend/mobile consume seeded data through the real API, they don't seed the DB directly)

### Important
- Always read the skill's required docs BEFORE generating code.
- Follow existing patterns in the codebase — read at least one existing feature in the same app first.
- Do NOT create feature code when running `/init-base`.
- Any endpoint, DB field, or error code introduced while running a `*-crud` skill must also update `01-share-docs/API_SPEC.md` / `DATABASE.md` — these are the source of truth shared by all three apps.
