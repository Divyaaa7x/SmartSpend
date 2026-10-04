import { useState, useEffect } from "react";
import { getCurrentUser } from "../services/api";
import { useToast } from "../components/Toast";

import "../styles/Profile.css";

function Profile({
    user,
    onLogout,
    onNavigate
}) {

    const { success: showSuccess, error: showError } = useToast();

    const [profile, setProfile] = useState({
        name: user?.name || "",
        email: user?.email || "",
        createdAt: null
    });

    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState("profile");

    // Profile form
    const [name, setName] = useState(user?.name || "");

    // Password form
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await getCurrentUser();
            setProfile({
                name: data.name,
                email: data.email,
                createdAt: data.createdAt
            });
            setName(data.name);
        } catch (err) {
            console.error(err);
            showError("Unable to load profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = async (e) => {
        e.preventDefault();

        const newName = name.trim();
        if (!newName) {
            showError("Name is required.");
            return;
        }

        if (newName.length < 2) {
            showError("Name must be at least 2 characters.");
            return;
        }

        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            const response = await fetch("/api/users/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Failed to update name");
            }

            const updatedUser = await response.json();
            setProfile(prev => ({ ...prev, name: updatedUser.name }));
            showSuccess("Name updated successfully!");

            // Update localStorage/sessionStorage
            if (localStorage.getItem("userName")) {
                localStorage.setItem("userName", updatedUser.name);
            }
            if (sessionStorage.getItem("userName")) {
                sessionStorage.setItem("userName", updatedUser.name);
            }

        } catch (err) {
            showError(err.message || "Failed to update name.");
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showError("Please fill all fields.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showError("New passwords do not match.");
            return;
        }

        if (newPassword.length < 8) {
            showError("New password must be at least 8 characters.");
            return;
        }

        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            const response = await fetch("/api/users/me/password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Failed to update password");
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            showSuccess("Password updated successfully!");

        } catch (err) {
            showError(err.message || "Failed to update password.");
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

    const newPasswordStrength = getPasswordStrength(newPassword);
    const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const strengthColors = ["var(--danger)", "var(--danger)", "var(--warning)", "var(--primary)", "var(--success)"];

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="profile-spinner"></div>
                <h2>Loading profile...</h2>
            </div>
        );
    }

    return (
        <div className="profile-content">

            <div className="profile-header">
                <div className="profile-avatar-large">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                    <h1>{user?.name || "User"}</h1>
                    <p className="profile-email">{user?.email || ""}</p>
                    {profile.createdAt && (
                        <p className="profile-member-since">
                            Member since {new Date(profile.createdAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                            })}
                        </p>
                    )}
                </div>
            </div>

            <div className="profile-tabs">
                <button
                    className={`profile-tab ${activeTab === "profile" ? "active" : ""}`}
                    onClick={() => setActiveTab("profile")}
                >
                    👤 Profile
                </button>
                <button
                    className={`profile-tab ${activeTab === "password" ? "active" : ""}`}
                    onClick={() => setActiveTab("password")}
                >
                    🔒 Password
                </button>
            </div>

            {activeTab === "profile" && (
                <div className="profile-card">
                    <h2>Personal Information</h2>
                    <form onSubmit={handleNameChange} className="profile-form">
                        <div className="form-field">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                            />
                        </div>
                        <button type="submit" className="save-profile-button">
                            Save Changes
                        </button>
                    </form>
                </div>
            )}

            {activeTab === "password" && (
                <div className="profile-card">
                    <h2>Change Password</h2>
                    <p className="password-hint">Your new password must be different from your current password.</p>
                    <form onSubmit={handlePasswordChange} className="profile-form">
                        <div className="form-field password-field">
                            <label htmlFor="currentPassword">Current Password</label>
                            <div className="password-wrapper">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    id="currentPassword"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    autoComplete="current-password"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                                >
                                    {showCurrentPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        <div className="form-field password-field">
                            <label htmlFor="newPassword">New Password</label>
                            <div className="password-wrapper">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setShowNewPassword(false);
                                    }}
                                    autoComplete="new-password"
                                    placeholder="Enter new password (min 8 characters)"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                                >
                                    {showNewPassword ? "🙈" : "👁️"}
                                </button>
                            </div>

                            {newPassword && (
                                <div className="password-strength">
                                    <div className="strength-bar">
                                        <div
                                            className="strength-fill"
                                            style={{
                                                width: `${(newPasswordStrength / 5) * 100}%`,
                                                background: strengthColors[newPasswordStrength - 1] || "var(--border)"
                                            }}
                                        />
                                    </div>
                                    <span className="strength-text" style={{ color: strengthColors[newPasswordStrength - 1] || "var(--text-muted)" }}>
                                        {newPasswordStrength > 0 ? strengthLabels[newPasswordStrength - 1] : ""}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="form-field password-field">
                            <label htmlFor="confirmNewPassword">Confirm New Password</label>
                            <div className="password-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmNewPassword"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="save-profile-button">
                            Update Password
                        </button>
                    </form>
                </div>
            )}

        </div>
    );
}

export default Profile;