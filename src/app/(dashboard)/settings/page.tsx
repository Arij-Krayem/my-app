"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark");
  const router = useRouter();

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setName(parsedUser.name);
      setEmail(parsedUser.email);
    }

    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock API call
      const updatedUser = { ...user, name, email };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      alert("Profile updated successfully!");
    } catch (error) {
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      // Mock API call
      alert("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      alert("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="animate-fadeUp">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--t1)" }}>
          Settings
        </h1>
        <p style={{ color: "var(--t2)" }}>
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-2">
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--t1)" }}>
              Profile Information
            </h2>
            
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--t1)" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--t1)" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </form>
          </div>

          {/* Security Section */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--t1)" }}>
              Security
            </h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--t1)" }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--t1)" }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field w-full"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--t1)" }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field w-full"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preferences */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--t1)" }}>
              Preferences
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" style={{ color: "var(--t1)" }}>Theme</p>
                  <p className="text-sm" style={{ color: "var(--t2)" }}>
                    Choose your preferred color scheme
                  </p>
                </div>
                <button
                  onClick={handleThemeToggle}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{
                    background: theme === "dark" ? "var(--accent)" : "var(--border)"
                  }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      theme === "dark" ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {theme === "dark" ? "🌙" : "☀️"}
                </span>
                <span className="text-sm" style={{ color: "var(--t2)" }}>
                  {theme === "dark" ? "Dark mode" : "Light mode"}
                </span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card p-6" style={{ borderColor: "var(--danger)" }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--danger)" }}>
              Danger Zone
            </h2>
            
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "var(--t2)" }}>
                Once you sign out, you'll need to log in again to access your dashboard.
              </p>
              
              <button
                onClick={handleSignOut}
                className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
                style={{
                  background: "var(--danger)",
                  color: "white"
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
