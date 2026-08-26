package com.tuyen.personalvault.features.users.service;

import com.tuyen.personalvault.features.users.dto.ProfileResponse;
import com.tuyen.personalvault.features.users.dto.UpdateProfileRequest;
import com.tuyen.personalvault.features.users.entity.User;
import com.tuyen.personalvault.features.users.exception.UserNotFoundException;
import com.tuyen.personalvault.features.users.mapper.UserMapper;
import com.tuyen.personalvault.features.users.repository.UserRepository;
import com.tuyen.personalvault.shared.security.CurrentUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    private static final UUID CURRENT_USER_ID = UUID.randomUUID();

    @Mock
    private UserRepository userRepository;

    private final UserMapper userMapper = new UserMapper();

    private UserService userService;

    private MockedStatic<CurrentUser> currentUserMock;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, userMapper);
        currentUserMock = Mockito.mockStatic(CurrentUser.class);
        currentUserMock.when(CurrentUser::id).thenReturn(CURRENT_USER_ID);
    }

    @AfterEach
    void tearDown() {
        currentUserMock.close();
    }

    private User newUser() {
        return new User(CURRENT_USER_ID, "0900000000", "Nguyen Van A", "hashed-password");
    }

    @Nested
    class GetProfile {

        @Test
        void returnsProfileForCurrentUser() {
            User user = newUser();
            when(userRepository.findById(CURRENT_USER_ID)).thenReturn(Optional.of(user));

            ProfileResponse response = userService.getProfile();

            assertThat(response.id()).isEqualTo(CURRENT_USER_ID);
            assertThat(response.phone()).isEqualTo("0900000000");
            assertThat(response.fullName()).isEqualTo("Nguyen Van A");
            assertThat(response.role()).isEqualTo("member");
            assertThat(response.status()).isEqualTo("active");
        }

        @Test
        void throwsUserNotFoundWhenCurrentUserMissing() {
            when(userRepository.findById(CURRENT_USER_ID)).thenReturn(Optional.empty());

            UserNotFoundException ex = catchThrowableOfType(UserNotFoundException.class, userService::getProfile);

            assertThat(ex).isNotNull();
            assertThat(ex.getCode()).isEqualTo("USER_001");
        }
    }

    @Nested
    class UpdateProfile {

        @Test
        void updatesFullNameAndBirthday() {
            User user = newUser();
            when(userRepository.findById(CURRENT_USER_ID)).thenReturn(Optional.of(user));
            UpdateProfileRequest request = new UpdateProfileRequest("Nguyen Van B", LocalDate.of(1999, 1, 1));

            ProfileResponse response = userService.updateProfile(request);

            assertThat(response.fullName()).isEqualTo("Nguyen Van B");
            assertThat(response.birthday()).isEqualTo(LocalDate.of(1999, 1, 1));
            assertThat(user.getFullName()).isEqualTo("Nguyen Van B");
        }

        @Test
        void throwsUserNotFoundWhenCurrentUserMissing() {
            when(userRepository.findById(CURRENT_USER_ID)).thenReturn(Optional.empty());
            UpdateProfileRequest request = new UpdateProfileRequest("Nguyen Van B", null);

            assertThatThrownBy(() -> userService.updateProfile(request))
                    .isInstanceOf(UserNotFoundException.class);

            verify(userRepository, Mockito.never()).save(any());
        }
    }
}
