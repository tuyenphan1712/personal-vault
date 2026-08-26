package com.tuyen.personalvault.features.auth.exception;

import com.tuyen.personalvault.shared.exception.AppException;
import org.springframework.http.HttpStatus;

public class PhoneAlreadyRegisteredException extends AppException {

    public PhoneAlreadyRegisteredException() {
        super("USER_002", "Phone number already registered", HttpStatus.CONFLICT);
    }
}
