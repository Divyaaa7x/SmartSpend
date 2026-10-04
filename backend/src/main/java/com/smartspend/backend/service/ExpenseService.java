package com.smartspend.backend.service;

import com.smartspend.backend.entity.Expense;
import com.smartspend.backend.repository.ExpenseRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final BadgeService badgeService;

    public ExpenseService(
            ExpenseRepository expenseRepository,
            BadgeService badgeService) {

        this.expenseRepository = expenseRepository;
        this.badgeService = badgeService;
    }

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public Optional<Expense> getExpenseById(Long id) {
        return expenseRepository.findById(id);
    }

    public List<Expense> getExpensesByUserId(Long userId) {
        return expenseRepository.findByUserId(userId);
    }

    public List<Expense> getExpensesByUserEmail(String email) {
        return expenseRepository.findByUserEmail(email);
    }

    public List<Expense> getExpensesByUser(
            com.smartspend.backend.entity.User user) {

        return expenseRepository.findByUser(user);
    }

    public Expense saveExpense(Expense expense) {

        /*
         * Check whether this is the user's first expense
         * before saving the new expense.
         */
        boolean firstExpense =
                expenseRepository.findByUser(expense.getUser()).isEmpty();

        Expense savedExpense =
                expenseRepository.save(expense);

        /*
         * Automatically award the First Expense badge.
         */
        if (firstExpense &&
                !badgeService.hasBadge(
                        expense.getUser().getId(),
                        "FIRST_EXPENSE")) {

            com.smartspend.backend.entity.Badge badge =
                    new com.smartspend.backend.entity.Badge(
                            expense.getUser(),
                            "FIRST_EXPENSE"
                    );

            badgeService.saveBadge(badge);
        }

        return savedExpense;
    }

    public void deleteExpense(Long id) {
        expenseRepository.deleteById(id);
    }
}