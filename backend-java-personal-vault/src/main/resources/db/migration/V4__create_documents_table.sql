CREATE TABLE documents (
    id            CHAR(36)      NOT NULL,
    user_id       CHAR(36)      NOT NULL,
    title         VARCHAR(255)  NOT NULL,
    doc_type      VARCHAR(100)  NULL,
    storage_path  TEXT          NOT NULL,
    mime_type     VARCHAR(100)  NOT NULL,
    file_size     BIGINT        NOT NULL,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_documents_user_id_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_documents_user_id ON documents (user_id);
CREATE INDEX idx_documents_doc_type ON documents (doc_type);
