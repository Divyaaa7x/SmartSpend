package com.smartspend.backend.controller;

import com.smartspend.backend.dto.UpdateNameRequest;
import com.smartspend.backend.dto.UpdatePasswordRequest;
import com.smartspend.backend.entity.User;
import com.smartspend.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET LOGGED-IN USER PROFILE
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            Authentication authentication) {

        String email = authentication.getName();

        return userService.getUserByEmail(email)
                .map(user -> ResponseEntity.ok(
                        new UserProfileResponse(
                                user.getId(),
                                user.getName(),
                                user.getEmail(),
                                user.getCreatedAt()
                        )
                ))
                .orElse(ResponseEntity.notFound().build());
    }

    // UPDATE USER NAME
    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateName(
            @Valid @RequestBody UpdateNameRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        return userService.getUserByEmail(email)
                .map(user -> {
                    user.setName(request.getName());
                    User updated = userService.saveUser(user);
                    return ResponseEntity.ok(new UserProfileResponse(
                            updated.getId(),
                            updated.getName(),
                            updated.getEmail(),
                            updated.getCreatedAt()
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // CHANGE PASSWORD
    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody UpdatePasswordRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        return userService.getUserByEmail(email)
                .map(user -> {
                    if (!userService.checkPassword(user, request.getCurrentPassword())) {
                        return ResponseEntity.badRequest()
                                .body(new ErrorMessage("Current password is incorrect"));
                    }
                    userService.updatePassword(user, request.getNewPassword());
                    return ResponseEntity.ok(new SuccessMessage("Password updated successfully"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // SIMPLE PROFILE DTO
    public record UserProfileResponse(
            Long id,
            String name,
            String email,
            java.time.LocalDateTime createdAt
    ) {
    }

    public record ErrorMessage(String message) {
    }

    public record SuccessMessage(String message) {
    }
}