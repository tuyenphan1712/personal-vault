package com.tuyen.personalvault.features.documents.exception;

import com.tuyen.personalvault.shared.exception.AppException;
import org.springframework.http.HttpStatus;

public class FileTooLargeException extends AppException {

    public FileTooLargeException() {
        super("DOCUMENT_003", "File is too large", HttpStatus.CONTENT_TOO_LARGE);
    }
}
