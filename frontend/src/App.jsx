import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Budgets from "./pages/Budgets";
import Badges from "./pages/Badges";
import Profile from "./pages/Profile";
import { ConfirmationProvider } from "./components/ConfirmationContext";

import "./App.css";

function App() {

    // Check both remembered login and current session login
    const storedToken =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    const storedName =
        localStorage.getItem("userName") ||
        sessionStorage.getItem("userName") ||
        "";

    const storedEmail =
        localStorage.getItem("userEmail") ||
        sessionStorage.getItem("userEmail") ||
        "";

    // Check saved theme
    const savedTheme =
        localStorage.getItem("smartspend-theme") ||
        "light";

    const [page, setPage] = useState(
        storedToken
            ? "dashboard"
            : "login"
    );

    const [user, setUser] = useState({
        name: storedName,
        email: storedEmail
    });

    const [theme, setTheme] = useState(
        savedTheme
    );

    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Apply theme to the complete application
    useEffect(() => {

        document.body.classList.remove(
            "light-theme",
            "dark-theme"
        );

        document.body.classList.add(
            theme === "dark"
                ? "dark-theme"
                : "light-theme"
        );

        localStorage.setItem(
            "smartspend-theme",
            theme
        );

    }, [theme]);

    const toggleTheme = () => {

        setTheme((currentTheme) =>
            currentTheme === "light"
                ? "dark"
                : "light"
        );
    };

    const handleLogin = (data) => {

        if (data === "signup") {
            setPage("signup");
            return;
        }

        setUser({
            name: data.name,
            email: data.email
        });

        setPage("dashboard");
    };

    const handleSignup = (data) => {

        if (data === "login") {
            setPage("login");
            return;
        }

        setUser({
            name: data.name,
            email: data.email
        });

        setPage("dashboard");
    };

    const handleLogout = () => {

        // Clear remembered login
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");

        // Clear current-session login
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("userName");
        sessionStorage.removeItem("userEmail");

        setUser({
            name: "",
            email: ""
        });

        setPage("login");
        setSidebarOpen(false);
    };

    if (page === "login") {

        return (
            <Login
                onLogin={handleLogin}
                theme={theme}
                onToggleTheme={toggleTheme}
            />
        );
    }

    if (page === "signup") {

        return (
            <Signup
                onSignup={handleSignup}
                theme={theme}
                onToggleTheme={toggleTheme}
            />
        );
    }

    return (
        <ConfirmationProvider>
            <div className="app">
                <Sidebar
                    user={user}
                    currentPage={page}
                    onNavigate={setPage}
                    onLogout={handleLogout}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                <div className="app-main">
                    <TopNav
                        user={user}
                        onLogout={handleLogout}
                        theme={theme}
                        onToggleTheme={toggleTheme}
                        onMenuClick={() => setSidebarOpen(true)}
                    />

                    <main className="app-content">
                        {page === "dashboard" && (
                            <Dashboard
                                user={user}
                                onLogout={handleLogout}
                                onNavigate={setPage}
                            />
                        )}

                        {page === "expenses" && (
                            <Expenses
                                user={user}
                                onLogout={handleLogout}
                                onNavigate={setPage}
                            />
                        )}

                        {page === "budgets" && (
                            <Budgets
                                user={user}
                                onLogout={handleLogout}
                                onNavigate={setPage}
                            />
                        )}

                        {page === "badges" && (
                            <Badges
                                user={user}
                                onLogout={handleLogout}
                                onNavigate={setPage}
                            />
                        )}

                        {page === "profile" && (
                            <Profile
                                user={user}
                                onLogout={handleLogout}
                                onNavigate={setPage}
                            />
                        )}
                    </main>
                </div>

                {sidebarOpen && (
                    <div
                        className="sidebar-overlay"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </div>
        </ConfirmationProvider>
    );
}

function Sidebar({
    user,
    currentPage,
    onNavigate,
    onLogout,
    isOpen,
    onClose
}) {
    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: "📊" },
        { id: "expenses", label: "Expenses", icon: "💸" },
        { id: "budgets", label: "Budgets", icon: "💰" },
        { id: "badges", label: "Badges", icon: "🏆" },
        { id: "profile", label: "Profile", icon: "👤" }
    ];

    return (
        <aside
            className={`sidebar ${isOpen ? "open" : ""}`}
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="sidebar-header">
                <div className="brand">
                    <div className="brand-icon">₹</div>
                    <div>
                        <h2>SmartSpend</h2>
                        <span>Finance Tracker</span>
                    </div>
                </div>
                <button
                    className="sidebar-close"
                    onClick={onClose}
                    aria-label="Close sidebar"
                >
                    ✕
                </button>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${currentPage === item.id ? "active" : ""}`}
                        onClick={() => {
                            onNavigate(item.id);
                            onClose();
                        }}
                    >
                        <span>{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="sidebar-bottom">
                <div className="user-mini">
                    <div className="user-avatar">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="user-mini-info">
                        <strong>{user?.name || "User"}</strong>
                        <span>{user?.email || ""}</span>
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
    );
}

function TopNav({
    user,
    onLogout,
    theme,
    onToggleTheme,
    onMenuClick
}) {
    return (
        <header className="top-nav">
            <button
                className="menu-toggle"
                onClick={onMenuClick}
                aria-label="Open menu"
            >
                ☰
            </button>

            <div className="top-nav-brand">
                <span>₹ SmartSpend</span>
            </div>

            <div className="top-nav-actions">
                <button
                    className="theme-toggle-button"
                    onClick={onToggleTheme}
                    title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                    aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                >
                    {theme === "light" ? "🌙" : "☀️"}
                </button>

                <span className="top-nav-user">{user.name}</span>

                <button
                    className="top-nav-logout"
                    onClick={onLogout}
                >
                    Logout
                </button>
            </div>
        </header>
    );
}

export default App;