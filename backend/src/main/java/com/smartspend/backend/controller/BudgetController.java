package com.smartspend.backend.controller;

import com.smartspend.backend.dto.BudgetOverviewResponse;
import com.smartspend.backend.dto.BudgetRequest;
import com.smartspend.backend.entity.Budget;
import com.smartspend.backend.entity.Category;
import com.smartspend.backend.entity.User;
import com.smartspend.backend.service.BudgetService;
import com.smartspend.backend.service.CategoryService;
import com.smartspend.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@CrossOrigin(origins = "http://localhost:5173")
public class BudgetController {

    private final BudgetService budgetService;
    private final UserService userService;
    private final CategoryService categoryService;

    public BudgetController(
            BudgetService budgetService,
            UserService userService,
            CategoryService categoryService) {

        this.budgetService = budgetService;
        this.userService = userService;
        this.categoryService = categoryService;
    }

    // GET ALL BUDGETS FOR LOGGED-IN USER
    @GetMapping
    public ResponseEntity<List<Budget>> getAllBudgets(
            Authentication authentication) {

        String email = authentication.getName();

        User user = userService.getUserByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return ResponseEntity.ok(
                budgetService.getBudgetsByUserId(user.getId())
        );
    }

    // GET BUDGET OVERVIEW
    @GetMapping("/overview")
    public ResponseEntity<List<BudgetOverviewResponse>> getBudgetOverview(
            Authentication authentication) {

        String email = authentication.getName();

        User user = userService.getUserByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return ResponseEntity.ok(
                budgetService.getBudgetOverview(
                        user.getId()
                )
        );
    }

    // GET BUDGET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Budget> getBudgetById(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userService.getUserByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return budgetService.getBudgetById(id)
                .filter(budget ->
                        budget.getUser().getId()
                                .equals(user.getId()))
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // GET BUDGETS BY USER
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Budget>> getBudgetsByUserId(
            @PathVariable Long userId,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userService.getUserByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        if (!user.getId().equals(userId)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(
                budgetService.getBudgetsByUserId(userId)
        );
    }

    // GET BUDGET BY USER AND CATEGORY
    @GetMapping("/user/{userId}/category/{categoryId}")
    public ResponseEntity<Budget> getBudgetByUserAndCategory(
            @PathVariable Long userId,
            @PathVariable Long categoryId,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userService.getUserByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        if (!user.getId().equals(userId)) {
            return ResponseEntity.status(403).build();
        }

        return budgetService
                .getBudgetByUserAndCategory(
                        userId,
                        categoryId
                )
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // CREATE BUDGET
    @PostMapping
    public ResponseEntity<Budget> createBudget(
            @Valid @RequestBody BudgetRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userService.getUserByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // Check for duplicate budget
        if (budgetService.getBudgetByUserAndCategory(user.getId(), request.getCategory().getId()).isPresent()) {
            throw new RuntimeException("Budget for this category already exists");
        }

        Category category =
                categoryService.getCategoryById(
                        request.getCategory().getId()
                ).orElseThrow(() ->
                        new RuntimeException("Category not found"));

        Budget budget = new Budget(user, category, request.getMonthlyLimit());

        Budget savedBudget =
                budgetService.saveBudget(budget);

        return ResponseEntity.ok(savedBudget);
    }

    // UPDATE BUDGET
    @PutMapping("/{id}")
    public ResponseEntity<Budget> updateBudget(
            @PathVariable Long id,
            @Valid @RequestBody BudgetRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userService.getUserByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Budget existingBudget =
                budgetService.getBudgetById(id)
                        .orElseThrow(() ->
                                new RuntimeException("Budget not found"));

        if (!existingBudget.getUser().getId()
                .equals(user.getId())) {

            return ResponseEntity.status(403).build();
        }

        existingBudget.setMonthlyLimit(
                request.getMonthlyLimit()
        );

        Category category =
                categoryService.getCategoryById(
                        request.getCategory().getId()
                ).orElseThrow(() ->
                        new RuntimeException("Category not found"));

        existingBudget.setCategory(category);

        Budget savedBudget =
                budgetService.saveBudget(existingBudget);

        return ResponseEntity.ok(savedBudget);
    }

    // DELETE BUDGET
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userService.getUserByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return budgetService.getBudgetById(id)
                .filter(budget ->
                        budget.getUser().getId()
                                .equals(user.getId()))
                .map(budget -> {

                    budgetService.deleteBudget(id);

                    return ResponseEntity
                            .noContent()
                            .<Void>build();
                })
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }
}