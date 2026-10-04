package com.smartspend.backend.repository;

import com.smartspend.backend.entity.Expense;
import com.smartspend.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository
        extends JpaRepository<Expense, Long> {

    List<Expense> findByUser(User user);

    List<Expense> findByUserId(Long userId);

    List<Expense> findByUserEmail(String email);

    // Get expenses for a specific user and category
    // within a particular date range.
    List<Expense> findByUserIdAndCategoryIdAndExpenseDateBetween(
            Long userId,
            Long categoryId,
            LocalDate startDate,
            LocalDate endDate
    );
}