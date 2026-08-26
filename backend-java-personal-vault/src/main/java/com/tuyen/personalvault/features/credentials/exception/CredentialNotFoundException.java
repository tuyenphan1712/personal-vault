package com.tuyen.personalvault.features.credentials.exception;

import com.tuyen.personalvault.shared.exception.AppException;
import org.springframework.http.HttpStatus;

public class CredentialNotFoundException extends AppException {

    public CredentialNotFoundException() {
        super("CREDENTIAL_001", "Credential not found", HttpStatus.NOT_FOUND);
    }
}
