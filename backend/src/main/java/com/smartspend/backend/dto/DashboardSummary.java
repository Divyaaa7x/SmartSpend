package com.smartspend.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardSummary {

    private BigDecimal totalSpent;
    private BigDecimal monthlySpent;
    private int totalExpenses;
    private List<CategorySummary> categoryTotals;

    public DashboardSummary() {
    }

    public DashboardSummary(
            BigDecimal totalSpent,
            BigDecimal monthlySpent,
            int totalExpenses,
            List<CategorySummary> categoryTotals) {

        this.totalSpent = totalSpent;
        this.monthlySpent = monthlySpent;
        this.totalExpenses = totalExpenses;
        this.categoryTotals = categoryTotals;
    }

    public BigDecimal getTotalSpent() {
        return totalSpent;
    }

    public void setTotalSpent(BigDecimal totalSpent) {
        this.totalSpent = totalSpent;
    }

    public BigDecimal getMonthlySpent() {
        return monthlySpent;
    }

    public void setMonthlySpent(BigDecimal monthlySpent) {
        this.monthlySpent = monthlySpent;
    }

    public int getTotalExpenses() {
        return totalExpenses;
    }

    public void setTotalExpenses(int totalExpenses) {
        this.totalExpenses = totalExpenses;
    }

    public List<CategorySummary> getCategoryTotals() {
        return categoryTotals;
    }

    public void setCategoryTotals(List<CategorySummary> categoryTotals) {
        this.categoryTotals = categoryTotals;
    }
}