package com.smartspend.backend.repository;

import com.smartspend.backend.entity.Badge;
import com.smartspend.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BadgeRepository extends JpaRepository<Badge, Long> {

    List<Badge> findByUser(User user);

    List<Badge> findByUserId(Long userId);

    boolean existsByUserIdAndBadgeType(
            Long userId,
            String badgeType
    );
}