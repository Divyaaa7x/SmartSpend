package com.smartspend.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenseResponse {

    private Long id;
    private BigDecimal amount;
    private String note;
    private LocalDate expenseDate;
    private Long userId;
    private String categoryName;

    public ExpenseResponse() {
    }

    public ExpenseResponse(
            Long id,
            BigDecimal amount,
            String note,
            LocalDate expenseDate,
            Long userId,
            String categoryName) {

        this.id = id;
        this.amount = amount;
        this.note = note;
        this.expenseDate = expenseDate;
        this.userId = userId;
        this.categoryName = categoryName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDate getExpenseDate() {
        return expenseDate;
    }

    public void setExpenseDate(LocalDate expenseDate) {
        this.expenseDate = expenseDate;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }
}