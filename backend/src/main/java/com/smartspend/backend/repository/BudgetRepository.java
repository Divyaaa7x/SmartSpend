package com.smartspend.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartspend.backend.entity.Budget;
import com.smartspend.backend.entity.User;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUser(User user);

    List<Budget> findByUserId(Long userId);

    Optional<Budget> findByUserIdAndCategoryId(Long userId, Long categoryId);
}