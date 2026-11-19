package com.proctor.proctorbackend.user;

import com.proctor.proctorbackend.user.dto.UpdateProfileRequest;
import com.proctor.proctorbackend.user.dto.UserDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {

    UserDto getCurrentUser(String email);

    UserDto updateProfile(String email, UpdateProfileRequest request);

    Page<UserDto> getAllUsers(String search, Pageable pageable);
}
