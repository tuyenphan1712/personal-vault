# Dependency Map

| Entity | Needs | Auto-seed first |
|---|---|---|
| `users` | — | — |
| `credentials` | `users` | `users` |
| `documents` | `users` | `users` |
| `refresh_tokens` | — | **never seed** — a fake row here doesn't correspond to a real signed JWT; sessions must come from an actual `POST /auth/login` call. If asked, explain this and decline. |

This project has only 4 tables total (`DATABASE.md`) — far fewer than a typical e-commerce schema, so there's no deep dependency chain to resolve. `users` is the only real prerequisite; seed it first (or let `SeedRunner` auto-seed a handful before anything else, as the template does).
