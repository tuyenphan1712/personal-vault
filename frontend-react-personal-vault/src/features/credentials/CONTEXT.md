# Feature: credentials

## Responsibility
CRUD for saved platform credentials. The password is encrypted client-side (AES-GCM) before it is sent to the backend; the backend only ever stores/returns ciphertext.

## Data flow
`CredentialForm → encrypt locally → useCreateCredential() → POST /api/v1/credentials`

## Decisions
_To be filled in when this feature is implemented._
