package com.tuyen.personalvault.features.auth.exception;

import com.tuyen.personalvault.shared.exception.AppException;
import org.springframework.http.HttpStatus;

public class InvalidCurrentPasswordException extends AppException {

    public InvalidCurrentPasswordException() {
        super("AUTH_006", "Current password is incorrect", HttpStatus.UNAUTHORIZED);
    }
}
