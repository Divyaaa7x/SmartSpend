import { useEffect, useState } from "react";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
    useNavigate
} from "react-router-dom";

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
    return (
        <BrowserRouter basename="/SmartSpend">
            <AppContent />
        </BrowserRouter>
    );
}

function AppContent() {
    const navigate = useNavigate();
    const location = useLocation();

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

    const savedTheme =
        localStorage.getItem("smartspend-theme") || "light";

    const [user, setUser] = useState({
        name: storedName,
        email: storedEmail
    });

    const [theme, setTheme] = useState(savedTheme);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const currentPath = location.pathname.toLowerCase();
    const isAuthenticated = Boolean(
        localStorage.getItem("token") ||
        sessionStorage.getItem("token")
    );

    useEffect(() => {
        document.body.classList.remove("light-theme", "dark-theme");
        document.body.classList.add(
            theme === "dark" ? "dark-theme" : "light-theme"
        );
        localStorage.setItem("smartspend-theme", theme);
    }, [theme]);

    useEffect(() => {
        if (isAuthenticated) {
            setUser({
                name:
                    localStorage.getItem("userName") ||
                    sessionStorage.getItem("userName") ||
                    "",
                email:
                    localStorage.getItem("userEmail") ||
                    sessionStorage.getItem("userEmail") ||
                    ""
            });
        }
    }, [isAuthenticated, location.pathname]);

    const toggleTheme = () => {
        setTheme((currentTheme) =>
            currentTheme === "light" ? "dark" : "light"
        );
    };

    const handleLogin = (data) => {
        if (data === "signup") {
            navigate("/Signup");
            return;
        }

        setUser({
            name: data.name,
            email: data.email
        });

        navigate("/Dashboard", { replace: true });
    };

    const handleSignup = (data) => {
        if (data === "login") {
            navigate("/Login");
            return;
        }

        setUser({
            name: data.name,
            email: data.email
        });

        navigate("/Dashboard", { replace: true });
    };

    const handleLogout = () => {
        [
            "token",
            "userId",
            "userName",
            "userEmail"
        ].forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });

        setUser({ name: "", email: "" });
        setSidebarOpen(false);
        navigate("/Login", { replace: true });
    };

    const publicPage =
        currentPath === "/login" || currentPath === "/signup";

    if (!isAuthenticated && !publicPage) {
        return <Navigate to="/Login" replace />;
    }

    if (isAuthenticated && publicPage) {
        return <Navigate to="/Dashboard" replace />;
    }

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <Navigate
                        to={isAuthenticated ? "/Dashboard" : "/Login"}
                        replace
                    />
                }
            />

            <Route
                path="/Login"
                element={
                    <Login
                        onLogin={handleLogin}
                        theme={theme}
                        onToggleTheme={toggleTheme}
                    />
                }
            />

            <Route
                path="/Signup"
                element={
                    <Signup
                        onSignup={handleSignup}
                        theme={theme}
                        onToggleTheme={toggleTheme}
                    />
                }
            />

            <Route
                path="*"
                element={
                    <AuthenticatedLayout
                        user={user}
                        theme={theme}
                        toggleTheme={toggleTheme}
                        onLogout={handleLogout}
                        sidebarOpen={sidebarOpen}
                        setSidebarOpen={setSidebarOpen}
                    />
                }
            />
        </Routes>
    );
}

function AuthenticatedLayout({
    user,
    theme,
    toggleTheme,
    onLogout,
    sidebarOpen,
    setSidebarOpen
}) {
    const location = useLocation();
    const navigate = useNavigate();

    const page = location.pathname
        .split("/")
        .filter(Boolean)
        .pop()
        ?.toLowerCase();

    const pageComponents = {
        dashboard: Dashboard,
        expenses: Expenses,
        budgets: Budgets,
        badges: Badges,
        profile: Profile
    };

    const PageComponent = pageComponents[page];

    if (!PageComponent) {
        return <Navigate to="/Dashboard" replace />;
    }

    const handleNavigate = (nextPage) => {
        navigate(
            "/" +
            nextPage.charAt(0).toUpperCase() +
            nextPage.slice(1)
        );
        setSidebarOpen(false);
    };

    return (
        <ConfirmationProvider>
            <div className="app">
                <Sidebar
                    user={user}
                    currentPage={page}
                    onNavigate={handleNavigate}
                    onLogout={onLogout}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                <div className="app-main">
                    <TopNav
                        user={user}
                        onLogout={onLogout}
                        theme={theme}
                        onToggleTheme={toggleTheme}
                        onMenuClick={() => setSidebarOpen(true)}
                    />

                    <main className="app-content">
                        <PageComponent
                            user={user}
                            onLogout={onLogout}
                            onNavigate={handleNavigate}
                        />
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
                        className={`nav-item ${
                            currentPage === item.id ? "active" : ""
                        }`}
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

                <button className="logout-button" onClick={onLogout}>
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
                    title={
                        theme === "light"
                            ? "Switch to dark mode"
                            : "Switch to light mode"
                    }
                    aria-label={
                        theme === "light"
                            ? "Switch to dark mode"
                            : "Switch to light mode"
                    }
                >
                    {theme === "light" ? "🌙" : "☀️"}
                </button>

                <span className="top-nav-user">{user.name}</span>

                <button className="top-nav-logout" onClick={onLogout}>
                    Logout
                </button>
            </div>
        </header>
    );
}

export default App;