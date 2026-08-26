package com.tuyen.personalvault.features.auth.exception;

import com.tuyen.personalvault.shared.exception.AppException;
import org.springframework.http.HttpStatus;

public class InvalidCredentialsException extends AppException {

    public InvalidCredentialsException() {
        super("AUTH_001", "Invalid phone or password", HttpStatus.UNAUTHORIZED);
    }
}
