import { useEffect, useState, useMemo } from "react";

import {
    getExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getCategories
} from "../services/api";

import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmationContext";

import "../styles/Expenses.css";

function Expenses({
    user,
    onLogout,
    onNavigate
}) {

    const { success: showSuccess, error: showError } = useToast();
    const { openConfirm } = useConfirm();

    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        categoryId: "",
        amount: "",
        note: "",
        expenseDate: new Date()
            .toISOString()
            .split("T")[0]
    });

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [sortBy, setSortBy] = useState("newest");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {

        try {

            setLoading(true);

            const [expenseData, categoryData] =
                await Promise.all([
                    getExpenses(),
                    getCategories()
                ]);

            setExpenses(expenseData);
            setCategories(categoryData);

        } catch (err) {

            console.error(err);

            showError(
                err.message ||
                "Unable to load expenses."
            );

        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const resetForm = () => {

        setForm({
            categoryId: "",
            amount: "",
            note: "",
            expenseDate: new Date()
                .toISOString()
                .split("T")[0]
        });

        setEditingId(null);
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (
            !form.categoryId ||
            !form.amount ||
            !form.expenseDate
        ) {
            showError("Please fill category, amount and date.");
            return;
        }

        if (Number(form.amount) <= 0) {
            showError("Amount must be greater than zero.");
            return;
        }

        try {

            setSaving(true);

            const expenseData = {
                category: {
                    id: Number(form.categoryId)
                },
                amount: Number(form.amount),
                note: form.note,
                expenseDate: form.expenseDate
            };

            if (editingId) {

                await updateExpense(
                    editingId,
                    expenseData
                );

                showSuccess("Expense updated successfully!");

            } else {

                await addExpense(expenseData);

                showSuccess("Expense added successfully!");
            }

            resetForm();

            await loadData();

        } catch (err) {

            console.error(err);

            showError(
                err.message ||
                "Unable to save expense."
            );

        } finally {

            setSaving(false);
        }
    };

    const handleEdit = (expense) => {

        const category =
            categories.find(
                (item) =>
                    item.name ===
                    expense.categoryName
            );

        setForm({
            categoryId: category
                ? category.id
                : "",
            amount: expense.amount,
            note: expense.note || "",
            expenseDate: expense.expenseDate
        });

        setEditingId(expense.id);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleDelete = async (id) => {

        const confirmed = await openConfirm({
            title: "Delete Expense",
            message: "Are you sure you want to delete this expense? This action cannot be undone.",
            confirmText: "Delete",
            cancelText: "Cancel",
            type: "danger"
        });

        if (!confirmed) {
            return;
        }

        try {

            await deleteExpense(id);

            showSuccess("Expense deleted successfully!");

            await loadData();

        } catch (err) {

            console.error(err);

            showError(
                err.message ||
                "Unable to delete expense."
            );
        }
    };

    // ==============================
    // CSV EXPORT
    // ==============================

    const escapeCSV = (value) => {

        const text = String(
            value ?? ""
        );

        return `"${text.replace(
            /"/g,
            '""'
        )}"`;
    };

    const exportCSV = () => {

        if (filteredExpenses.length === 0) {

            showError("There are no expenses to export.");

            return;
        }

        const headers = [
            "Date",
            "Category",
            "Description",
            "Amount"
        ];

        const rows = filteredExpenses
            .slice()
            .sort(
                (a, b) =>
                    new Date(b.expenseDate) -
                    new Date(a.expenseDate)
            )
            .map((expense) => [
                expense.expenseDate,
                expense.categoryName || "Other",
                expense.note || "No description",
                Number(expense.amount || 0).toFixed(2)
            ]);

        const csvContent = [
            headers,
            ...rows
        ]
            .map((row) =>
                row
                    .map(escapeCSV)
                    .join(",")
            )
            .join("\n");

        const blob = new Blob(
            [csvContent],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            "smartspend-expenses.csv";

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        showSuccess("Expenses exported to CSV successfully!");
    };

    const formatAmount = (amount) => {

        return Number(amount || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    };

    // Filter and sort expenses
    const filteredExpenses = useMemo(() => {
        let result = [...expenses];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(expense =>
                (expense.note || "").toLowerCase().includes(term) ||
                (expense.categoryName || "").toLowerCase().includes(term) ||
                String(expense.amount).includes(term)
            );
        }

        // Category filter
        if (categoryFilter) {
            result = result.filter(expense =>
                expense.categoryName === categoryFilter
            );
        }

        // Date filter
        if (dateFilter) {
            result = result.filter(expense =>
                expense.expenseDate.startsWith(dateFilter)
            );
        }

        // Sort
        switch (sortBy) {
            case "newest":
                result.sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));
                break;
            case "oldest":
                result.sort((a, b) => new Date(a.expenseDate) - new Date(b.expenseDate));
                break;
            case "amount-high":
                result.sort((a, b) => Number(b.amount) - Number(a.amount));
                break;
            case "amount-low":
                result.sort((a, b) => Number(a.amount) - Number(b.amount));
                break;
        }

        return result;
    }, [expenses, searchTerm, categoryFilter, dateFilter, sortBy]);

    const totalFiltered = filteredExpenses.reduce(
        (total, expense) =>
            total + Number(expense.amount || 0),
        0
    );

    const clearFilters = () => {
        setSearchTerm("");
        setCategoryFilter("");
        setDateFilter("");
        setSortBy("newest");
    };

    if (loading) {

        return (
            <div className="expenses-loading">

                <div className="expenses-spinner"></div>

                <h2>
                    Loading expenses...
                </h2>

            </div>
        );
    }

    return (
        <div className="expenses-content">

            {/* HEADER */}

            <div className="expenses-header">

                <div>
                    <p className="page-label">
                        SmartSpend
                    </p>

                    <h1>
                        Expenses
                    </h1>

                    <p>
                        Track and manage your daily spending.
                    </p>

                </div>

                <div className="expense-total-card">

                    <span>
                        Total Spending
                    </span>

                    <strong>
                        ₹{formatAmount(totalFiltered)}
                    </strong>

                </div>

            </div>

            {/* ADD / EDIT FORM */}

            <div className="expense-form-card">

                <div className="section-heading">

                    <div>
                        <h2>
                            {editingId
                                ? "Edit Expense"
                                : "Add New Expense"}
                        </h2>

                        <p>
                            {editingId
                                ? "Update your expense details."
                                : "Record a new transaction."}
                        </p>
                    </div>

                    {editingId && (
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={resetForm}
                        >
                            Cancel Edit
                        </button>
                    )}

                </div>

                <form
                    className="expense-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-field">

                        <label htmlFor="categoryId">
                            Category
                        </label>

                        <select
                            id="categoryId"
                            name="categoryId"
                            value={form.categoryId}
                            onChange={handleChange}
                        >

                            <option value="">
                                Select category
                            </option>

                            {categories.map(
                                (category) => (

                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>

                                )
                            )}

                        </select>

                    </div>

                    <div className="form-field">

                        <label htmlFor="amount">
                            Amount (₹)
                        </label>

                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            placeholder="Enter amount"
                            min="0"
                            step="0.01"
                            value={form.amount}
                            onChange={handleChange}
                        />

                    </div>

                    <div className="form-field">

                        <label htmlFor="expenseDate">
                            Date
                        </label>

                        <input
                            type="date"
                            id="expenseDate"
                            name="expenseDate"
                            value={form.expenseDate}
                            onChange={handleChange}
                        />

                    </div>

                    <div className="form-field full-width">

                        <label htmlFor="note">
                            Note
                        </label>

                        <input
                            type="text"
                            id="note"
                            name="note"
                            placeholder="Example: Lunch, groceries, bus ticket..."
                            value={form.note}
                            onChange={handleChange}
                        />

                    </div>

                    <div className="form-actions">

                        <button
                            type="submit"
                            className="save-expense-button"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Update Expense"
                                    : "Add Expense"}
                        </button>

                    </div>

                </form>

            </div>

            {/* FILTERS */}

            <div className="filters-card">
                <div className="filters-header">
                    <h3>🔍 Filters</h3>
                    {(searchTerm || categoryFilter || dateFilter) && (
                        <button
                            className="clear-filters"
                            onClick={clearFilters}
                        >
                            Clear All
                        </button>
                    )}
                </div>
                <div className="filters-grid">
                    <div className="form-field">
                        <label htmlFor="search">Search</label>
                        <input
                            id="search"
                            type="text"
                            placeholder="Search notes, categories, amounts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="categoryFilter">Category</label>
                        <select
                            id="categoryFilter"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-field">
                        <label htmlFor="dateFilter">Month</label>
                        <input
                            id="dateFilter"
                            type="month"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="sortBy">Sort By</label>
                        <select
                            id="sortBy"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="amount-high">Amount: High to Low</option>
                            <option value="amount-low">Amount: Low to High</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* EXPENSE TABLE */}

            <div className="expense-list-card">

                <div className="section-heading">

                    <div>
                        <h2>
                            All Expenses
                        </h2>

                        <p>
                            {filteredExpenses.length} transaction
                            {filteredExpenses.length !== 1
                                ? "s"
                                : ""} found
                        </p>
                    </div>

                    <div className="expense-list-actions">

                        <button
                            className="export-csv-button"
                            onClick={exportCSV}
                            disabled={
                                filteredExpenses.length === 0
                            }
                        >
                            📥 Export CSV
                        </button>

                        <button
                            className="refresh-expenses"
                            onClick={loadData}
                        >
                            ↻ Refresh
                        </button>

                    </div>

                </div>

                {filteredExpenses.length === 0 ? (

                    <div className="no-expenses">

                        <div>
                            💸
                        </div>

                        <h3>
                            No expenses found
                        </h3>

                        <p>
                            {expenses.length === 0
                                ? "Add your first expense above."
                                : "Try adjusting your filters."}
                        </p>

                    </div>

                ) : (

                    <div className="expense-table-wrapper">

                        <table className="expense-table">

                            <thead>

                                <tr>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Category
                                    </th>

                                    <th>
                                        Description
                                    </th>

                                    <th>
                                        Amount
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredExpenses.map(
                                    (expense) => (

                                        <tr
                                            key={
                                                expense.id
                                            }
                                        >

                                            <td>
                                                {
                                                    expense.expenseDate
                                                }
                                            </td>

                                            <td>

                                                <span className="category-badge">
                                                    {
                                                        expense.categoryName ||
                                                        "Other"
                                                    }
                                                </span>

                                            </td>

                                            <td>
                                                {
                                                    expense.note ||
                                                    "No description"
                                                }
                                            </td>

                                            <td className="amount-cell">
                                                ₹
                                                {formatAmount(
                                                    expense.amount
                                                )}
                                            </td>

                                            <td>

                                                <div className="action-buttons">

                                                    <button
                                                        className="edit-button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                expense
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="delete-button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                expense.id
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
}

export default Expenses;