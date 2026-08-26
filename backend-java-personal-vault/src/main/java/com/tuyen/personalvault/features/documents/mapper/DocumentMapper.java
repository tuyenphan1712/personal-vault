package com.tuyen.personalvault.features.documents.mapper;

import com.tuyen.personalvault.features.documents.dto.DocumentResponse;
import com.tuyen.personalvault.features.documents.entity.Document;
import org.springframework.stereotype.Component;

@Component
public class DocumentMapper {

    public DocumentResponse toResponse(Document document) {
        return new DocumentResponse(
                document.getId(),
                document.getTitle(),
                document.getDocType(),
                document.getMimeType(),
                document.getFileSize(),
                document.getCreatedAt()
        );
    }
}
