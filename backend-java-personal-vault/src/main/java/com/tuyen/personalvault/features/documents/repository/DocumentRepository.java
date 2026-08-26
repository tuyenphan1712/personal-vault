package com.tuyen.personalvault.features.documents.repository;

import com.tuyen.personalvault.features.documents.entity.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    Page<Document> findAllByUserId(UUID userId, Pageable pageable);

    List<Document> findAllByUserId(UUID userId);

    Optional<Document> findByIdAndUserId(UUID id, UUID userId);
}
