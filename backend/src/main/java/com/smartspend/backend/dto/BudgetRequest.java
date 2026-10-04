package com.smartspend.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public class BudgetRequest {

    @NotNull(message = "Category is required")
    private CategoryId category;

    @NotNull(message = "Monthly limit is required")
    @Positive(message = "Monthly limit must be greater than zero")
    private BigDecimal monthlyLimit;

    public BudgetRequest() {
    }

    public CategoryId getCategory() {
        return category;
    }

    public void setCategory(CategoryId category) {
        this.category = category;
    }

    public BigDecimal getMonthlyLimit() {
        return monthlyLimit;
    }

    public void setMonthlyLimit(BigDecimal monthlyLimit) {
        this.monthlyLimit = monthlyLimit;
    }

    public static class CategoryId {
        private Long id;

        public CategoryId() {
        }

        public CategoryId(Long id) {
            this.id = id;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }
    }
}