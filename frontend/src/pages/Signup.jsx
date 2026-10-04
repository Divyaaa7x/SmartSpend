import { useState } from "react";
import { signup } from "../services/api";
import "../styles/Auth.css";

function Signup({ onSignup, theme, onToggleTheme }) {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!name || !email || !password || !confirmPassword) {
            setError("Please fill all fields.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        try {
            setLoading(true);

            const data = await signup({
                name,
                email,
                password
            });

            localStorage.setItem("token", data.token);
            localStorage.setItem("userId", data.userId);
            localStorage.setItem("userName", data.name);
            localStorage.setItem("userEmail", data.email);

            onSignup(data);

        } catch (err) {
            setError(err.message || "Signup failed.");
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = (pwd) => {
        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/[a-z]/.test(pwd)) strength++;
        if (/[0-9]/.test(pwd)) strength++;
        if (/[^A-Za-z0-9]/.test(pwd)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(password);
    const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const strengthColors = ["var(--danger)", "var(--danger)", "var(--warning)", "var(--primary)", "var(--success)"];

    return (
        <div className="auth-page">

            <div className="auth-top-bar">
                <button
                    className="theme-toggle-button"
                    onClick={onToggleTheme}
                    title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                    aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                >
                    {theme === "light" ? "🌙" : "☀️"}
                </button>
            </div>

            <div className="auth-card">

                <div className="auth-logo">
                    ₹
                </div>

                <h1>SmartSpend</h1>

                <p className="auth-subtitle">
                    Your personal finance companion
                </p>

                <h2>Create Account</h2>

                <p className="auth-description">
                    Start managing your expenses today
                </p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="input-group">
                        <label htmlFor="name">Full Name</label>

                        <input
                            type="text"
                            id="name"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            autoComplete="name"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>

                        <input
                            type="email"
                            id="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            autoComplete="email"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>

                        <div className="password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                placeholder="Create a password (min 8 characters)"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setShowPassword(false);
                                }}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </button>
                        </div>

                        {password && (
                            <div className="password-strength">
                                <div className="strength-bar">
                                    <div
                                        className="strength-fill"
                                        style={{
                                            width: `${(passwordStrength / 5) * 100}%`,
                                            background: strengthColors[passwordStrength - 1] || "var(--border)"
                                        }}
                                    />
                                </div>
                                <span className="strength-text" style={{ color: strengthColors[passwordStrength - 1] || "var(--text-muted)" }}>
                                    {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : ""}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>

                        <input
                            type="password"
                            id="confirmPassword"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>

                </form>

                <p className="switch-auth">
                    Already have an account?

                    <button
                        type="button"
                        onClick={() => onSignup("login")}
                    >
                        Login
                    </button>
                </p>

            </div>

        </div>
    );
}

export default Signup;