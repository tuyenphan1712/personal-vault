package com.tuyen.personalvault.features.documents.exception;

import com.tuyen.personalvault.shared.exception.AppException;
import org.springframework.http.HttpStatus;

public class UnsupportedFileTypeException extends AppException {

    public UnsupportedFileTypeException() {
        super("DOCUMENT_002", "File type is unsupported", HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }
}
