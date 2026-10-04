import { useEffect, useState } from "react";

import {
    getBudgets,
    getBudgetOverview,
    addBudget,
    updateBudget,
    deleteBudget,
    getCategories
} from "../services/api";

import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmationContext";

import "../styles/Budgets.css";

function Budgets({
    user,
    onLogout,
    onNavigate
}) {

    const { success: showSuccess, error: showError } = useToast();
    const { openConfirm } = useConfirm();

    const [budgets, setBudgets] = useState([]);
    const [budgetOverview, setBudgetOverview] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        categoryId: "",
        monthlyLimit: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {

        try {

            setLoading(true);

            const [budgetData, overviewData, categoryData] =
                await Promise.all([
                    getBudgets(),
                    getBudgetOverview(),
                    getCategories()
                ]);

            setBudgets(budgetData);
            setBudgetOverview(overviewData);
            setCategories(categoryData);

        } catch (err) {

            console.error(err);

            showError(
                err.message ||
                "Unable to load budgets."
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
            monthlyLimit: ""
        });

        setEditingId(null);
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (
            !form.categoryId ||
            !form.monthlyLimit
        ) {
            showError("Please select a category and enter a monthly limit.");
            return;
        }

        if (Number(form.monthlyLimit) <= 0) {

            showError("Monthly limit must be greater than zero.");

            return;
        }

        try {

            setSaving(true);

            const budgetData = {
                category: {
                    id: Number(form.categoryId)
                },
                monthlyLimit: Number(
                    form.monthlyLimit
                )
            };

            if (editingId) {

                await updateBudget(
                    editingId,
                    budgetData
                );

                showSuccess("Budget updated successfully!");

            } else {

                await addBudget(
                    budgetData
                );

                showSuccess("Budget created successfully!");
            }

            resetForm();

            await loadData();

        } catch (err) {

            console.error(err);

            showError(
                err.message ||
                "Unable to save budget."
            );

        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (budget) => {

        setForm({
            categoryId:
                budget.category?.id || "",
            monthlyLimit:
                budget.monthlyLimit || ""
        });

        setEditingId(budget.id);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleDelete = async (id) => {

        const confirmed = await openConfirm({
            title: "Delete Budget",
            message: "Are you sure you want to delete this budget? This action cannot be undone.",
            confirmText: "Delete",
            cancelText: "Cancel",
            type: "danger"
        });

        if (!confirmed) {
            return;
        }

        try {

            await deleteBudget(id);

            showSuccess("Budget deleted successfully!");

            await loadData();

        } catch (err) {

            console.error(err);

            showError(
                err.message ||
                "Unable to delete budget."
            );
        }
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

    if (loading) {

        return (
            <div className="budgets-loading">

                <div className="budget-spinner"></div>

                <h2>
                    Loading budgets...
                </h2>

            </div>
        );
    }

    return (
        <div className="budgets-content">

            {/* HEADER */}

            <div className="budgets-header">

                <div>

                    <p className="page-label">
                        SmartSpend
                    </p>

                    <h1>
                        Budgets
                    </h1>

                    <p>
                        Set monthly spending limits and stay on track.
                    </p>

                </div>

                <div className="budget-count-card">

                    <span>
                        Active Budgets
                    </span>

                    <strong>
                        {budgets.length}
                    </strong>

                </div>

            </div>

            {/* CREATE / EDIT FORM */}

            <div className="budget-form-card">

                <div className="section-heading">

                    <div>

                        <h2>
                            {editingId
                                ? "Edit Budget"
                                : "Create Budget"}
                        </h2>

                        <p>
                            {editingId
                                ? "Update your monthly spending limit."
                                : "Set a spending limit for a category."}
                        </p>

                    </div>

                    {editingId && (
                        <button
                            type="button"
                            className="cancel-budget"
                            onClick={resetForm}
                        >
                            Cancel Edit
                        </button>
                    )}

                </div>

                <form
                    className="budget-form"
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

                        <label htmlFor="monthlyLimit">
                            Monthly Limit (₹)
                        </label>

                        <input
                            type="number"
                            id="monthlyLimit"
                            name="monthlyLimit"
                            min="0"
                            step="0.01"
                            placeholder="Example: 5000"
                            value={form.monthlyLimit}
                            onChange={handleChange}
                        />

                    </div>

                    <div className="budget-form-action">

                        <button
                            type="submit"
                            className="save-budget-button"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Update Budget"
                                    : "Create Budget"}
                        </button>

                    </div>

                </form>

            </div>

            {/* BUDGET CARDS WITH PROGRESS */}

            <div className="budget-list-card">

                <div className="section-heading">

                    <div>

                        <h2>
                            Your Budgets
                        </h2>

                        <p>
                            Monthly category limits with actual spending
                        </p>

                    </div>

                    <button
                        className="refresh-budget"
                        onClick={loadData}
                    >
                        ↻ Refresh
                    </button>

                </div>

                {budgets.length === 0 ? (

                    <div className="no-budgets">

                        <div>
                            💰
                        </div>

                        <h3>
                            No budgets yet
                        </h3>

                        <p>
                            Create your first monthly budget above.
                        </p>

                    </div>

                ) : (

                    <div className="budget-cards">

                        {budgets.map(
                            (budget) => {

                                const overview = budgetOverview.find(
                                    o => o.categoryId === budget.category?.id
                                );

                                const budgetLimit = Number(budget.monthlyLimit || 0);
                                const spentAmount = Number(overview?.spentAmount || 0);
                                const progress = budgetLimit > 0
                                    ? Math.min((spentAmount / budgetLimit) * 100, 100)
                                    : 0;
                                const isOverBudget = spentAmount > budgetLimit;
                                const isWarning = progress >= 80 && !isOverBudget;
                                const isCritical = progress >= 90 && !isOverBudget;

                                return (
                                    <div
                                        className={`budget-card ${isOverBudget ? 'over-budget' : isCritical ? 'critical' : isWarning ? 'warning' : ''}`}
                                        key={budget.id}
                                    >

                                        <div className="budget-card-top">

                                            <div className="budget-icon">
                                                💰
                                            </div>

                                            <div>

                                                <h3>
                                                    {budget.category?.name ||
                                                    "Category"}
                                                </h3>

                                                <span>
                                                    Monthly Budget
                                                </span>

                                            </div>

                                        </div>

                                        <div className="budget-limit">

                                            <span>
                                                Spending Limit
                                            </span>

                                            <strong>
                                                ₹
                                                {formatAmount(
                                                    budget.monthlyLimit
                                                )}
                                            </strong>

                                        </div>

                                        <div className="budget-progress">

                                            <div className="budget-progress-track">

                                                <div
                                                    className={
                                                        isOverBudget
                                                            ? "budget-progress-fill over-budget"
                                                            : isCritical
                                                            ? "budget-progress-fill critical"
                                                            : isWarning
                                                            ? "budget-progress-fill warning"
                                                            : "budget-progress-fill"
                                                    }
                                                    style={{
                                                        width: `${progress}%`
                                                    }}
                                                ></div>

                                            </div>

                                            <div className="budget-progress-info">

                                                <span>
                                                    {isOverBudget
                                                        ? `Over budget by ₹${formatAmount(spentAmount - budgetLimit)}`
                                                        : `₹${formatAmount(spentAmount)} of ₹${formatAmount(budgetLimit)} spent`}
                                                </span>

                                                <strong
                                                    className={
                                                        isOverBudget
                                                            ? "budget-danger"
                                                            : isCritical
                                                            ? "budget-critical"
                                                            : isWarning
                                                            ? "budget-warning"
                                                            : "budget-safe"
                                                    }
                                                >
                                                    {isOverBudget
                                                        ? "Over Budget"
                                                        : isCritical
                                                        ? "Critical (90%+)"
                                                        : isWarning
                                                        ? "Warning (80%+)"
                                                        : "Within Budget"}
                                                </strong>

                                            </div>

                                        </div>

                                        <div className="budget-actions">

                                            <button
                                                className="budget-edit"
                                                onClick={() =>
                                                    handleEdit(
                                                        budget
                                                    )
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="budget-delete"
                                                onClick={() =>
                                                    handleDelete(
                                                        budget.id
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>

                )}

            </div>

        </div>
    );
}

export default Budgets;