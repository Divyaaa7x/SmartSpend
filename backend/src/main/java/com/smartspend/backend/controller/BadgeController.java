package com.smartspend.backend.controller;

import com.smartspend.backend.entity.Badge;
import com.smartspend.backend.entity.User;
import com.smartspend.backend.service.BadgeService;
import com.smartspend.backend.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
@CrossOrigin(origins = "http://localhost:5173")
public class BadgeController {

    private final BadgeService badgeService;
    private final UserService userService;

    public BadgeController(
            BadgeService badgeService,
            UserService userService) {

        this.badgeService = badgeService;
        this.userService = userService;
    }

    // GET ALL BADGES OF LOGGED-IN USER
    @GetMapping
    public ResponseEntity<List<Badge>> getAllBadges(
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        return ResponseEntity.ok(
                badgeService.getBadgesByUserId(user.getId())
        );
    }

    // GET ONE BADGE
    @GetMapping("/{id}")
    public ResponseEntity<Badge> getBadgeById(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        return badgeService.getBadgeById(id)
                .filter(badge ->
                        badge.getUser().getId()
                                .equals(user.getId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // CREATE BADGE
    @PostMapping
    public ResponseEntity<Badge> createBadge(
            @RequestBody Badge badge,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        badge.setUser(user);

        Badge savedBadge =
                badgeService.saveBadge(badge);

        return ResponseEntity.ok(savedBadge);
    }

    // DELETE BADGE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBadge(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        return badgeService.getBadgeById(id)
                .filter(badge ->
                        badge.getUser().getId()
                                .equals(user.getId()))
                .map(badge -> {

                    badgeService.deleteBadge(id);

                    return ResponseEntity.noContent()
                            .<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // GET LOGGED-IN USER
    private User getLoggedInUser(
            Authentication authentication) {

        String email = authentication.getName();

        return userService.getUserByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }
}