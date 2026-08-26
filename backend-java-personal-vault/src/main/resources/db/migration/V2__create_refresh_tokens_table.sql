CREATE TABLE refresh_tokens (
    id            CHAR(36)      NOT NULL,
    user_id       CHAR(36)      NOT NULL,
    token_hash    VARCHAR(255)  NOT NULL,
    client_type   ENUM('web', 'mobile') NOT NULL,
    device_info   VARCHAR(255)  NULL,
    expires_at    TIMESTAMP     NOT NULL,
    revoked_at    TIMESTAMP     NULL,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_refresh_tokens_token_hash (token_hash),
    CONSTRAINT fk_refresh_tokens_user_id_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
