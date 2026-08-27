package com.tuyen.personalvault.features.documents.repository;

import com.tuyen.personalvault.features.documents.entity.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    List<Document> findAllByUserId(UUID userId);

    Optional<Document> findByIdAndUserId(UUID id, UUID userId);

    @Query("""
            select d from Document d
            where d.user.id = :userId
            and (:search is null or lower(d.title) like lower(concat('%', :search, '%')))
            and (:docType is null or d.docType = :docType)
            """)
    Page<Document> search(@Param("userId") UUID userId, @Param("search") String search,
                           @Param("docType") String docType, Pageable pageable);
}
