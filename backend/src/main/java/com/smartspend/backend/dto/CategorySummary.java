package com.smartspend.backend.dto;

import java.math.BigDecimal;

public class CategorySummary {

    private String categoryName;
    private BigDecimal totalAmount;

    public CategorySummary() {
    }

    public CategorySummary(
            String categoryName,
            BigDecimal totalAmount) {

        this.categoryName = categoryName;
        this.totalAmount = totalAmount;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
}