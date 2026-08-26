CREATE TABLE credentials (
    id                   CHAR(36)      NOT NULL,
    user_id              CHAR(36)      NOT NULL,
    platform_name        VARCHAR(255)  NOT NULL,
    account              VARCHAR(255)  NOT NULL,
    encrypted_password   TEXT          NOT NULL,
    ciphertext_version   INT           NOT NULL DEFAULT 1,
    note                 TEXT          NULL,
    created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_credentials_user_id_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_credentials_user_id ON credentials (user_id);
CREATE INDEX idx_credentials_platform_name ON credentials (platform_name);
