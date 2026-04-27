"use client";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";

const SEV_CFG: Record<string, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: "#dc2626", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.2)" },
  WARNING: { color: "#d97706", bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.2)" },
};

type Rule = {
  id: string;
  brandId: string;
  metric: string;
  metricKey: string;
  operator: string;
  threshold: number;
  severity: "WARNING" | "CRITICAL";
  isActive: boolean;
  brand?: { name: string };
};

const METRICS = ["spend", "roas", "ctr", "cpc", "cpa", "impressions", "clicks", "conversions"];
const OPERATORS = [">", "<", ">=", "<=", "=="];

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 12,
  border: "1px solid var(--border)", background: "#fff",
  fontSize: 14, color: "var(--t1)", outline: "none", boxSizing: "border-box",
};
const sel: React.CSSProperties = { ...inp, cursor: "pointer" };
const btn: React.CSSProperties = { padding: "9px 20px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "opacity .15s" };

export default function GuardrailsPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editRule, setEditRule] = useState<Rule | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    brandId: "", metric: "roas", operator: "<", threshold: "", severity: "WARNING",
  });

  const token = () => sessionStorage.getItem("access_token") ?? "";
  const userRaw = typeof window !== "undefined" ? sessionStorage.getItem("user") : null;
  const user = userRaw ? JSON.parse(userRaw) : null;
  const showBrandSelect =
    (user?.role === "AGENCY_ADMIN" && brands.length > 1) ||
    (user?.role === "MARKETER" && brands.length > 0);

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
        method: editRule ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({
          ...(editRule ? { id: editRule.id } : {}),
          brandId: form.brandId,
          metricKey: form.metric,
          operator: form.operator,
          threshold: Number(form.threshold),
          severity: form.severity,
        }),
      });
      if (!res.ok) throw new Error();
      setOpen(false);
      setMsg(editRule ? "Rule updated" : "Rule created");
      setTimeout(() => setMsg(""), 2500);
      await loadRules();
      window.dispatchEvent(new Event("alerts-refresh"));
    } catch {
      setMsg("Failed to save rule");
      setTimeout(() => setMsg(""), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(rule: Rule) {
    setRules(p => p.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
  }

  async function handleDelete() {
    if (!delId) return;
    try {
      const res = await fetch(`/api/alerts/rules?id=${encodeURIComponent(delId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setDelId(null);
      setMsg("Rule deleted");
      setTimeout(() => setMsg(""), 2500);
      await loadRules();
    } catch {
      setMsg("Failed to delete rule");
      setTimeout(() => setMsg(""), 2500);
    }
  }

  const active = rules.filter(r => r.isActive).length;
  const critical = rules.filter(r => r.severity === "CRITICAL").length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-copy">
          <div className="dashboard-eyebrow">GUARDRAILS</div>
          <h1 className="dashboard-title">Threshold rules</h1>
          <p className="dashboard-subtitle">Manage rule thresholds and alert triggers with the same controls used across the updated dashboard.</p>
        </div>
        <div className="dashboard-toolbar dashboard-toolbar-end">
          <button onClick={openNew} className="btn-primary">+ New Rule</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {[
          { label: "Total Rules", value: loading ? "-" : rules.length, color: "#5865f2" },
          { label: "Active", value: loading ? "-" : active, color: "#16a34a" },
          { label: "Critical Rules", value: loading ? "-" : critical, color: "#dc2626" },
          { label: "Inactive", value: loading ? "-" : rules.length - active, color: "#94a3b8" },
        ].map(st => (
          <div key={st.label} className="dashboard-card" style={{ padding: "18px 22px" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: st.color }}>{st.value}</div>
            <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 8 }}>{st.label}</div>
          </div>
        ))}
      </div>

      {msg && msg.startsWith("Failed") && <div className="dashboard-banner-error">{msg}</div>}

      <div className="dashboard-table-card">
        <div style={{ padding: "22px 24px", borderBottom: "1px solid var(--border)", fontSize: "18px", fontWeight: 800, color: "var(--t1)" }}>
          Rules
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "56px 0", color: "var(--t3)" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 13 }}>Loading rules...</div>
          </div>
        ) : rules.length === 0 ? (
          <div className="dashboard-empty-state" style={{ minHeight: "360px" }}>
            <div className="dashboard-empty-icon"><ShieldIcon /></div>
            <div className="dashboard-empty-title">No rules yet</div>
            <div className="dashboard-empty-subtitle">Create your first guardrail to automatically watch for ROAS, spend, CTR, and other metric changes.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "20px" }}>
            {rules.map(rule => {
              const sev = SEV_CFG[rule.severity];
              return (
                <div key={rule.id} className="dashboard-card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", background: rule.isActive ? "#fff" : "#f8fafc" }}>
                  <div onClick={() => handleToggle(rule)} style={{ width: 38, height: 22, borderRadius: 11, background: rule.isActive ? "#5865f2" : "#cbd5e1", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background .2s" }}>
                    <div style={{ position: "absolute", top: 3, left: rule.isActive ? 18 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{rule.metricKey?.toUpperCase() ?? rule.metric}</span>
                    <span style={{ color: "var(--t2)", fontSize: 14, margin: "0 8px" }}>{rule.operator} {rule.threshold}</span>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`, fontWeight: 700 }}>
                      {rule.severity}
                    </span>
                    {rule.brand?.name && (
                      <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, background: "rgba(88,101,242,0.08)", color: "#5865f2", border: "1px solid rgba(88,101,242,0.2)", fontWeight: 700, marginLeft: 8 }}>
                        {rule.brand.name}
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: 12, color: rule.isActive ? "#16a34a" : "#94a3b8", fontWeight: 700 }}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </span>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openEdit(rule)} className="btn-secondary" style={{ padding: "8px 14px" }}>Edit</button>
                    <button onClick={() => setDelId(rule.id)} className="btn-secondary" style={{ padding: "8px 14px", color: "#dc2626", borderColor: "rgba(220,38,38,.2)" }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            icon={<ShieldIcon />}
            title={editRule ? "Edit Rule" : "New Guardrail Rule"}
            description={editRule ? "Update the threshold settings" : "Set a threshold to trigger automatic alerts"}
            onClose={() => setOpen(false)}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {showBrandSelect && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6, display: "block" }}>Brand</label>
                <select style={sel} value={form.brandId} onChange={e => setForm(f => ({ ...f, brandId: e.target.value }))}>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6, display: "block" }}>Metric</label>
              <select style={sel} value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}>
                {METRICS.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6, display: "block" }}>Operator</label>
                <select style={sel} value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))}>
                  {OPERATORS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6, display: "block" }}>Threshold</label>
                <input style={inp} type="number" placeholder="e.g. 2.5" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8, display: "block" }}>Severity</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["WARNING", "CRITICAL"] as const).map(sv => {
                  const cfg = SEV_CFG[sv];
                  return (
                    <div key={sv} onClick={() => setForm(f => ({ ...f, severity: sv }))} style={{ padding: "12px 16px", borderRadius: 12, cursor: "pointer", textAlign: "center", border: `2px solid ${form.severity === sv ? cfg.color : "var(--border)"}`, background: form.severity === sv ? cfg.bg : "#fff", color: form.severity === sv ? cfg.color : "var(--t2)", fontWeight: 700, fontSize: 14, transition: "all .15s" }}>
                      {sv}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.threshold || !form.brandId} style={{ ...btn, background: "#5865f2", color: "#fff", opacity: saving || !form.threshold ? 0.6 : 1 }}>
              {saving ? "Saving..." : editRule ? "Save Changes" : "Create Rule"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent style={{ maxWidth: 400 }}>
          <DialogHeader
            icon={<span style={{ fontSize: 18 }}>!</span>}
            title="Delete Rule?"
            description="This rule will be permanently removed and alerts will stop triggering."
            onClose={() => setDelId(null)}
          />
          <DialogFooter>
            <button onClick={() => setDelId(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} style={{ ...btn, background: "#dc2626", color: "#fff" }}>Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
