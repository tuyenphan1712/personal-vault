CREATE TABLE audit_logs (
    id                   CHAR(36)      NOT NULL,
    user_id              CHAR(36)      NOT NULL,
    action               VARCHAR(50)   NOT NULL,
    target_label         VARCHAR(255)  NULL,
    read_at              TIMESTAMP     NULL,
    created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_audit_logs_user_id_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_user_id_read_at ON audit_logs (user_id, read_at);
