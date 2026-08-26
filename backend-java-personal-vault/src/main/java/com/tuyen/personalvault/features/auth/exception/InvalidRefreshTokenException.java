package com.tuyen.personalvault.features.auth.exception;

import com.tuyen.personalvault.shared.exception.AppException;
import org.springframework.http.HttpStatus;

public class InvalidRefreshTokenException extends AppException {

    public InvalidRefreshTokenException() {
        super("AUTH_003", "Refresh token is invalid or revoked", HttpStatus.UNAUTHORIZED);
    }
}
