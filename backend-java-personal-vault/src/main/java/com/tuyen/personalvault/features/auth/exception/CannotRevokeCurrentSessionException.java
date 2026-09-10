package com.tuyen.personalvault.features.auth.exception;

import com.tuyen.personalvault.shared.exception.AppException;
import org.springframework.http.HttpStatus;

public class CannotRevokeCurrentSessionException extends AppException {

    public CannotRevokeCurrentSessionException() {
        super("SESSION_002", "Cannot revoke the current session", HttpStatus.BAD_REQUEST);
    }
}
