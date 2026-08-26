package com.tuyen.personalvault.features.credentials.entity;

import com.tuyen.personalvault.features.users.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "credentials")
public class Credential {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "platform_name", nullable = false)
    private String platformName;

    @Column(name = "account", nullable = false)
    private String account;

    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    @Column(name = "encrypted_password", nullable = false)
    private String encryptedPassword;

    @Column(name = "ciphertext_version", nullable = false)
    private int ciphertextVersion;

    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    @Column(name = "note")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Credential() {
    }

    public Credential(UUID id, User user, String platformName, String account,
                       String encryptedPassword, int ciphertextVersion, String note) {
        this.id = id;
        this.user = user;
        this.platformName = platformName;
        this.account = account;
        this.encryptedPassword = encryptedPassword;
        this.ciphertextVersion = ciphertextVersion;
        this.note = note;
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getPlatformName() {
        return platformName;
    }

    public void setPlatformName(String platformName) {
        this.platformName = platformName;
    }

    public String getAccount() {
        return account;
    }

    public void setAccount(String account) {
        this.account = account;
    }

    public String getEncryptedPassword() {
        return encryptedPassword;
    }

    public void setEncryptedPassword(String encryptedPassword) {
        this.encryptedPassword = encryptedPassword;
    }

    public int getCiphertextVersion() {
        return ciphertextVersion;
    }

    public void setCiphertextVersion(int ciphertextVersion) {
        this.ciphertextVersion = ciphertextVersion;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
