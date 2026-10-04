package com.smartspend.backend.controller;

import com.smartspend.backend.dto.ExpenseRequest;
import com.smartspend.backend.dto.ExpenseResponse;
import com.smartspend.backend.entity.Badge;
import com.smartspend.backend.entity.Category;
import com.smartspend.backend.entity.Expense;
import com.smartspend.backend.entity.User;
import com.smartspend.backend.service.BadgeService;
import com.smartspend.backend.service.CategoryService;
import com.smartspend.backend.service.ExpenseService;
import com.smartspend.backend.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "http://localhost:5173")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final UserService userService;
    private final CategoryService categoryService;
    private final BadgeService badgeService;

    public ExpenseController(
            ExpenseService expenseService,
            UserService userService,
            CategoryService categoryService,
            BadgeService badgeService) {

        this.expenseService = expenseService;
        this.userService = userService;
        this.categoryService = categoryService;
        this.badgeService = badgeService;
    }


    // =========================================================
    // GET ALL EXPENSES FOR LOGGED-IN USER
    // =========================================================

    @GetMapping
    public ResponseEntity<List<ExpenseResponse>> getAllExpenses(
            Authentication authentication) {

        String email = authentication.getName();

        List<ExpenseResponse> expenses =
                expenseService
                        .getExpensesByUserEmail(email)
                        .stream()
                        .map(this::convertToResponse)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(expenses);
    }


    // =========================================================
    // DASHBOARD SUMMARY
    // =========================================================

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary(
            Authentication authentication) {

        String email = authentication.getName();

        List<Expense> expenses =
                expenseService.getExpensesByUserEmail(email);

        BigDecimal totalSpent =
                expenses.stream()
                        .map(Expense::getAmount)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        LocalDate today = LocalDate.now();

        LocalDate startOfMonth =
                today.withDayOfMonth(1);

        LocalDate endOfMonth =
                today.withDayOfMonth(
                        today.lengthOfMonth()
                );

        BigDecimal monthlySpent =
                expenses.stream()
                        .filter(expense ->
                                expense.getExpenseDate() != null &&
                                !expense.getExpenseDate()
                                        .isBefore(startOfMonth) &&
                                !expense.getExpenseDate()
                                        .isAfter(endOfMonth)
                        )
                        .map(Expense::getAmount)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );


        // Category-wise totals
        Map<String, BigDecimal> categoryMap =
                new LinkedHashMap<>();

        for (Expense expense : expenses) {

            String categoryName = "Other";

            if (expense.getCategory() != null &&
                    expense.getCategory().getName() != null) {

                categoryName =
                        expense.getCategory().getName();
            }

            categoryMap.put(
                    categoryName,
                    categoryMap.getOrDefault(
                            categoryName,
                            BigDecimal.ZERO
                    ).add(expense.getAmount())
            );
        }


        List<Map<String, Object>> categoryTotals =
                new ArrayList<>();

        for (Map.Entry<String, BigDecimal> entry :
                categoryMap.entrySet()) {

            Map<String, Object> categoryData =
                    new LinkedHashMap<>();

            categoryData.put(
                    "categoryName",
                    entry.getKey()
            );

            categoryData.put(
                    "totalAmount",
                    entry.getValue()
            );

            categoryTotals.add(categoryData);
        }


        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "totalSpent",
                totalSpent
        );

        response.put(
                "monthlySpent",
                monthlySpent
        );

        response.put(
                "totalExpenses",
                expenses.size()
        );

        response.put(
                "categoryTotals",
                categoryTotals
        );

        return ResponseEntity.ok(response);
    }


    // =========================================================
    // MONTHLY EXPENSES
    // =========================================================

    @GetMapping("/monthly")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyExpenses(
            Authentication authentication) {

        String email = authentication.getName();

        List<Expense> expenses =
                expenseService.getExpensesByUserEmail(email);

        Map<String, BigDecimal> monthlyMap =
                new LinkedHashMap<>();

        for (Expense expense : expenses) {

            if (expense.getExpenseDate() == null) {
                continue;
            }

            String month =
                    expense.getExpenseDate()
                            .getYear()
                            + "-"
                            + String.format(
                                    "%02d",
                                    expense.getExpenseDate()
                                            .getMonthValue()
                            );

            monthlyMap.put(
                    month,
                    monthlyMap.getOrDefault(
                            month,
                            BigDecimal.ZERO
                    ).add(expense.getAmount())
            );
        }


        List<Map<String, Object>> result =
                new ArrayList<>();

        for (Map.Entry<String, BigDecimal> entry :
                monthlyMap.entrySet()) {

            Map<String, Object> monthlyData =
                    new LinkedHashMap<>();

            monthlyData.put(
                    "month",
                    entry.getKey()
            );

            monthlyData.put(
                    "totalAmount",
                    entry.getValue()
            );

            result.add(monthlyData);
        }

        return ResponseEntity.ok(result);
    }


    // =========================================================
    // GET EXPENSE BY ID
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseResponse> getExpenseById(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        User user =
                userService
                        .getUserByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));

        return expenseService
                .getExpenseById(id)
                .filter(expense ->
                        expense.getUser()
                                .getId()
                                .equals(user.getId()))
                .map(this::convertToResponse)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }


    // =========================================================
    // GET EXPENSES BY USER ID
    // =========================================================

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ExpenseResponse>>
    getExpensesByUserId(
            @PathVariable Long userId,
            Authentication authentication) {

        String email = authentication.getName();

        User user =
                userService
                        .getUserByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));

        if (!user.getId().equals(userId)) {

            return ResponseEntity
                    .status(403)
                    .build();
        }

        List<ExpenseResponse> expenses =
                expenseService
                        .getExpensesByUserId(userId)
                        .stream()
                        .map(this::convertToResponse)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(expenses);
    }


    // =========================================================
    // CREATE EXPENSE
    // =========================================================

    @PostMapping
    public ResponseEntity<ExpenseResponse> createExpense(
            @Valid @RequestBody ExpenseRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        User user =
                userService
                        .getUserByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));

        Category category =
                categoryService
                        .getCategoryById(request.getCategory().getId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Category not found"
                                ));

        Expense expense = new Expense(
                user,
                category,
                request.getAmount(),
                request.getNote(),
                request.getExpenseDate()
        );

        Expense savedExpense =
                expenseService.saveExpense(expense);


        // Make sure First Expense badge exists
        if (!badgeService.hasBadge(
                user.getId(),
                "FIRST_EXPENSE")) {

            Badge firstExpenseBadge =
                    new Badge(
                            user,
                            "FIRST_EXPENSE"
                    );

            badgeService.saveBadge(
                    firstExpenseBadge
            );
        }

        return ResponseEntity.ok(
                convertToResponse(savedExpense)
        );
    }


    // =========================================================
    // UPDATE EXPENSE
    // =========================================================

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseResponse> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        User user =
                userService
                        .getUserByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));

        Expense existingExpense =
                expenseService
                        .getExpenseById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Expense not found"
                                ));

        // Check ownership
        if (!existingExpense
                .getUser()
                .getId()
                .equals(user.getId())) {

            return ResponseEntity
                    .status(403)
                    .build();
        }


        // Update amount
        existingExpense.setAmount(
                request.getAmount()
        );


        // Update note
        existingExpense.setNote(
                request.getNote()
        );


        // Update date
        existingExpense.setExpenseDate(
                request.getExpenseDate()
        );


        // Update category
        Category category =
                categoryService
                        .getCategoryById(
                                request.getCategory().getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Category not found"
                                ));

        existingExpense.setCategory(category);


        Expense savedExpense =
                expenseService.saveExpense(
                        existingExpense
                );

        return ResponseEntity.ok(
                convertToResponse(savedExpense)
        );
    }


    // =========================================================
    // DELETE EXPENSE
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        User user =
                userService
                        .getUserByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));

        return expenseService
                .getExpenseById(id)
                .filter(expense ->
                        expense.getUser()
                                .getId()
                                .equals(user.getId()))
                .map(expense -> {

                    expenseService.deleteExpense(id);

                    return ResponseEntity
                            .noContent()
                            .<Void>build();
                })
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }


    // =========================================================
    // CONVERT ENTITY TO RESPONSE
    // =========================================================

    private ExpenseResponse convertToResponse(
            Expense expense) {

        String categoryName = null;

        if (expense.getCategory() != null) {

            categoryName =
                    expense.getCategory().getName();
        }

        return new ExpenseResponse(
                expense.getId(),
                expense.getAmount(),
                expense.getNote(),
                expense.getExpenseDate(),
                expense.getUser().getId(),
                categoryName
        );
    }
}