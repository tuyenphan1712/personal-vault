package com.tuyen.personalvault.features.auth.exception;

import com.tuyen.personalvault.shared.exception.AppException;
import org.springframework.http.HttpStatus;

public class AccountLockedException extends AppException {

    public AccountLockedException() {
        super("AUTH_002", "Account is locked", HttpStatus.UNAUTHORIZED);
    }
}
