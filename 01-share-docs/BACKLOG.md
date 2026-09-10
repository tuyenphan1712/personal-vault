# Backlog — Personal Vault

> Post-MVP tasks, deferred decisions, and known tech debt — things that were
> deliberately **not** done now and need follow-through later.
> Audience: Developers & AI coding assistants working on this codebase.

---

## 1. How to use this file

- Add an entry whenever a fix/improvement is deliberately deferred instead of
  done immediately, or a gap is flagged during review/audit but is out of
  scope for the change that found it.
- Each entry states: what's deferred, why, and what "done" looks like.
- Remove an entry once it ships — put the detail in the commit/PR instead of
  leaving it here.
- This is **not** a feature roadmap. Planned features under active design
  belong in the owning app's `docs/specs/` and `docs/plans/`, or
  `01-share-docs/specs/` / `01-share-docs/plans/` for cross-app work
  (see root `CLAUDE.md` §"Brainstorming / Planning Doc Location").

---

## 2. Storage & Backup

### 2.1 Back up uploaded documents + MySQL database
- **Status**: Decided, not implemented.
- **Decision**: back up to Google Drive (free tier, no added cost).
- **What "done" looks like**:
  1. A cron-triggered script that runs `mysqldump` against the app database
     and archives `backend-java-personal-vault/storage/documents/`.
  2. The archive is **encrypted** (e.g. `age` or `gpg`) before it ever leaves
     the machine — these are personal identity documents, never upload them
     unencrypted to a third-party drive.
  3. Upload the encrypted archive to Google Drive (e.g. via `rclone` with a
     Drive remote).
  4. A retention policy (e.g. keep last 7 daily + 4 weekly) so Drive quota
     doesn't fill up silently.
- **Why deferred**: flagged during a storage audit (2026-09-05) — no backup
  of any kind exists today. Where the script runs depends on §2.2.

### 2.2 Production hosting
- **Status**: Decided, not implemented.
- **Decision**: Oracle Cloud "Always Free" tier (ARM VM, free indefinitely,
  not a trial) — chosen because the project has no hosting budget.
- **What "done" looks like**:
  - Backend + MySQL running on the Oracle free-tier VM (docker-compose vs.
    systemd services — TBD at implementation time; today the repo has
    neither).
  - `STORAGE_PATH` set to an absolute path on that VM (§2.3 — do not keep the
    relative default once deployed).
  - Remote access for the mobile app without exposing the VM directly to the
    public internet where avoidable (e.g. Cloudflare Tunnel or Tailscale —
    also free).
  - The §2.1 backup job scheduled via cron on this VM.
- **Why deferred**: repo audit (2026-09-05) confirmed there is currently no
  production deployment at all (no Dockerfile/docker-compose/CI-CD) — this is
  new infrastructure, not a migration.

### 2.3 Use an absolute `STORAGE_PATH` in production
- **Status**: Not implemented — currently defaults to the relative
  `./storage/documents` (`backend-java-personal-vault/src/main/resources/application.properties`,
  `app.storage.path` property).
- **Why it matters**: a relative path resolves against the process's working
  directory. Fine for local `./gradlew bootRun`, but fragile once the app
  runs under systemd/docker on the Oracle VM (§2.2), where the working
  directory may not match local-dev assumptions — a wrong cwd finds/creates
  the storage directory in the wrong place.
- **What "done" looks like**: production env sets `STORAGE_PATH` to a fixed
  absolute path (e.g. `/var/lib/personal-vault/storage/documents`),
  documented alongside the §2.2 deployment setup.

---

## 3. Security hardening

### 3.1 Encrypt documents at rest on the server
- **Status**: Not implemented.
- **Current behavior**: `credentials.encrypted_password` is encrypted
  client-side before it reaches the backend (`API_SPEC.md` §7), but uploaded
  documents are written to disk as-is — anyone with filesystem access to the
  storage directory (or a stolen disk/backup copy) can read the raw file
  contents.
- **What "done" looks like**: a server-side encryption-at-rest scheme for
  `DocumentStorageService` (encrypt bytes with a server-held key before
  writing, decrypt on load/download). Needs its own design pass first (key
  management, per-file vs. whole-volume encryption) — don't build this ad hoc.
- **Why deferred**: flagged during a storage audit (2026-09-05) as a
  defense-in-depth gap, not an MVP blocker. Current priority is §2 (backup +
  hosting), given the project's budget constraints.

---

## 4. Log

| Date | Entries added | Source |
|---|---|---|
| 2026-09-06 | §2.1, §2.2, §2.3, §3.1 | Storage/deployment audit + backup & hosting decisions |
