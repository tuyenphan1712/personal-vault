package com.tuyen.personalvault.features.auth.exception;

import com.tuyen.personalvault.shared.exception.AppException;
import org.springframework.http.HttpStatus;

public class SessionNotFoundException extends AppException {

    public SessionNotFoundException() {
        super("SESSION_001", "Session not found", HttpStatus.NOT_FOUND);
    }
}
