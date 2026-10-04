package com.smartspend.backend.service;

import com.smartspend.backend.dto.BudgetOverviewResponse;
import com.smartspend.backend.entity.Budget;
import com.smartspend.backend.repository.BudgetRepository;
import com.smartspend.backend.repository.ExpenseRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;

    public BudgetService(
            BudgetRepository budgetRepository,
            ExpenseRepository expenseRepository) {

        this.budgetRepository = budgetRepository;
        this.expenseRepository = expenseRepository;
    }

    public List<Budget> getAllBudgets() {
        return budgetRepository.findAll();
    }

    public Optional<Budget> getBudgetById(Long id) {
        return budgetRepository.findById(id);
    }

    public List<Budget> getBudgetsByUserId(Long userId) {
        return budgetRepository.findByUserId(userId);
    }

    public Optional<Budget> getBudgetByUserAndCategory(
            Long userId,
            Long categoryId) {

        return budgetRepository
                .findByUserIdAndCategoryId(
                        userId,
                        categoryId
                );
    }

    public Budget saveBudget(Budget budget) {
        return budgetRepository.save(budget);
    }

    public void deleteBudget(Long id) {
        budgetRepository.deleteById(id);
    }

    // Calculate budget vs actual spending
    public List<BudgetOverviewResponse> getBudgetOverview(
            Long userId) {

        List<Budget> budgets =
                budgetRepository.findByUserId(userId);

        LocalDate today = LocalDate.now();

        LocalDate startOfMonth =
                today.withDayOfMonth(1);

        LocalDate endOfMonth =
                today.withDayOfMonth(
                        today.lengthOfMonth()
                );

        return budgets.stream()
                .map(budget -> {

                    BigDecimal spentAmount =
                            expenseRepository
                                    .findByUserIdAndCategoryIdAndExpenseDateBetween(
                                            userId,
                                            budget.getCategory().getId(),
                                            startOfMonth,
                                            endOfMonth
                                    )
                                    .stream()
                                    .map(expense ->
                                            expense.getAmount()
                                    )
                                    .reduce(
                                            BigDecimal.ZERO,
                                            BigDecimal::add
                                    );

                    BigDecimal budgetLimit =
                            budget.getMonthlyLimit();

                    BigDecimal remainingAmount =
                            budgetLimit.subtract(
                                    spentAmount
                            );

                    boolean overBudget =
                            spentAmount.compareTo(
                                    budgetLimit
                            ) > 0;

                    return new BudgetOverviewResponse(
                            budget.getId(),
                            budget.getCategory().getId(),
                            budget.getCategory().getName(),
                            budgetLimit,
                            spentAmount,
                            remainingAmount,
                            overBudget
                    );
                })
                .collect(Collectors.toList());
    }
}