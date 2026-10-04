import { useEffect, useState } from "react";

import {
    getBadges,
    getExpenses,
    getBudgets,
    getBudgetOverview
} from "../services/api";

import "../styles/Badges.css";

function Badges({
    user,
    onLogout,
    onNavigate
}) {

    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // For badge computation
    const [expenses, setExpenses] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [budgetOverview, setBudgetOverview] = useState([]);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {

        try {

            setLoading(true);
            setError("");

            const [badgeData, expenseData, budgetData, overviewData] =
                await Promise.all([
                    getBadges(),
                    getExpenses(),
                    getBudgets(),
                    getBudgetOverview()
                ]);

            setBadges(badgeData);
            setExpenses(expenseData);
            setBudgets(budgetData);
            setBudgetOverview(overviewData);

            // Check and award badges
            await checkAndAwardBadges(expenseData, budgetData, overviewData);

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                "Unable to load badges."
            );

        } finally {
            setLoading(false);
        }
    };

    const checkAndAwardBadges = async (userExpenses, userBudgets, userBudgetOverview) => {
        const earnedBadgeTypes = badges.map(b => b.badgeType.toUpperCase());
        const newBadges = [];

        // FIRST_EXPENSE: First expense added
        if (userExpenses.length >= 1 && !earnedBadgeTypes.includes("FIRST_EXPENSE")) {
            newBadges.push("FIRST_EXPENSE");
        }

        // EXPENSE_TRACKER: 5 expenses recorded
        if (userExpenses.length >= 5 && !earnedBadgeTypes.includes("EXPENSE_TRACKER")) {
            newBadges.push("EXPENSE_TRACKER");
        }

        // CONSISTENT_TRACKER: Expenses recorded across 7+ different days
        const uniqueDays = new Set(userExpenses.map(e => e.expenseDate)).size;
        if (uniqueDays >= 7 && !earnedBadgeTypes.includes("CONSISTENT_TRACKER")) {
            newBadges.push("CONSISTENT_TRACKER");
        }

        // BUDGET_MASTER: At least one budget created and stayed within budget
        if (userBudgets.length >= 1 && !earnedBadgeTypes.includes("BUDGET_MASTER")) {
            const allWithinBudget = userBudgetOverview.every(b => !b.overBudget);
            if (allWithinBudget) {
                newBadges.push("BUDGET_MASTER");
            }
        }

        // SAVING_STARTER: Has budgets and total spending is less than total budgets
        if (userBudgets.length >= 1 && !earnedBadgeTypes.includes("SAVING_STARTER")) {
            const totalBudget = userBudgetOverview.reduce((sum, b) => sum + Number(b.budgetLimit || 0), 0);
            const totalSpent = userBudgetOverview.reduce((sum, b) => sum + Number(b.spentAmount || 0), 0);
            if (totalBudget > 0 && totalSpent < totalBudget) {
                newBadges.push("SAVING_STARTER");
            }
        }

        // Award new badges
        for (const badgeType of newBadges) {
            try {
                await fetch("/api/badges", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
                    },
                    body: JSON.stringify({ badgeType })
                });
            } catch (e) {
                console.error("Failed to award badge:", badgeType);
            }
        }

        if (newBadges.length > 0) {
            // Reload badges
            const data = await getBadges();
            setBadges(data);
        }
    };

    const getBadgeInfo = (type) => {

        const badge =
            String(type || "").toUpperCase();

        switch (badge) {
            case "FIRST_EXPENSE":
                return {
                    icon: "🎯",
                    title: "First Expense",
                    description: "Added your first expense.",
                    color: "#2563eb"
                };

            case "EXPENSE_TRACKER":
                return {
                    icon: "📝",
                    title: "Expense Tracker",
                    description: "Recorded 5 or more expenses.",
                    color: "#16a34a"
                };

            case "CONSISTENT_TRACKER":
                return {
                    icon: "🔥",
                    title: "Consistent Tracker",
                    description: "Tracked expenses across 7+ different days.",
                    color: "#f59e0b"
                };

            case "BUDGET_MASTER":
                return {
                    icon: "📊",
                    title: "Budget Master",
                    description: "Created budgets and stayed within all limits.",
                    color: "#9333ea"
                };

            case "SAVING_STARTER":
                return {
                    icon: "💰",
                    title: "Saving Starter",
                    description: "Total spending is within your total budget.",
                    color: "#0891b2"
                };

            default:
                return {
                    icon: "🏅",
                    title: type || "SmartSpend Badge",
                    description: "A SmartSpend achievement.",
                    color: "#64748b"
                };
        }
    };

    // All possible badges with their locked/unlocked status
    const allBadges = [
        { type: "FIRST_EXPENSE", requirement: "Add your first expense" },
        { type: "EXPENSE_TRACKER", requirement: "Record 5 expenses" },
        { type: "CONSISTENT_TRACKER", requirement: "Track expenses across 7 different days" },
        { type: "BUDGET_MASTER", requirement: "Create budgets and stay within limits" },
        { type: "SAVING_STARTER", requirement: "Keep total spending within total budget" }
    ];

    const earnedBadgeTypes = badges.map(b => b.badgeType.toUpperCase());

    if (loading) {

        return (
            <div className="badges-loading">

                <div className="badge-spinner"></div>

                <h2>
                    Loading badges...
                </h2>

            </div>
        );
    }

    return (
        <div className="badges-content">

            {/* HEADER */}

            <div className="badges-header">

                <div>

                    <p className="page-label">
                        SmartSpend
                    </p>

                    <h1>
                        Achievements
                    </h1>

                    <p>
                        Track your financial achievements and milestones.
                    </p>

                </div>

                <div className="badge-count-card">

                    <span>
                        Badges Earned
                    </span>

                    <strong>
                        {badges.length} / {allBadges.length}
                    </strong>

                </div>

            </div>

            {/* ERROR */}

            {error && (
                <div className="badge-alert" role="alert">
                    ⚠️ {error}
                </div>
            )}

            {/* BADGES GRID - ALL BADGES WITH LOCKED/UNLOCKED STATE */}

            <div className="badges-card">

                <div className="section-heading">

                    <div>

                        <h2>
                            Your Achievements
                        </h2>

                        <p>
                            Keep using SmartSpend to unlock more achievements.
                        </p>

                    </div>

                    <button
                        className="refresh-badges"
                        onClick={loadAllData}
                    >
                        ↻ Refresh
                    </button>

                </div>

                <div className="badges-grid">

                    {allBadges.map((badgeDef) => {

                        const isEarned = earnedBadgeTypes.includes(badgeDef.type.toUpperCase());
                        const earnedBadge = badges.find(b => b.badgeType.toUpperCase() === badgeDef.type.toUpperCase());
                        const info = getBadgeInfo(badgeDef.type);

                        return (
                            <div
                                className={`badge-card ${isEarned ? "earned" : "locked"}`}
                                key={badgeDef.type}
                            >

                                <div
                                    className="badge-icon"
                                    style={{
                                        background: isEarned ? `${info.color}20` : "var(--surface-tertiary)",
                                        color: isEarned ? info.color : "var(--text-muted)"
                                    }}
                                >
                                    {info.icon}
                                </div>

                                <div className="badge-content">

                                    <h3>
                                        {info.title}
                                        {isEarned && <span className="earned-badge-dot" aria-label="Earned" />}
                                    </h3>

                                    <p>
                                        {info.description}
                                    </p>

                                    {isEarned ? (
                                        <span className="earned-date">
                                            Earned {earnedBadge?.earnedAt
                                                ? new Date(earnedBadge.earnedAt).toLocaleDateString("en-IN")
                                                : ""}
                                        </span>
                                    ) : (
                                        <span className="locked-text">
                                            🔒 {badgeDef.requirement}
                                        </span>
                                    )}

                                </div>

                            </div>
                        );
                    })}

                </div>

            </div>

            {/* PROGRESS TO NEXT BADGE */}

            <div className="upcoming-card">

                <div className="section-heading">

                    <div>

                        <h2>
                            Progress to Next Badges
                        </h2>

                        <p>
                            See how close you are to earning more achievements.
                        </p>

                    </div>

                </div>

                <div className="upcoming-grid">

                    <div className="upcoming-item">
                        <div>🔥</div>
                        <strong>Consistent Tracker</strong>
                        <span>Track expenses across 7 different days</span>
                        <div className="progress-mini">
                            <div className="progress-mini-bar">
                                <div
                                    className="progress-mini-fill"
                                    style={{
                                        width: `${Math.min((new Set(expenses.map(e => e.expenseDate)).size / 7) * 100, 100)}%`
                                    }}
                                ></div>
                            </div>
                            <small>{new Set(expenses.map(e => e.expenseDate)).size} / 7 days</small>
                        </div>
                    </div>

                    <div className="upcoming-item">
                        <div>📝</div>
                        <strong>Expense Tracker</strong>
                        <span>Record 5 expenses</span>
                        <div className="progress-mini">
                            <div className="progress-mini-bar">
                                <div
                                    className="progress-mini-fill"
                                    style={{
                                        width: `${Math.min((expenses.length / 5) * 100, 100)}%`
                                    }}
                                ></div>
                            </div>
                            <small>{expenses.length} / 5 expenses</small>
                        </div>
                    </div>

                    <div className="upcoming-item">
                        <div>📊</div>
                        <strong>Budget Master</strong>
                        <span>Create budgets and stay within limits</span>
                        <div className="progress-mini">
                            <div className="progress-mini-bar">
                                <div
                                    className="progress-mini-fill"
                                    style={{
                                        width: `${budgets.length > 0 && budgetOverview.every(b => !b.overBudget) ? 100 : budgets.length > 0 ? 50 : 0}%`
                                    }}
                                ></div>
                            </div>
                            <small>{budgets.length > 0 ? (budgetOverview.every(b => !b.overBudget) ? "Achieved!" : "Budget created") : "No budgets yet"}</small>
                        </div>
                    </div>

                    <div className="upcoming-item">
                        <div>💰</div>
                        <strong>Saving Starter</strong>
                        <span>Keep total spending within total budget</span>
                        <div className="progress-mini">
                            <div className="progress-mini-bar">
                                <div
                                    className="progress-mini-fill"
                                    style={{
                                        width: `${budgets.length > 0 && budgetOverview.reduce((s, b) => s + Number(b.budgetLimit || 0), 0) > budgetOverview.reduce((s, b) => s + Number(b.spentAmount || 0), 0) ? 100 : budgets.length > 0 ? 50 : 0}%`
                                    }}
                                ></div>
                            </div>
                            <small>{budgets.length > 0 ? "Budget active" : "Create a budget"}</small>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default Badges;