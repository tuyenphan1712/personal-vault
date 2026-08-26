package com.tuyen.personalvault.features.credentials.mapper;

import com.tuyen.personalvault.features.credentials.dto.CredentialResponse;
import com.tuyen.personalvault.features.credentials.entity.Credential;
import org.springframework.stereotype.Component;

@Component
public class CredentialMapper {

    public CredentialResponse toResponse(Credential credential) {
        return new CredentialResponse(
                credential.getId(),
                credential.getPlatformName(),
                credential.getAccount(),
                credential.getEncryptedPassword(),
                credential.getCiphertextVersion(),
                credential.getNote(),
                credential.getCreatedAt(),
                credential.getUpdatedAt()
        );
    }
}
