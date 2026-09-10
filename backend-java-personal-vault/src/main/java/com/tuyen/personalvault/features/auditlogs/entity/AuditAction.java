package com.tuyen.personalvault.features.auditlogs.entity;

public enum AuditAction {
    PASSWORD_CHANGED,
    PIN_CHANGED,
    CREDENTIAL_CREATED,
    CREDENTIAL_UPDATED,
    CREDENTIAL_DELETED,
    DOCUMENT_UPLOADED,
    DOCUMENT_DELETED,
    LOGIN_SUCCESS,
    LOGIN_FAILED,
    ACCOUNT_LOCKED
}
