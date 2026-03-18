"use client";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";

const SEV_CFG: Record<string, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: "#dc2626", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.2)" },
  WARNING:  { color: "#d97706", bg: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.2)"  },
};

type Rule = {
  id:        string;
  brandId:   string;
  metric:    string;
  metricKey: string;
  operator:  string;
  threshold: number;
  severity:  "WARNING" | "CRITICAL";
  isActive:  boolean;
  brand?:    { name: string };
};

const METRICS   = ["spend","roas","ctr","cpc","cpa","impressions","clicks","conversions"];
const OPERATORS = [">", "<", ">=", "<=", "=="];

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1.5px solid #e2e8f0", background: "#f8fafc",
  fontSize: 14, color: "#1e293b", outline: "none", boxSizing: "border-box",
};
const sel: React.CSSProperties = { ...inp, cursor: "pointer" };
const btn: React.CSSProperties = { padding: "9px 20px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "opacity .15s" };

export default function GuardrailsPage() {
  const [rules,     setRules]     = useState<Rule[]>([]);
  const [brands,    setBrands]    = useState<{ id: string; name: string }[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [open,      setOpen]      = useState(false);
  const [editRule,  setEditRule]  = useState<Rule | null>(null);
  const [delId,     setDelId]     = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState("");
  const [form, setForm] = useState({
    brandId: "", metric: "roas", operator: "<", threshold: "", severity: "WARNING",
  });

  const token = () => sessionStorage.getItem("access_token") ?? "";
  const userRaw = typeof window !== "undefined" ? sessionStorage.getItem("user") : null;
  const user = userRaw ? JSON.parse(userRaw) : null;

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts/rules", {
        headers: { Authorization: `Bearer ${token()}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRules(data.items ?? []);
    } catch {
      setMsg("Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBrands = useCallback(async () => {
    try {
      const res = await fetch("/api/brands", {
        headers: { Authorization: `Bearer ${token()}` },
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = data.items ?? [];
      setBrands(list);
      if (list.length > 0) setForm(f => ({ ...f, brandId: list[0].id }));
    } catch {}
  }, []);

  useEffect(() => {
    loadRules();
    loadBrands();
  }, [loadRules, loadBrands]);

  function openNew() {
    setEditRule(null);
    setForm({ brandId: brands[0]?.id ?? "", metric: "roas", operator: "<", threshold: "", severity: "WARNING" });
    setOpen(true);
  }

  function openEdit(r: Rule) {
    setEditRule(r);
    setForm({ brandId: r.brandId, metric: r.metricKey, operator: r.operator, threshold: String(r.threshold), severity: r.severity });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.threshold || !form.brandId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/alerts/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({
          brandId:   form.brandId,
          metricKey: form.metric,
          operator:  form.operator,
          threshold: Number(form.threshold),
          severity:  form.severity,
        }),
      });
      if (!res.ok) throw new Error();
      setOpen(false);
      setMsg(editRule ? "Rule updated" : "Rule created");
      setTimeout(() => setMsg(""), 2500);
      await loadRules();
    } catch {
      setMsg("Failed to save rule");
      setTimeout(() => setMsg(""), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(rule: Rule) {
    // For now toggle locally — a PATCH /api/alerts/rules/[id] can be added later
    setRules(p => p.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
  }

  async function handleDelete() {
    if (!delId) return;
    try {
      // Remove locally for now — DELETE /api/alerts/rules/[id] can be added later
      setRules(p => p.filter(r => r.id !== delId));
      setDelId(null);
      setMsg("Rule deleted");
      setTimeout(() => setMsg(""), 2500);
    } catch {}
  }

  const active   = rules.filter(r => r.isActive).length;
  const critical = rules.filter(r => r.severity === "CRITICAL").length;

  return (
    <div style={{ padding: 32, fontFamily: "'Outfit',sans-serif", color: "#1e293b" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Guardrails</h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Manage threshold rules and alert triggers</p>
        </div>
        <button onClick={openNew} style={{ ...btn, background: "linear-gradient(135deg,#5865f2,#818cf8)", color: "#fff" }}>
          + New Rule
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Rules",    value: loading ? "—" : rules.length,              color: "#5865f2" },
          { label: "Active",         value: loading ? "—" : active,                    color: "#16a34a" },
          { label: "Critical Rules", value: loading ? "—" : critical,                  color: "#dc2626" },
          { label: "Inactive",       value: loading ? "—" : rules.length - active,     color: "#94a3b8" },
        ].map(st => (
          <div key={st.label} style={{ background: "#fff", border: "1px solid #e8edf2", borderRadius: 14, padding: "18px 22px" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: st.color }}>{st.value}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{st.label}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{
          background: msg.startsWith("Failed") ? "rgba(220,38,38,.08)" : "rgba(22,163,74,.08)",
          border: `1px solid ${msg.startsWith("Failed") ? "rgba(220,38,38,.25)" : "rgba(22,163,74,.25)"}`,
          borderRadius: 9, padding: "10px 16px", marginBottom: 16,
          color: msg.startsWith("Failed") ? "#dc2626" : "#16a34a", fontSize: 14,
        }}>
          {msg.startsWith("Failed") ? "✗" : "✓"} {msg}
        </div>
      )}

      {/* Rules list */}
      <div style={{ background: "#fff", border: "1px solid #e8edf2", borderRadius: 14, padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 18 }}>
          Rules ({loading ? "…" : rules.length})
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid #e8edf2", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 13 }}>Loading rules…</div>
          </div>
        ) : rules.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No rules yet</div>
            <div style={{ fontSize: 13 }}>Click "+ New Rule" to get started</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rules.map(rule => {
              const sev = SEV_CFG[rule.severity];
              return (
                <div key={rule.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", borderRadius: 10, border: "1px solid #e8edf2", background: rule.isActive ? "#fff" : "#f8fafc" }}>
                  {/* Toggle */}
                  <div onClick={() => handleToggle(rule)}
                    style={{ width: 38, height: 22, borderRadius: 11, background: rule.isActive ? "#5865f2" : "#cbd5e1", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background .2s" }}>
                    <div style={{ position: "absolute", top: 3, left: rule.isActive ? 18 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{rule.metricKey?.toUpperCase() ?? rule.metric}</span>
                    <span style={{ color: "#64748b", fontSize: 14, margin: "0 8px" }}>{rule.operator} {rule.threshold}</span>
                    <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`, fontWeight: 600 }}>
                      {rule.severity}
                    </span>
                    {rule.brand?.name && (
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "rgba(88,101,242,0.08)", color: "#5865f2", border: "1px solid rgba(88,101,242,0.2)", fontWeight: 600, marginLeft: 8 }}>
                        {rule.brand.name}
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: 12, color: rule.isActive ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </span>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openEdit(rule)} style={{ ...btn, padding: "7px 14px", background: "#f1f5f9", color: "#475569", fontSize: 13 }}>Edit</button>
                    <button onClick={() => setDelId(rule.id)} style={{ ...btn, padding: "7px 14px", background: "rgba(220,38,38,.08)", color: "#dc2626", fontSize: 13 }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New / Edit Rule Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            icon={<ShieldIcon />}
            title={editRule ? "Edit Rule" : "New Guardrail Rule"}
            description={editRule ? "Update the threshold settings" : "Set a threshold to trigger automatic alerts"}
            onClose={() => setOpen(false)}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Brand selector (admin only) */}
            {user?.role === "AGENCY_ADMIN" && brands.length > 1 && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6, display: "block" }}>Brand</label>
                <select style={sel} value={form.brandId} onChange={e => setForm(f => ({ ...f, brandId: e.target.value }))}>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6, display: "block" }}>Metric</label>
              <select style={sel} value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}>
                {METRICS.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6, display: "block" }}>Operator</label>
                <select style={sel} value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))}>
                  {OPERATORS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6, display: "block" }}>Threshold</label>
                <input style={inp} type="number" placeholder="e.g. 2.5" value={form.threshold}
                  onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8, display: "block" }}>Severity</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["WARNING", "CRITICAL"] as const).map(sv => {
                  const cfg = SEV_CFG[sv];
                  return (
                    <div key={sv} onClick={() => setForm(f => ({ ...f, severity: sv }))}
                      style={{
                        padding: "12px 16px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                        border: `2px solid ${form.severity === sv ? cfg.color : "#e2e8f0"}`,
                        background: form.severity === sv ? cfg.bg : "#f8fafc",
                        color: form.severity === sv ? cfg.color : "#64748b",
                        fontWeight: 600, fontSize: 14, transition: "all .15s",
                      }}>
                      {sv}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <button onClick={() => setOpen(false)} style={{ ...btn, background: "#f1f5f9", color: "#475569" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.threshold || !form.brandId}
              style={{ ...btn, background: "linear-gradient(135deg,#5865f2,#818cf8)", color: "#fff", opacity: saving || !form.threshold ? 0.6 : 1 }}>
              {saving ? "Saving…" : editRule ? "Save Changes" : "Create Rule"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent style={{ maxWidth: 400 }}>
          <DialogHeader
            icon={<span style={{ fontSize: 18 }}>🗑</span>}
            title="Delete Rule?"
            description="This rule will be permanently removed and alerts will stop triggering."
            onClose={() => setDelId(null)}
          />
          <DialogFooter>
            <button onClick={() => setDelId(null)} style={{ ...btn, background: "#f1f5f9", color: "#475569" }}>Cancel</button>
            <button onClick={handleDelete} style={{ ...btn, background: "#dc2626", color: "#fff" }}>Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}