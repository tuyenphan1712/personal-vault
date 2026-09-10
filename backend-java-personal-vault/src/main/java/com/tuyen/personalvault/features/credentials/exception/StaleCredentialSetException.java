package com.tuyen.personalvault.features.credentials.exception;

import com.tuyen.personalvault.shared.exception.AppException;
import org.springframework.http.HttpStatus;

public class StaleCredentialSetException extends AppException {

    public StaleCredentialSetException() {
        super("CREDENTIAL_002", "Credential set is stale or incomplete", HttpStatus.CONFLICT);
    }
}
