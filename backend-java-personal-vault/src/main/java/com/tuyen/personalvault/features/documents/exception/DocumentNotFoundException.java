package com.tuyen.personalvault.features.documents.exception;

import com.tuyen.personalvault.shared.exception.AppException;
import org.springframework.http.HttpStatus;

public class DocumentNotFoundException extends AppException {

    public DocumentNotFoundException() {
        super("DOCUMENT_001", "Document not found", HttpStatus.NOT_FOUND);
    }
}
