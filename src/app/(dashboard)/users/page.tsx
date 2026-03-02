"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role !== "AGENCY_ADMIN") {
        router.push("/dashboard");
        return;
      }
    }
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    try {
      // Mock data for now
      const mockUsers = [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          role: "MARKETER",
          brands: ["TechCorp", "RetailMax"],
          createdAt: "2024-01-15",
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          role: "MARKETER",
          brands: ["TechCorp"],
          createdAt: "2024-02-20",
        },
        {
          id: 3,
          name: "Bob Johnson",
          email: "bob@example.com",
          role: "AGENCY_ADMIN",
          brands: ["All Brands"],
          createdAt: "2024-01-10",
        },
        {
          id: 4,
          name: "Alice Brown",
          email: "alice@example.com",
          role: "MARKETER",
          brands: ["ServicePro"],
          createdAt: "2024-03-05",
        },
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { class: string; text: string }> = {
      AGENCY_ADMIN: { class: "badge-danger", text: "ADMIN" },
      MARKETER: { class: "badge-info", text: "MARKETER" },
    };

    const config = roleConfig[role] || { class: "badge-info", text: role };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const handleInviteUser = async (userData: any) => {
    // Mock API call
    const newUser = {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers(prev => [...prev, newUser]);
    setShowInviteModal(false);
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(prev => prev.filter(user => user.id !== userId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" style={{ width: "40px", height: "40px" }}></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--t1)" }}>
            Users
          </h1>
          <p style={{ color: "var(--t2)" }}>
            Manage user accounts and permissions
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn-primary"
        >
          Invite User
        </button>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid var(--border)` }}>
                <th className="text-left p-4" style={{ color: "var(--t1)" }}>Name</th>
                <th className="text-left p-4" style={{ color: "var(--t1)" }}>Email</th>
                <th className="text-left p-4" style={{ color: "var(--t1)" }}>Role</th>
                <th className="text-left p-4" style={{ color: "var(--t1)" }}>Brands</th>
                <th className="text-left p-4" style={{ color: "var(--t1)" }}>Created</th>
                <th className="text-left p-4" style={{ color: "var(--t1)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: `1px solid var(--border)` }}>
                    <td className="p-4">
                      <div className="font-medium" style={{ color: "var(--t1)" }}>
                        {user.name}
                      </div>
                    </td>
                    <td className="p-4">
                      <div style={{ color: "var(--t2)" }}>
                        {user.email}
                      </div>
                    </td>
                    <td className="p-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {user.brands.map((brand: string, index: number) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              background: "var(--accent-glow)",
                              color: "var(--accent)"
                            }}
                          >
                            {brand}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div style={{ color: "var(--t2)" }}>
                        {user.createdAt}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          className="text-sm font-medium hover:underline"
                          style={{ color: "var(--accent)" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-sm font-medium hover:underline"
                          style={{ color: "var(--danger)" }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12" style={{ color: "var(--t3)" }}>
                    <div className="text-4xl mb-4">👥</div>
                    <p className="text-lg mb-2">No users found</p>
                    <p className="mb-4">Invite your first team member to get started</p>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="btn-primary"
                    >
                      Invite User
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--t1)" }}>
              Invite New User
            </h2>
            
            <InviteUserForm 
              onClose={() => setShowInviteModal(false)}
              onSave={handleInviteUser}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InviteUserForm({ onClose, onSave }: { onClose: () => void; onSave: (user: any) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MARKETER");
  const [brands, setBrands] = useState<string[]>([]);

  const availableBrands = ["TechCorp", "RetailMax", "ServicePro"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      alert("Please enter an email address");
      return;
    }

    onSave({
      name: email.split('@')[0],
      email: email.trim(),
      role,
      brands: role === "AGENCY_ADMIN" ? ["All Brands"] : brands,
    });
  };

  const handleBrandToggle = (brand: string) => {
    setBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--t1)" }}>
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field w-full"
          placeholder="user@example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--t1)" }}>
          Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="input-field w-full"
          required
        >
          <option value="MARKETER">Marketer</option>
          <option value="AGENCY_ADMIN">Agency Admin</option>
        </select>
      </div>

      {role === "MARKETER" && (
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--t1)" }}>
            Assign Brands
          </label>
          <div className="space-y-2">
            {availableBrands.map((brand) => (
              <label key={brand} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={brands.includes(brand)}
                  onChange={() => handleBrandToggle(brand)}
                  className="rounded"
                />
                <span style={{ color: "var(--t1)" }}>{brand}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg font-medium transition-colors"
          style={{
            background: "var(--card)",
            color: "var(--t1)",
            border: "1px solid var(--border)"
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary px-6 py-2"
        >
          Send Invite
        </button>
      </div>
    </form>
  );
}
