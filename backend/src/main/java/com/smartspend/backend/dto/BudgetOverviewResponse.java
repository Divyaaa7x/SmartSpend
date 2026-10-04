package com.smartspend.backend.dto;

import java.math.BigDecimal;

public class BudgetOverviewResponse {

    private Long budgetId;
    private Long categoryId;
    private String categoryName;

    private BigDecimal budgetLimit;
    private BigDecimal spentAmount;
    private BigDecimal remainingAmount;

    private boolean overBudget;

    public BudgetOverviewResponse() {
    }

    public BudgetOverviewResponse(
            Long budgetId,
            Long categoryId,
            String categoryName,
            BigDecimal budgetLimit,
            BigDecimal spentAmount,
            BigDecimal remainingAmount,
            boolean overBudget) {

        this.budgetId = budgetId;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.budgetLimit = budgetLimit;
        this.spentAmount = spentAmount;
        this.remainingAmount = remainingAmount;
        this.overBudget = overBudget;
    }

    public Long getBudgetId() {
        return budgetId;
    }

    public void setBudgetId(Long budgetId) {
        this.budgetId = budgetId;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public BigDecimal getBudgetLimit() {
        return budgetLimit;
    }

    public void setBudgetLimit(BigDecimal budgetLimit) {
        this.budgetLimit = budgetLimit;
    }

    public BigDecimal getSpentAmount() {
        return spentAmount;
    }

    public void setSpentAmount(BigDecimal spentAmount) {
        this.spentAmount = spentAmount;
    }

    public BigDecimal getRemainingAmount() {
        return remainingAmount;
    }

    public void setRemainingAmount(BigDecimal remainingAmount) {
        this.remainingAmount = remainingAmount;
    }

    public boolean isOverBudget() {
        return overBudget;
    }

    public void setOverBudget(boolean overBudget) {
        this.overBudget = overBudget;
    }
}