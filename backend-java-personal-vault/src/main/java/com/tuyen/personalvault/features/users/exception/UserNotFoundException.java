package com.tuyen.personalvault.features.users.exception;

import com.tuyen.personalvault.shared.exception.AppException;
import org.springframework.http.HttpStatus;

public class UserNotFoundException extends AppException {

    public UserNotFoundException() {
        super("USER_001", "User not found", HttpStatus.NOT_FOUND);
    }
}
