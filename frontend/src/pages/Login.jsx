import { useState } from "react";
import { login } from "../services/api";
import "../styles/Auth.css";

function Login({ onLogin, theme, onToggleTheme }) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (!email || !password) {
            setError("Please enter email and password.");
            return;
        }

        try {

            setLoading(true);

            const data = await login({
                email,
                password
            });


            /*
             * Remember Me
             *
             * Checked:
             * Store login information in localStorage
             *
             * Unchecked:
             * Store login information in sessionStorage
             */

            if (rememberMe) {

                localStorage.setItem(
                    "token",
                    data.token
                );

                localStorage.setItem(
                    "userId",
                    data.userId
                );

                localStorage.setItem(
                    "userName",
                    data.name
                );

                localStorage.setItem(
                    "userEmail",
                    data.email
                );

                // Remove any old session login
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("userId");
                sessionStorage.removeItem("userName");
                sessionStorage.removeItem("userEmail");

            } else {

                sessionStorage.setItem(
                    "token",
                    data.token
                );

                sessionStorage.setItem(
                    "userId",
                    data.userId
                );

                sessionStorage.setItem(
                    "userName",
                    data.name
                );

                sessionStorage.setItem(
                    "userEmail",
                    data.email
                );

                // Remove any old remembered login
                localStorage.removeItem("token");
                localStorage.removeItem("userId");
                localStorage.removeItem("userName");
                localStorage.removeItem("userEmail");
            }

            onLogin(data);

        } catch (err) {

            setError(
                err.message ||
                "Login failed."
            );

        } finally {

            setLoading(false);
        }
    };


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

                <h1>
                    SmartSpend
                </h1>

                <p className="auth-subtitle">
                    Manage your money. Spend smarter.
                </p>

                <h2>
                    Welcome Back
                </h2>

                <p className="auth-description">
                    Login to continue to your dashboard
                </p>


                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}


                <form
                    onSubmit={handleSubmit}
                    autoComplete="on"
                >

                    {/* EMAIL */}

                    <div className="input-group">

                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) =>
                                setEmail(
                                    e.target.value
                                )
                            }
                            autoComplete="email"
                        />

                    </div>


                    {/* PASSWORD */}

                    <div className="input-group">

                        <label htmlFor="password">
                            Password
                        </label>

                        <div className="password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                autoComplete="current-password"
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

                    </div>


                    {/* REMEMBER ME */}

                    <div className="remember-me">

                        <label className="remember-label">

                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) =>
                                    setRememberMe(
                                        e.target.checked
                                    )
                                }
                            />

                            <span>
                                Remember me
                            </span>

                        </label>

                    </div>


                    {/* LOGIN BUTTON */}

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>

                </form>


                <p className="switch-auth">

                    Don't have an account?

                    <button
                        type="button"
                        onClick={() =>
                            onLogin("signup")
                        }
                    >
                        Create Account
                    </button>

                </p>

            </div>

        </div>
    );
}

export default Login;