package com.tuyen.personalvault.features.credentials.repository;

import com.tuyen.personalvault.features.credentials.entity.Credential;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CredentialRepository extends JpaRepository<Credential, UUID> {

    Page<Credential> findAllByUserId(UUID userId, Pageable pageable);

    Optional<Credential> findByIdAndUserId(UUID id, UUID userId);
}
