package com.smartspend.backend.service;

import com.smartspend.backend.entity.Badge;
import com.smartspend.backend.repository.BadgeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BadgeService {

    private final BadgeRepository badgeRepository;

    public BadgeService(BadgeRepository badgeRepository) {
        this.badgeRepository = badgeRepository;
    }

    public List<Badge> getAllBadges() {
        return badgeRepository.findAll();
    }

    public Optional<Badge> getBadgeById(Long id) {
        return badgeRepository.findById(id);
    }

    public List<Badge> getBadgesByUserId(Long userId) {
        return badgeRepository.findByUserId(userId);
    }

    public List<Badge> getBadgesByUser(
            com.smartspend.backend.entity.User user) {

        return badgeRepository.findByUser(user);
    }

    public Badge saveBadge(Badge badge) {
        return badgeRepository.save(badge);
    }

    public void deleteBadge(Long id) {
        badgeRepository.deleteById(id);
    }

    // Check whether a user already has a specific badge
    public boolean hasBadge(Long userId, String badgeType) {

        return badgeRepository
                .findByUserId(userId)
                .stream()
                .anyMatch(badge ->
                        badge.getBadgeType()
                                .equalsIgnoreCase(badgeType));
    }
}