package com.tuyen.personalvault.features.credentials.repository;

import com.tuyen.personalvault.features.credentials.entity.Credential;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CredentialRepository extends JpaRepository<Credential, UUID> {

    Optional<Credential> findByIdAndUserId(UUID id, UUID userId);

    @Query("""
            select c from Credential c
            where c.user.id = :userId
            and (:search is null
                 or lower(c.platformName) like lower(concat('%', :search, '%'))
                 or lower(c.account) like lower(concat('%', :search, '%')))
            """)
    Page<Credential> search(@Param("userId") UUID userId, @Param("search") String search, Pageable pageable);
}
