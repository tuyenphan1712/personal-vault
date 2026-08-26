package com.tuyen.personalvault.features.credentials.service;

import com.tuyen.personalvault.features.credentials.dto.CreateCredentialRequest;
import com.tuyen.personalvault.features.credentials.dto.CredentialResponse;
import com.tuyen.personalvault.features.credentials.dto.UpdateCredentialRequest;
import com.tuyen.personalvault.features.credentials.entity.Credential;
import com.tuyen.personalvault.features.credentials.exception.CredentialNotFoundException;
import com.tuyen.personalvault.features.credentials.mapper.CredentialMapper;
import com.tuyen.personalvault.features.credentials.repository.CredentialRepository;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import com.tuyen.personalvault.shared.response.PageMeta;
import com.tuyen.personalvault.shared.security.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CredentialService {

    private final CredentialRepository credentialRepository;
    private final UserRepository userRepository;
    private final CredentialMapper credentialMapper;

    public CredentialService(CredentialRepository credentialRepository,
                              UserRepository userRepository,
                              CredentialMapper credentialMapper) {
        this.credentialRepository = credentialRepository;
        this.userRepository = userRepository;
        this.credentialMapper = credentialMapper;
    }

    public CredentialListResult list(Pageable pageable) {
        Page<Credential> page = credentialRepository.findAllByUserId(CurrentUser.id(), pageable);
        return new CredentialListResult(
                page.map(credentialMapper::toResponse).getContent(),
                new PageMeta(pageable.getPageNumber() + 1, pageable.getPageSize(),
                        page.getTotalElements(), page.getTotalPages())
        );
    }

    public CredentialResponse get(UUID id) {
        return credentialMapper.toResponse(findOwned(id));
    }

    @Transactional
    public CredentialResponse create(CreateCredentialRequest request) {
        User user = userRepository.getReferenceById(CurrentUser.id());
        Credential credential = new Credential(
                UUID.randomUUID(),
                user,
                request.platformName(),
                request.account(),
                request.encryptedPassword(),
                request.ciphertextVersionOrDefault(),
                request.note()
        );
        credentialRepository.save(credential);
        return credentialMapper.toResponse(credential);
    }

    @Transactional
    public CredentialResponse update(UUID id, UpdateCredentialRequest request) {
        Credential credential = findOwned(id);
        if (request.platformName() != null) {
            credential.setPlatformName(request.platformName());
        }
        if (request.account() != null) {
            credential.setAccount(request.account());
        }
        if (request.encryptedPassword() != null) {
            credential.setEncryptedPassword(request.encryptedPassword());
        }
        if (request.ciphertextVersion() != null) {
            credential.setCiphertextVersion(request.ciphertextVersion());
        }
        if (request.note() != null) {
            credential.setNote(request.note());
        }
        return credentialMapper.toResponse(credential);
    }

    @Transactional
    public void delete(UUID id) {
        credentialRepository.delete(findOwned(id));
    }

    private Credential findOwned(UUID id) {
        return credentialRepository.findByIdAndUserId(id, CurrentUser.id())
                .orElseThrow(CredentialNotFoundException::new);
    }

    public record CredentialListResult(List<CredentialResponse> items, PageMeta meta) {
    }
}
