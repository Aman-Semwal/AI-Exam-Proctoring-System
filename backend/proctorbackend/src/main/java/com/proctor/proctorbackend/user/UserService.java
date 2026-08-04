package com.proctor.proctorbackend.user;

import com.proctor.proctorbackend.user.dto.UpdateProfileRequest;
import com.proctor.proctorbackend.user.dto.UserDto;

public interface UserService {

    UserDto getCurrentUser(String email);

    UserDto updateProfile(String email, UpdateProfileRequest request);
}
