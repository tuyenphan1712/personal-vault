package com.tuyen.personalvault.features.auth.exception;

import com.tuyen.personalvault.shared.exception.AppException;
import org.springframework.http.HttpStatus;

import java.util.Map;

public class TooManyAttemptsException extends AppException {

    public TooManyAttemptsException(long retryAfterSeconds) {
        super("AUTH_004", "Too many failed login attempts", HttpStatus.TOO_MANY_REQUESTS,
                Map.of("retryAfterSeconds", retryAfterSeconds));
    }
}
