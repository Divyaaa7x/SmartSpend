import { useEffect, useState } from "react";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LineChart,
    Line,
    Dot
} from "recharts";

import {
    getDashboardSummary,
    getExpenses,
    getBudgets,
    getBudgetOverview,
    getCategories,
    getMonthlyExpenses
} from "../services/api";

import "../styles/Dashboard.css";

function Dashboard({
    user,
    onLogout,
    onNavigate
}) {

    const [summary, setSummary] = useState({
        totalSpent: 0,
        monthlySpent: 0,
        totalExpenses: 0,
        categoryTotals: []
    });

    const [expenses, setExpenses] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [budgetOverview, setBudgetOverview] = useState([]);
    const [categories, setCategories] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);

    // Selected month for the Monthly Report.
    // Defaults to the current month in YYYY-MM format.
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");

        return `${year}-${month}`;
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {

        try {

            setLoading(true);
            setError("");

            const [
                summaryData,
                expenseData,
                budgetData,
                budgetOverviewData,
                categoryData,
                monthlyExpenseData
            ] = await Promise.all([
                getDashboardSummary(),
                getExpenses(),
                getBudgets(),
                getBudgetOverview(),
                getCategories(),
                getMonthlyExpenses()
            ]);

            setSummary(summaryData);
            setExpenses(expenseData);
            setBudgets(budgetData);
            setBudgetOverview(budgetOverviewData);
            setCategories(categoryData);
            setMonthlyData(monthlyExpenseData);

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                "Unable to load dashboard."
            );

        } finally {
            setLoading(false);
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

    const chartData =
        summary.categoryTotals?.map((item) => ({
            name: item.categoryName,
            value: Number(item.totalAmount)
        })) || [];

    /*
     * IMPORTANT:
     * Always sort monthly data from oldest month
     * to newest month before using it.
     *
     * Example:
     * 2026-08
     * 2026-09
     * 2026-10
     *
     * This fixes both:
     * 1. Monthly Spending Trend chart order
     * 2. Smart Insights month-to-month comparison
     */
    const sortedMonthlyData = [...monthlyData].sort(
        (a, b) => String(a.month).localeCompare(String(b.month))
    );

    const monthlyChartData = sortedMonthlyData
        .slice(-12)
        .map(item => ({
            month: item.month,
            value: Number(item.totalAmount)
        }));

    const COLORS = [
        "#2563eb",
        "#16a34a",
        "#f59e0b",
        "#dc2626",
        "#9333ea",
        "#0891b2",
        "#64748b"
    ];

    const recentExpenses =
        [...expenses]
            .sort(
                (a, b) =>
                    new Date(b.expenseDate) -
                    new Date(a.expenseDate)
            )
            .slice(0, 5);

    /*
     * BUDGET ALERTS
     *
     * < 80% - No warning
     * 80-89% - Approaching limit
     * 90-99% - Almost reached
     * 100%+ - Exceeded
     */

    const budgetAlerts =
        budgetOverview.filter((budget) => {

            const budgetLimit =
                Number(
                    budget.budgetLimit || 0
                );

            const spentAmount =
                Number(
                    budget.spentAmount || 0
                );

            if (budgetLimit <= 0) {
                return false;
            }

            const percentage =
                (spentAmount / budgetLimit) * 100;

            return percentage >= 80;

        });

    // Spending insights
    const insights = [];

    if (summary.categoryTotals?.length > 0) {

        const topCategory =
            summary.categoryTotals.reduce(
                (max, cat) =>
                    Number(cat.totalAmount) >
                    Number(max.totalAmount)
                        ? cat
                        : max
            );

        const topPercentage =
            summary.totalSpent > 0
                ? (
                    Number(topCategory.totalAmount) /
                    Number(summary.totalSpent)
                ) * 100
                : 0;

        if (topPercentage > 40) {

            insights.push({
                type: "warning",
                text: `${topCategory.categoryName} is your highest spending category (${Math.round(topPercentage)}% of total).`
            });

        }
    }

    /*
     * SMART MONTH-TO-MONTH INSIGHT
     *
     * Use sortedMonthlyData instead of the original
     * backend array because the backend order may not
     * always be chronological.
     *
     * Last item = latest month
     * Second-last item = previous month
     */

    if (sortedMonthlyData.length >= 2) {

        const currentMonth =
            sortedMonthlyData[sortedMonthlyData.length - 1];

        const prevMonth =
            sortedMonthlyData[sortedMonthlyData.length - 2];

        const currentTotal =
            Number(currentMonth.totalAmount || 0);

        const prevTotal =
            Number(prevMonth.totalAmount || 0);

        if (currentTotal > prevTotal) {

            const diff =
                currentTotal - prevTotal;

            insights.push({
                type: "warning",
                text: `Your spending increased by ₹${formatAmount(diff)} compared to last month.`
            });

        } else if (currentTotal < prevTotal) {

            const diff =
                prevTotal - currentTotal;

            insights.push({
                type: "success",
                text: `Great! Your spending decreased by ₹${formatAmount(diff)} compared to last month.`
            });

        } else {

            insights.push({
                type: "info",
                text: "Your spending is the same as last month."
            });

        }
    }

    budgetOverview.forEach(budget => {

        const budgetLimit =
            Number(
                budget.budgetLimit || 0
            );

        const spentAmount =
            Number(
                budget.spentAmount || 0
            );

        const percentage =
            budgetLimit > 0
                ? (spentAmount / budgetLimit) * 100
                : 0;

        if (percentage >= 100) {

            insights.push({
                type: "danger",
                text: `You have exceeded your ${budget.categoryName} budget by ₹${formatAmount(Math.abs(Number(budget.remainingAmount || 0)))}.`
            });

        } else if (percentage >= 90) {

            insights.push({
                type: "warning",
                text: `You are approaching your ${budget.categoryName} budget (${Math.round(percentage)}% used).`
            });

        }
    });

    if (expenses.length > 0) {

        const avgExpense =
            Number(summary.totalSpent) /
            expenses.length;

        const maxExpense =
            Math.max(
                ...expenses.map(
                    e => Number(e.amount)
                )
            );

        insights.push({
            type: "info",
            text: `Average expense: ₹${formatAmount(avgExpense)}. Largest single expense: ₹${formatAmount(maxExpense)}.`
        });
    }

    if (insights.length === 0) {

        insights.push({
            type: "success",
            text: "You're on track! Keep monitoring your expenses and budgets."
        });

    }

    // Monthly Report computation
    const generateMonthlyReport = (monthStr) => {

        const [year, month] =
            monthStr
                .split("-")
                .map(Number);

        const startOfMonth =
            new Date(
                year,
                month - 1,
                1
            );

        const endOfMonth =
            new Date(
                year,
                month,
                0,
                23,
                59,
                59
            );

        const monthExpenses =
            expenses.filter(expense => {

                const expenseDate =
                    new Date(
                        expense.expenseDate
                    );

                return (
                    expenseDate >= startOfMonth &&
                    expenseDate <= endOfMonth
                );

            });

        const totalSpent =
            monthExpenses.reduce(
                (sum, e) =>
                    sum +
                    Number(
                        e.amount || 0
                    ),
                0
            );

        const totalTransactions =
            monthExpenses.length;

        const avgExpense =
            totalTransactions > 0
                ? totalSpent /
                  totalTransactions
                : 0;

        const maxExpense =
            totalTransactions > 0
                ? Math.max(
                    ...monthExpenses.map(
                        e =>
                            Number(
                                e.amount
                            )
                    )
                )
                : 0;

        // Category breakdown
        const categoryMap = {};

        monthExpenses.forEach(expense => {

            const cat =
                expense.categoryName ||
                "Other";

            categoryMap[cat] =
                (
                    categoryMap[cat] ||
                    0
                ) +
                Number(
                    expense.amount || 0
                );

        });

        const topCategory =
            Object.entries(categoryMap).length > 0
                ? Object.entries(
                    categoryMap
                ).reduce(
                    (
                        max,
                        [cat, amt]
                    ) =>
                        amt > max[1]
                            ? [cat, amt]
                            : max,
                    ["", 0]
                )[0]
                : "N/A";

        // Budget usage for this month
        let totalBudget = 0;
        let totalBudgetSpent = 0;

        budgetOverview.forEach(
            budget => {

                totalBudget +=
                    Number(
                        budget.budgetLimit ||
                        0
                    );

                totalBudgetSpent +=
                    Number(
                        budget.spentAmount ||
                        0
                    );

            }
        );

        return {

            month: monthStr,

            monthName:
                startOfMonth.toLocaleDateString(
                    "en-IN",
                    {
                        month: "long",
                        year: "numeric"
                    }
                ),

            totalSpent,

            totalTransactions,

            avgExpense,

            maxExpense,

            topCategory,

            categoryBreakdown:
                Object.entries(
                    categoryMap
                ).map(
                    ([name, amount]) => ({
                        name,
                        amount
                    })
                ),

            totalBudget,

            totalBudgetSpent,

            budgetUsagePercent:
                totalBudget > 0
                    ? (
                        totalBudgetSpent /
                        totalBudget
                    ) * 100
                    : 0,

            savings:
                totalBudget >
                totalBudgetSpent
                    ? totalBudget -
                      totalBudgetSpent
                    : 0

        };
    };

    const currentMonthlyReport =
        generateMonthlyReport(
            selectedMonth
        );

    const exportMonthlyReport = () => {

        const report =
            currentMonthlyReport;

        if (!report) return;

        const content = `
SmartSpend Monthly Report
${report.monthName}

Total Spending: ₹${formatAmount(report.totalSpent)}
Total Transactions: ${report.totalTransactions}
Average Expense: ₹${formatAmount(report.avgExpense)}
Largest Expense: ₹${formatAmount(report.maxExpense)}
Top Category: ${report.topCategory}

Category Breakdown:
${report.categoryBreakdown
    .map(
        c =>
            `${c.name}: ₹${formatAmount(c.amount)}`
    )
    .join("\n")}

Budget Overview:
Total Budget: ₹${formatAmount(report.totalBudget)}
Total Spent: ₹${formatAmount(report.totalBudgetSpent)}
Budget Usage: ${report.budgetUsagePercent.toFixed(1)}%
${
    report.savings > 0
        ? `Savings: ₹${formatAmount(report.savings)}`
        : `Over Budget: ₹${formatAmount(Math.abs(report.savings))}`
}

Generated on ${new Date().toLocaleDateString("en-IN")}
        `.trim();

        const blob =
            new Blob(
                [content],
                {
                    type:
                        "text/plain;charset=utf-8"
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href = url;

        link.download =
            `smartspend-report-${report.month}.txt`;

        document.body.appendChild(
            link
        );

        link.click();

        document.body.removeChild(
            link
        );

        URL.revokeObjectURL(
            url
        );
    };

    const printMonthlyReport = () => {

        const report =
            currentMonthlyReport;

        if (!report) return;

        const printWindow =
            window.open(
                "",
                "_blank"
            );

        printWindow.document.write(`
            <html>
                <head>
                    <title>SmartSpend Monthly Report - ${report.monthName}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            padding: 20px;
                            max-width: 800px;
                            margin: 0 auto;
                        }

                        h1 {
                            color: #2563eb;
                        }

                        h2 {
                            color: #334155;
                            border-bottom: 1px solid #e2e8f0;
                            padding-bottom: 8px;
                        }

                        .section {
                            margin-bottom: 24px;
                        }

                        .row {
                            display: flex;
                            justify-content: space-between;
                            padding: 8px 0;
                            border-bottom: 1px solid #f1f5f9;
                        }

                        .label {
                            color: #64748b;
                        }

                        .value {
                            font-weight: 600;
                            color: #0f172a;
                        }

                        .positive {
                            color: #16a34a;
                        }

                        .negative {
                            color: #dc2626;
                        }

                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 12px;
                        }

                        th,
                        td {
                            padding: 10px;
                            text-align: left;
                            border-bottom: 1px solid #e2e8f0;
                        }

                        th {
                            background: #f8fafc;
                            color: #64748b;
                            font-weight: 600;
                        }

                        @media print {
                            .no-print {
                                display: none;
                            }
                        }
                    </style>
                </head>

                <body>

                    <h1>📊 SmartSpend Monthly Report</h1>

                    <p class="no-print">
                        <strong>Period:</strong>
                        ${report.monthName}
                    </p>

                    <p class="no-print">
                        <strong>Generated:</strong>
                        ${new Date().toLocaleDateString("en-IN")}
                    </p>

                    <div class="section">

                        <h2>Summary</h2>

                        <div class="row">
                            <span class="label">
                                Total Spending
                            </span>

                            <span class="value">
                                ₹${formatAmount(report.totalSpent)}
                            </span>
                        </div>

                        <div class="row">
                            <span class="label">
                                Total Transactions
                            </span>

                            <span class="value">
                                ${report.totalTransactions}
                            </span>
                        </div>

                        <div class="row">
                            <span class="label">
                                Average Expense
                            </span>

                            <span class="value">
                                ₹${formatAmount(report.avgExpense)}
                            </span>
                        </div>

                        <div class="row">
                            <span class="label">
                                Largest Expense
                            </span>

                            <span class="value">
                                ₹${formatAmount(report.maxExpense)}
                            </span>
                        </div>

                        <div class="row">
                            <span class="label">
                                Top Category
                            </span>

                            <span class="value">
                                ${report.topCategory}
                            </span>
                        </div>

                    </div>

                    <div class="section">

                        <h2>Category Breakdown</h2>

                        <table>

                            <thead>

                                <tr>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>%</th>
                                </tr>

                            </thead>

                            <tbody>

                                ${report.categoryBreakdown
                                    .map(
                                        c => `
                                            <tr>
                                                <td>
                                                    ${c.name}
                                                </td>

                                                <td>
                                                    ₹${formatAmount(c.amount)}
                                                </td>

                                                <td>
                                                    ${
                                                        report.totalSpent > 0
                                                            ? (
                                                                (
                                                                    c.amount /
                                                                    report.totalSpent
                                                                ) *
                                                                100
                                                            ).toFixed(1)
                                                            : 0
                                                    }%
                                                </td>
                                            </tr>
                                        `
                                    )
                                    .join("")}

                            </tbody>

                        </table>

                    </div>

                    <div class="section">

                        <h2>Budget Overview</h2>

                        <div class="row">

                            <span class="label">
                                Total Budget
                            </span>

                            <span class="value">
                                ₹${formatAmount(report.totalBudget)}
                            </span>

                        </div>

                        <div class="row">

                            <span class="label">
                                Total Spent
                            </span>

                            <span class="value">
                                ₹${formatAmount(report.totalBudgetSpent)}
                            </span>

                        </div>

                        <div class="row">

                            <span class="label">
                                Budget Usage
                            </span>

                            <span class="value">
                                ${report.budgetUsagePercent.toFixed(1)}%
                            </span>

                        </div>

                        <div class="row">

                            <span class="label">
                                ${
                                    report.savings > 0
                                        ? "Savings"
                                        : "Over Budget"
                                }
                            </span>

                            <span
                                class="value ${
                                    report.savings > 0
                                        ? "positive"
                                        : "negative"
                                }"
                            >
                                ₹${formatAmount(
                                    Math.abs(
                                        report.savings
                                    )
                                )}
                            </span>

                        </div>

                    </div>

                </body>
            </html>
        `);

        printWindow.document.close();

        setTimeout(
            () => printWindow.print(),
            500
        );
    };

    if (loading) {

        return (
            <div className="dashboard-loading">

                <div className="loading-spinner"></div>

                <h2>
                    Loading SmartSpend...
                </h2>

                <p>
                    Preparing your financial dashboard
                </p>

            </div>
        );
    }

    return (
        <div className="dashboard-page">

            {/* SIDEBAR */}

            <aside className="sidebar">

                <div className="brand">

                    <div className="brand-icon">
                        ₹
                    </div>

                    <div>

                        <h2>
                            SmartSpend
                        </h2>

                        <span>
                            Finance Tracker
                        </span>

                    </div>

                </div>

                <nav className="sidebar-nav">

                    <button
                        className="nav-item active"
                        onClick={() =>
                            onNavigate(
                                "dashboard"
                            )
                        }
                    >
                        <span>
                            📊
                        </span>

                        Dashboard
                    </button>

                    <button
                        className="nav-item"
                        onClick={() =>
                            onNavigate(
                                "expenses"
                            )
                        }
                    >
                        <span>
                            💸
                        </span>

                        Expenses
                    </button>

                    <button
                        className="nav-item"
                        onClick={() =>
                            onNavigate(
                                "budgets"
                            )
                        }
                    >
                        <span>
                            💰
                        </span>

                        Budgets
                    </button>

                    <button
                        className="nav-item"
                        onClick={() =>
                            onNavigate(
                                "badges"
                            )
                        }
                    >
                        <span>
                            🏆
                        </span>

                        Badges
                    </button>

                </nav>

                <div className="sidebar-bottom">

                    <div className="user-mini">

                        <div className="user-avatar">

                            {
                                user?.name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                "U"
                            }

                        </div>

                        <div className="user-mini-info">

                            <strong>
                                {
                                    user?.name ||
                                    "User"
                                }
                            </strong>

                            <span>
                                {
                                    user?.email ||
                                    ""
                                }
                            </span>

                        </div>

                    </div>

                    <button
                        className="logout-button"
                        onClick={onLogout}
                    >
                        🚪 Logout
                    </button>

                </div>

            </aside>

            {/* MAIN */}

            <main className="dashboard-main">

                <header className="dashboard-header">

                    <div>

                        <p className="welcome-small">
                            Welcome back,
                        </p>

                        <h1>
                            {
                                user?.name ||
                                "User"
                            } 👋
                        </h1>

                        <p className="header-description">
                            Here's your financial overview.
                        </p>

                    </div>

                    <button
                        className="refresh-button"
                        onClick={
                            loadDashboard
                        }
                    >
                        ↻ Refresh
                    </button>

                </header>

                {error && (

                    <div className="dashboard-error">
                        ⚠️ {error}
                    </div>

                )}

                {/* BUDGET ALERTS */}

                {budgetAlerts.length > 0 && (

                    <section
                        className="budget-alert-section"
                        aria-label="Budget alerts"
                    >

                        {budgetAlerts.map(
                            (budget) => {

                                const budgetLimit =
                                    Number(
                                        budget.budgetLimit ||
                                        0
                                    );

                                const spentAmount =
                                    Number(
                                        budget.spentAmount ||
                                        0
                                    );

                                const percentage =
                                    budgetLimit > 0
                                        ? (
                                            spentAmount /
                                            budgetLimit
                                        ) * 100
                                        : 0;

                                const isExceeded =
                                    percentage >=
                                    100;

                                const isCritical =
                                    percentage >=
                                    90;

                                const remaining =
                                    Math.abs(
                                        Number(
                                            budget.remainingAmount ||
                                            0
                                        )
                                    );

                                const alertType =
                                    isExceeded
                                        ? "danger"
                                        : isCritical
                                            ? "critical"
                                            : "warning";

                                return (

                                    <div
                                        key={
                                            budget.budgetId
                                        }
                                        className={`budget-alert ${alertType}`}
                                        role="alert"
                                    >

                                        <div className="budget-alert-icon">

                                            {
                                                isExceeded
                                                    ? "🚨"
                                                    : isCritical
                                                        ? "⚠️"
                                                        : "🔔"
                                            }

                                        </div>

                                        <div className="budget-alert-content">

                                            <strong>

                                                {
                                                    isExceeded
                                                        ? "Budget Exceeded"
                                                        : isCritical
                                                            ? "Budget Almost Reached"
                                                            : "Budget Approaching Limit"
                                                }

                                            </strong>

                                            <p>

                                                <b>
                                                    {
                                                        budget.categoryName
                                                    }
                                                </b>

                                                {" "}budget is{" "}

                                                <b>
                                                    {
                                                        Math.round(
                                                            percentage
                                                        )
                                                    }%
                                                </b>

                                                {" "}used.

                                            </p>

                                            <span>

                                                ₹
                                                {
                                                    formatAmount(
                                                        spentAmount
                                                    )
                                                }

                                                {" spent out of "}

                                                ₹
                                                {
                                                    formatAmount(
                                                        budgetLimit
                                                    )
                                                }

                                                {" • "}

                                                {
                                                    isExceeded
                                                        ? `Exceeded by ₹${formatAmount(
                                                            remaining
                                                        )}`
                                                        : `₹${formatAmount(
                                                            remaining
                                                        )} remaining`
                                                }

                                            </span>

                                        </div>

                                    </div>

                                );

                            }
                        )}

                    </section>

                )}

                {/* SPENDING INSIGHTS */}

                {insights.length > 0 && (

                    <section
                        className="insights-section"
                        aria-label="Spending insights"
                    >

                        <h3>
                            💡 Smart Insights
                        </h3>

                        <div className="insights-grid">

                            {insights.map(
                                (
                                    insight,
                                    index
                                ) => (

                                    <div
                                        key={index}
                                        className={`insight-card ${insight.type}`}
                                    >

                                        <span className="insight-text">
                                            {
                                                insight.text
                                            }
                                        </span>

                                    </div>

                                )
                            )}

                        </div>

                    </section>

                )}

                {/* STAT CARDS */}

                <section
                    className="stats-grid"
                    aria-label="Financial summary"
                >

                    <div className="stat-card">

                        <div className="stat-icon blue">
                            ₹
                        </div>

                        <div>

                            <span>
                                Total Spending
                            </span>

                            <h2>
                                ₹
                                {
                                    formatAmount(
                                        summary.totalSpent
                                    )
                                }
                            </h2>

                        </div>

                    </div>

                    <div className="stat-card">

                        <div className="stat-icon green">
                            📅
                        </div>

                        <div>

                            <span>
                                This Month
                            </span>

                            <h2>
                                ₹
                                {
                                    formatAmount(
                                        summary.monthlySpent
                                    )
                                }
                            </h2>

                        </div>

                    </div>

                    <div className="stat-card">

                        <div className="stat-icon orange">
                            🧾
                        </div>

                        <div>

                            <span>
                                Total Expenses
                            </span>

                            <h2>
                                {
                                    summary.totalExpenses
                                }
                            </h2>

                        </div>

                    </div>

                    <div className="stat-card">

                        <div className="stat-icon purple">
                            🏆
                        </div>

                        <div>

                            <span>
                                Budgets
                            </span>

                            <h2>
                                {
                                    budgets.length
                                }
                            </h2>

                        </div>

                    </div>

                </section>

                {/* CHARTS */}

                <section
                    className="dashboard-grid"
                    aria-label="Charts"
                >

                    <div className="dashboard-card chart-card">

                        <div className="card-header">

                            <div>

                                <h3>
                                    Spending by Category
                                </h3>

                                <p>
                                    Your spending distribution
                                </p>

                            </div>

                        </div>

                        {chartData.length === 0 ? (

                            <div className="empty-chart">

                                <div>
                                    📊
                                </div>

                                <p>
                                    No expenses recorded yet.
                                </p>

                            </div>

                        ) : (

                            <ResponsiveContainer
                                width="100%"
                                height={320}
                            >

                                <PieChart>

                                    <Pie
                                        data={
                                            chartData
                                        }
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={105}
                                        label
                                    >

                                        {
                                            chartData.map(
                                                (
                                                    entry,
                                                    index
                                                ) => (

                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            COLORS[
                                                                index %
                                                                COLORS.length
                                                            ]
                                                        }
                                                    />

                                                )
                                            )
                                        }

                                    </Pie>

                                    <Tooltip
                                        formatter={
                                            (value) =>
                                                `₹${formatAmount(
                                                    value
                                                )}`
                                        }
                                    />

                                    <Legend />

                                </PieChart>

                            </ResponsiveContainer>

                        )}

                    </div>

                    <div className="dashboard-card chart-card">

                        <div className="card-header">

                            <div>

                                <h3>
                                    Category Spending
                                </h3>

                                <p>
                                    Spending comparison
                                </p>

                            </div>

                        </div>

                        {chartData.length === 0 ? (

                            <div className="empty-chart">

                                <div>
                                    📈
                                </div>

                                <p>
                                    Add expenses to see your chart.
                                </p>

                            </div>

                        ) : (

                            <ResponsiveContainer
                                width="100%"
                                height={320}
                            >

                                <BarChart
                                    data={
                                        chartData
                                    }
                                >

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis
                                        dataKey="name"
                                    />

                                    <YAxis />

                                    <Tooltip
                                        formatter={
                                            (value) =>
                                                `₹${formatAmount(
                                                    value
                                                )}`
                                        }
                                    />

                                    <Bar
                                        dataKey="value"
                                        name="Amount"
                                        fill="#2563eb"
                                        radius={[
                                            6,
                                            6,
                                            0,
                                            0
                                        ]}
                                    />

                                </BarChart>

                            </ResponsiveContainer>

                        )}

                    </div>

                </section>

                {/* MONTHLY TREND CHART */}

                <section className="dashboard-card monthly-trend-card">

                    <div className="card-header">

                        <div>

                            <h3>
                                📈 Monthly Spending Trend
                            </h3>

                            <p>
                                Your spending over the last 12 months
                            </p>

                        </div>

                    </div>

                    {monthlyChartData.length === 0 ? (

                        <div className="empty-chart">

                            <div>
                                📈
                            </div>

                            <p>
                                Add expenses to see your monthly trend.
                            </p>

                        </div>

                    ) : (

                        <ResponsiveContainer
                            width="100%"
                            height={300}
                        >

                            <LineChart
                                data={
                                    monthlyChartData
                                }
                            >

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                />

                                <XAxis
                                    dataKey="month"
                                    tick={{
                                        fontSize: 11
                                    }}
                                />

                                <YAxis
                                    tick={{
                                        fontSize: 11
                                    }}
                                />

                                <Tooltip
                                    formatter={
                                        (value) =>
                                            `₹${formatAmount(
                                                value
                                            )}`
                                    }
                                    labelFormatter={
                                        (month) =>
                                            month
                                    }
                                />

                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    dot={{
                                        r: 6,
                                        strokeWidth: 3
                                    }}
                                    activeDot={{
                                        r: 8,
                                        strokeWidth: 3
                                    }}
                                />

                            </LineChart>

                        </ResponsiveContainer>

                    )}

                </section>

                {/* SPENDING STATISTICS */}

                <section className="stats-detail-grid">

                    <div className="dashboard-card">

                        <div className="card-header">

                            <h3>
                                📊 Spending Summary
                            </h3>

                        </div>

                        <div className="stats-detail">

                            <div className="stat-detail-item">

                                <span className="stat-detail-label">
                                    Total Transactions
                                </span>

                                <strong className="stat-detail-value">
                                    {
                                        expenses.length
                                    }
                                </strong>

                            </div>

                            <div className="stat-detail-item">

                                <span className="stat-detail-label">
                                    Average Expense
                                </span>

                                <strong className="stat-detail-value">

                                    {
                                        expenses.length > 0
                                            ? `₹${formatAmount(
                                                Number(
                                                    summary.totalSpent
                                                ) /
                                                expenses.length
                                            )}`
                                            : "₹0.00"
                                    }

                                </strong>

                            </div>

                            <div className="stat-detail-item">

                                <span className="stat-detail-label">
                                    Largest Expense
                                </span>

                                <strong className="stat-detail-value">

                                    {
                                        expenses.length > 0
                                            ? `₹${formatAmount(
                                                Math.max(
                                                    ...expenses.map(
                                                        e =>
                                                            Number(
                                                                e.amount
                                                            )
                                                    )
                                                )
                                            )}`
                                            : "₹0.00"
                                    }

                                </strong>

                            </div>

                            <div className="stat-detail-item">

                                <span className="stat-detail-label">
                                    Highest Category
                                </span>

                                <strong className="stat-detail-value">

                                    {
                                        summary.categoryTotals?.length > 0
                                            ? summary.categoryTotals.reduce(
                                                (
                                                    max,
                                                    cat
                                                ) =>
                                                    Number(
                                                        cat.totalAmount
                                                    ) >
                                                    Number(
                                                        max.totalAmount
                                                    )
                                                        ? cat
                                                        : max
                                            ).categoryName
                                            : "N/A"
                                    }

                                </strong>

                            </div>

                        </div>

                    </div>

                </section>

                {/* LOWER SECTION */}

                <section className="dashboard-grid">

                    {/* RECENT EXPENSES */}

                    <div className="dashboard-card">

                        <div className="card-header">

                            <div>

                                <h3>
                                    Recent Expenses
                                </h3>

                                <p>
                                    Latest transactions
                                </p>

                            </div>

                            <button
                                className="refresh-button"
                                onClick={() =>
                                    onNavigate(
                                        "expenses"
                                    )
                                }
                            >
                                View All
                            </button>

                        </div>

                        {recentExpenses.length === 0 ? (

                            <div className="empty-state">

                                <div>
                                    💸
                                </div>

                                <p>
                                    No expenses yet.
                                </p>

                            </div>

                        ) : (

                            <div className="expense-list">

                                {recentExpenses.map(
                                    (expense) => (

                                        <div
                                            className="expense-row"
                                            key={
                                                expense.id
                                            }
                                        >

                                            <div className="expense-category-icon">

                                                {
                                                    expense.categoryName
                                                        ?.charAt(0)
                                                        ?.toUpperCase() ||
                                                    "E"
                                                }

                                            </div>

                                            <div className="expense-info">

                                                <strong>
                                                    {
                                                        expense.note ||
                                                        "Expense"
                                                    }
                                                </strong>

                                                <span>

                                                    {
                                                        expense.categoryName ||
                                                        "Other"
                                                    }

                                                    {" • "}

                                                    {
                                                        expense.expenseDate
                                                    }

                                                </span>

                                            </div>

                                            <strong className="expense-amount">

                                                -₹
                                                {
                                                    formatAmount(
                                                        expense.amount
                                                    )
                                                }

                                            </strong>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </div>

                    {/* BUDGET */}

                    <div className="dashboard-card">

                        <div className="card-header">

                            <div>

                                <h3>
                                    Budget Overview
                                </h3>

                                <p>
                                    Monthly category limits
                                </p>

                            </div>

                            <button
                                className="refresh-button"
                                onClick={() =>
                                    onNavigate(
                                        "budgets"
                                    )
                                }
                            >
                                Manage
                            </button>

                        </div>

                        {budgets.length === 0 ? (

                            <div className="empty-state">

                                <div>
                                    💰
                                </div>

                                <p>
                                    No budgets created yet.
                                </p>

                            </div>

                        ) : (

                            <div className="budget-list">

                                {budgetOverview
                                    .slice(
                                        0,
                                        5
                                    )
                                    .map(
                                        (
                                            budget
                                        ) => {

                                            const budgetLimit =
                                                Number(
                                                    budget.budgetLimit ||
                                                    0
                                                );

                                            const spentAmount =
                                                Number(
                                                    budget.spentAmount ||
                                                    0
                                                );

                                            const progress =
                                                budgetLimit >
                                                0
                                                    ? Math.min(
                                                        (
                                                            spentAmount /
                                                            budgetLimit
                                                        ) *
                                                        100,
                                                        100
                                                    )
                                                    : 0;

                                            return (

                                                <div
                                                    className="budget-item"
                                                    key={
                                                        budget.budgetId
                                                    }
                                                >

                                                    <div className="budget-top">

                                                        <strong>
                                                            {
                                                                budget.categoryName ||
                                                                "Category"
                                                            }
                                                        </strong>

                                                        <span>

                                                            ₹
                                                            {
                                                                formatAmount(
                                                                    spentAmount
                                                                )
                                                            }

                                                            {" / "}

                                                            ₹
                                                            {
                                                                formatAmount(
                                                                    budgetLimit
                                                                )
                                                            }

                                                        </span>

                                                    </div>

                                                    <div className="progress-bar">

                                                        <div
                                                            className={
                                                                budget.overBudget
                                                                    ? "progress-fill over-budget"
                                                                    : "progress-fill"
                                                            }
                                                            style={{
                                                                width:
                                                                    `${progress}%`
                                                            }}
                                                        >
                                                        </div>

                                                    </div>

                                                    <div className="budget-status">

                                                        <span>

                                                            {
                                                                budget.overBudget
                                                                    ? `Over budget by ₹${formatAmount(
                                                                        Math.abs(
                                                                            Number(
                                                                                budget.remainingAmount ||
                                                                                0
                                                                            )
                                                                        )
                                                                    )}`
                                                                    : `Remaining ₹${formatAmount(
                                                                        budget.remainingAmount
                                                                    )}`
                                                            }

                                                        </span>

                                                        <strong
                                                            className={
                                                                budget.overBudget
                                                                    ? "budget-danger"
                                                                    : "budget-safe"
                                                            }
                                                        >

                                                            {
                                                                budget.overBudget
                                                                    ? "Over Budget"
                                                                    : "Within Budget"
                                                            }

                                                        </strong>

                                                    </div>

                                                </div>

                                            );

                                        }
                                    )}

                            </div>

                        )}

                    </div>

                </section>

                {/* BUDGET VS ACTUAL */}

                <section className="dashboard-card budget-actual-card">

                    <div className="card-header">

                        <div>

                            <h3>
                                💰 Budget vs Actual Spending
                            </h3>

                            <p>
                                Compare your monthly budget with actual spending
                            </p>

                        </div>

                        <button
                            className="refresh-button"
                            onClick={
                                loadDashboard
                            }
                        >
                            ↻ Update
                        </button>

                    </div>

                    {budgetOverview.length === 0 ? (

                        <div className="empty-state">

                            <div>
                                💰
                            </div>

                            <p>
                                Create a budget to see budget vs actual spending.
                            </p>

                        </div>

                    ) : (

                        <div className="budget-actual-grid">

                            {budgetOverview.map(
                                (budget) => {

                                    const budgetLimit =
                                        Number(
                                            budget.budgetLimit ||
                                            0
                                        );

                                    const spentAmount =
                                        Number(
                                            budget.spentAmount ||
                                            0
                                        );

                                    const remainingAmount =
                                        Number(
                                            budget.remainingAmount ||
                                            0
                                        );

                                    const progress =
                                        budgetLimit >
                                        0
                                            ? Math.min(
                                                (
                                                    spentAmount /
                                                    budgetLimit
                                                ) *
                                                100,
                                                100
                                            )
                                            : 0;

                                    return (

                                        <div
                                            className={
                                                budget.overBudget
                                                    ? "budget-actual-item over"
                                                    : "budget-actual-item"
                                            }
                                            key={
                                                budget.budgetId
                                            }
                                        >

                                            <div className="budget-actual-header">

                                                <div>

                                                    <h4>
                                                        {
                                                            budget.categoryName
                                                        }
                                                    </h4>

                                                    <span>
                                                        Monthly Budget
                                                    </span>

                                                </div>

                                                <span
                                                    className={
                                                        budget.overBudget
                                                            ? "status-badge danger"
                                                            : "status-badge success"
                                                    }
                                                >

                                                    {
                                                        budget.overBudget
                                                            ? "Over Budget"
                                                            : "On Track"
                                                    }

                                                </span>

                                            </div>

                                            <div className="budget-actual-values">

                                                <div>

                                                    <span>
                                                        Budget
                                                    </span>

                                                    <strong>
                                                        ₹
                                                        {
                                                            formatAmount(
                                                                budgetLimit
                                                            )
                                                        }
                                                    </strong>

                                                </div>

                                                <div>

                                                    <span>
                                                        Actual
                                                    </span>

                                                    <strong>
                                                        ₹
                                                        {
                                                            formatAmount(
                                                                spentAmount
                                                            )
                                                        }
                                                    </strong>

                                                </div>

                                                <div>

                                                    <span>
                                                        {
                                                            budget.overBudget
                                                                ? "Exceeded"
                                                                : "Remaining"
                                                        }
                                                    </span>

                                                    <strong>
                                                        ₹
                                                        {
                                                            formatAmount(
                                                                Math.abs(
                                                                    remainingAmount
                                                                )
                                                            )
                                                        }
                                                    </strong>

                                                </div>

                                            </div>

                                            <div className="budget-progress-track">

                                                <div
                                                    className={
                                                        budget.overBudget
                                                            ? "budget-progress-fill danger"
                                                            : "budget-progress-fill"
                                                    }
                                                    style={{
                                                        width:
                                                            `${progress}%`
                                                    }}
                                                >
                                                </div>

                                            </div>

                                            <div className="budget-progress-text">

                                                {
                                                    Math.round(
                                                        budgetLimit >
                                                        0
                                                            ? (
                                                                spentAmount /
                                                                budgetLimit
                                                            ) *
                                                            100
                                                            : 0
                                                    )
                                                }

                                                % used

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </section>

                {/* MONTHLY REPORT */}

                <section className="dashboard-card monthly-report-card">

                    <div className="card-header">

                        <div>

                            <h3>
                                📋 Monthly Report
                            </h3>

                            <p>
                                Detailed spending analysis for a specific month
                            </p>

                        </div>

                        <div className="report-controls">

                            <label
                                htmlFor="monthSelector"
                                className="visually-hidden"
                            >
                                Select Month
                            </label>

                            <input
                                type="month"
                                id="monthSelector"
                                value={
                                    selectedMonth
                                }
                                onChange={
                                    (e) =>
                                        setSelectedMonth(
                                            e.target.value
                                        )
                                }
                                className="month-selector"
                            />

                            <button
                                className="refresh-button"
                                onClick={
                                    exportMonthlyReport
                                }
                            >
                                📥 Export TXT
                            </button>

                            <button
                                className="refresh-button"
                                onClick={
                                    printMonthlyReport
                                }
                            >
                                🖨️ Print
                            </button>

                        </div>

                    </div>

                    <div className="report-content">

                        <div className="report-summary">

                            <div className="report-stat">

                                <span className="report-stat-label">
                                    Total Spending
                                </span>

                                <strong className="report-stat-value">
                                    ₹
                                    {
                                        formatAmount(
                                            currentMonthlyReport.totalSpent
                                        )
                                    }
                                </strong>

                            </div>

                            <div className="report-stat">

                                <span className="report-stat-label">
                                    Transactions
                                </span>

                                <strong className="report-stat-value">
                                    {
                                        currentMonthlyReport.totalTransactions
                                    }
                                </strong>

                            </div>

                            <div className="report-stat">

                                <span className="report-stat-label">
                                    Average Expense
                                </span>

                                <strong className="report-stat-value">
                                    ₹
                                    {
                                        formatAmount(
                                            currentMonthlyReport.avgExpense
                                        )
                                    }
                                </strong>

                            </div>

                            <div className="report-stat">

                                <span className="report-stat-label">
                                    Largest Expense
                                </span>

                                <strong className="report-stat-value">
                                    ₹
                                    {
                                        formatAmount(
                                            currentMonthlyReport.maxExpense
                                        )
                                    }
                                </strong>

                            </div>

                            <div className="report-stat">

                                <span className="report-stat-label">
                                    Top Category
                                </span>

                                <strong className="report-stat-value">
                                    {
                                        currentMonthlyReport.topCategory
                                    }
                                </strong>

                            </div>

                            <div className="report-stat">

                                <span className="report-stat-label">
                                    Budget Usage
                                </span>

                                <strong className="report-stat-value">

                                    {
                                        currentMonthlyReport.budgetUsagePercent.toFixed(
                                            1
                                        )
                                    }%

                                </strong>

                            </div>

                        </div>

                        <div className="report-section">

                            <h4>
                                Category Breakdown
                            </h4>

                            {
                                currentMonthlyReport.categoryBreakdown.length === 0 ? (

                                    <p className="report-empty">
                                        No expenses recorded for this month.
                                    </p>

                                ) : (

                                    <table className="report-table">

                                        <thead>

                                            <tr>
                                                <th>
                                                    Category
                                                </th>

                                                <th>
                                                    Amount
                                                </th>

                                                <th>
                                                    % of Total
                                                </th>
                                            </tr>

                                        </thead>

                                        <tbody>

                                            {
                                                currentMonthlyReport.categoryBreakdown.map(
                                                    (
                                                        cat
                                                    ) => (

                                                        <tr
                                                            key={
                                                                cat.name
                                                            }
                                                        >

                                                            <td>
                                                                {
                                                                    cat.name
                                                                }
                                                            </td>

                                                            <td className="amount-cell">

                                                                ₹
                                                                {
                                                                    formatAmount(
                                                                        cat.amount
                                                                    )
                                                                }

                                                            </td>

                                                            <td>

                                                                {
                                                                    currentMonthlyReport.totalSpent >
                                                                    0
                                                                        ? (
                                                                            (
                                                                                cat.amount /
                                                                                currentMonthlyReport.totalSpent
                                                                            ) *
                                                                            100
                                                                        ).toFixed(
                                                                            1
                                                                        )
                                                                        : 0
                                                                }%

                                                            </td>

                                                        </tr>

                                                    )
                                                )
                                            }

                                        </tbody>

                                    </table>

                                )
                            }

                        </div>

                        <div className="report-section">

                            <h4>
                                Budget Overview
                            </h4>

                            <div className="budget-overview-grid">

                                <div className="budget-overview-item">

                                    <span className="label">
                                        Total Budget
                                    </span>

                                    <strong>
                                        ₹
                                        {
                                            formatAmount(
                                                currentMonthlyReport.totalBudget
                                            )
                                        }
                                    </strong>

                                </div>

                                <div className="budget-overview-item">

                                    <span className="label">
                                        Total Spent
                                    </span>

                                    <strong>
                                        ₹
                                        {
                                            formatAmount(
                                                currentMonthlyReport.totalBudgetSpent
                                            )
                                        }
                                    </strong>

                                </div>

                                <div className="budget-overview-item">

                                    <span className="label">
                                        Budget Usage
                                    </span>

                                    <strong>
                                        {
                                            currentMonthlyReport.budgetUsagePercent.toFixed(
                                                1
                                            )
                                        }%
                                    </strong>

                                </div>

                                <div className="budget-overview-item">

                                    <span className="label">

                                        {
                                            currentMonthlyReport.savings >
                                            0
                                                ? "Savings"
                                                : "Over Budget"
                                        }

                                    </span>

                                    <strong
                                        className={
                                            currentMonthlyReport.savings >
                                            0
                                                ? "positive"
                                                : "negative"
                                        }
                                    >

                                        ₹
                                        {
                                            formatAmount(
                                                Math.abs(
                                                    currentMonthlyReport.savings
                                                )
                                            )
                                        }

                                    </strong>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>

                {/* CATEGORIES */}

                <section className="dashboard-card categories-card">

                    <div className="card-header">

                        <div>

                            <h3>
                                Expense Categories
                            </h3>

                            <p>
                                Available spending categories
                            </p>

                        </div>

                    </div>

                    <div className="category-tags">

                        {
                            categories.map(
                                (
                                    category
                                ) => (

                                    <div
                                        className="category-tag"
                                        key={
                                            category.id
                                        }
                                    >

                                        <span>
                                            {
                                                category.icon ||
                                                "•"
                                            }
                                        </span>

                                        {
                                            category.name
                                        }

                                    </div>

                                )
                            )
                        }

                    </div>

                </section>

            </main>

        </div>
    );
}

export default Dashboard;