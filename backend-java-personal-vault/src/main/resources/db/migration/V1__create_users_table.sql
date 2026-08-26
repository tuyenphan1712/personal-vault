CREATE TABLE users (
    id                     CHAR(36)      NOT NULL,
    phone                  VARCHAR(20)   NOT NULL,
    full_name              VARCHAR(255)  NOT NULL,
    password_hash          VARCHAR(255)  NOT NULL,
    birthday               DATE          NULL,
    role                   ENUM('admin', 'member') NOT NULL DEFAULT 'member',
    status                 ENUM('active', 'locked') NOT NULL DEFAULT 'active',
    failed_login_attempts  INT           NOT NULL DEFAULT 0,
    lockout_until          TIMESTAMP     NULL,
    created_at             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_users_phone (phone)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
