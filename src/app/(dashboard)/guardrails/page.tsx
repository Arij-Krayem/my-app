"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/apiFetch";
import {
  cardStyle,
  emptyIconWrapStyle,
  emptyStateWrapStyle,
  emptySubtitleStyle,
  emptyTitleStyle,
  metricCardStyle,
  pageEyebrowStyle,
  pageSubtitleStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  subtleInputStyle,
  tableCellStyle,
  tableHeaderRowStyle,
  tableHeadingStyle,
  pillStyle,
} from "@/components/dashboard/designSystem";

const SEV_CFG: Record<string, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: "#dc2626", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
  WARNING: { color: "#d97706", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
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
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const inputLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: 8,
  color: "var(--text-muted)",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

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
    brandId: "",
    metric: "roas",
    operator: "<",
    threshold: "",
    severity: "WARNING",
  });

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ items?: Rule[] }>("/api/alerts/rules");
      const items = Array.isArray(data.items) ? data.items : [];
      setRules(items);
      setMsg("");
    } catch (error) {
      console.error("[guardrails] loadRules error", error);
      setMsg(error instanceof Error ? error.message : "Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBrands = useCallback(async () => {
    try {
      const data = await apiFetch<{ items?: { id: string; name: string }[] }>("/api/brands");
      const list = data.items ?? [];
      setBrands(list);
      if (list.length > 0) {
        setForm((current) => ({
          ...current,
          brandId: current.brandId || list[0].id,
        }));
      }
    } catch (error) {
      console.error("[guardrails] loadBrands error", error);
    }
  }, []);

  useEffect(() => {
    void loadRules();
    void loadBrands();
  }, [loadBrands, loadRules]);

  function openNew() {
    setEditRule(null);
    setForm({ brandId: brands[0]?.id ?? "", metric: "roas", operator: "<", threshold: "", severity: "WARNING" });
    setOpen(true);
  }

  function openEdit(rule: Rule) {
    setEditRule(rule);
    setForm({
      brandId: rule.brandId,
      metric: rule.metricKey,
      operator: rule.operator,
      threshold: String(rule.threshold),
      severity: rule.severity,
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.threshold || !form.brandId) return;
    setSaving(true);
    try {
      const payload = {
        brandId: form.brandId,
        metricKey: form.metric,
        operator: form.operator,
        threshold: Number(form.threshold),
        severity: form.severity,
      };

      if (editRule) {
        await apiFetch(`/api/alerts/rules/${editRule.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/alerts/rules", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setOpen(false);
      setMsg(editRule ? "Rule updated" : "Rule created");
      setTimeout(() => setMsg(""), 2500);
      await loadRules();
    } catch (error) {
      console.error("[guardrails] handleSave error", error);
      setMsg(error instanceof Error ? error.message : "Failed to save rule");
      setTimeout(() => setMsg(""), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(rule: Rule) {
    try {
      const data = await apiFetch<{ rule: Rule }>(`/api/alerts/rules/${rule.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !rule.isActive }),
      });

      setRules((previous) =>
        previous.map((item) => (item.id === rule.id ? data.rule : item))
      );
      setMsg(`Rule ${data.rule.isActive ? "activated" : "deactivated"}`);
      setTimeout(() => setMsg(""), 2000);
    } catch (error) {
      console.error("[guardrails] handleToggle error", error);
      setMsg(error instanceof Error ? error.message : "Failed to update rule");
      setTimeout(() => setMsg(""), 2500);
    }
  }

  async function handleDelete() {
    if (!delId) return;
    try {
      await apiFetch(`/api/alerts/rules/${delId}`, {
        method: "DELETE",
      });
      setRules((previous) => previous.filter((item) => item.id !== delId));
      setDelId(null);
      setMsg("Rule deleted");
      setTimeout(() => setMsg(""), 2500);
    } catch (error) {
      console.error("[guardrails] handleDelete error", error);
      setMsg(error instanceof Error ? error.message : "Failed to delete rule");
      setTimeout(() => setMsg(""), 2500);
    }
  }

  const active = rules.filter((rule) => rule.isActive).length;
  const critical = rules.filter((rule) => rule.severity === "CRITICAL").length;
  const inactive = rules.length - active;

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <div style={pageEyebrowStyle}>Guardrails</div>
          <p style={pageSubtitleStyle}>Manage rule thresholds and alert triggers with the same controls used across the updated dashboard.</p>
        </div>
        <button type="button" onClick={openNew} style={primaryButtonStyle}>
          + New Rule
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Rules", value: loading ? "--" : rules.length, color: "#4f46e5" },
          { label: "Active", value: loading ? "--" : active, color: "#16a34a" },
          { label: "Critical Rules", value: loading ? "--" : critical, color: "#dc2626" },
          { label: "Inactive", value: loading ? "--" : inactive, color: "#94a3b8" },
        ].map((item) => (
          <div key={item.label} style={metricCardStyle}>
            <div style={{ color: item.color, fontSize: 28, fontWeight: 700 }}>{item.value}</div>
            <div style={{ marginTop: 6, color: "#64748b", fontSize: 13 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div
          style={{
            ...cardStyle,
            marginBottom: 16,
            padding: "14px 16px",
            background: msg.startsWith("Failed") ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)",
            borderColor: msg.startsWith("Failed") ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
            color: msg.startsWith("Failed") ? "#dc2626" : "#15803d",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {msg}
        </div>
      )}

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(15,23,42,0.06)", color: "#0f172a", fontSize: 16, fontWeight: 700 }}>
          Rules
        </div>

        {loading ? (
          <div style={emptyStateWrapStyle}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.12)", borderTopColor: "#6366F1", animation: "spin 0.8s linear infinite" }} />
            <p style={{ ...emptySubtitleStyle, marginTop: 18 }}>Loading rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div style={emptyStateWrapStyle}>
            <div style={emptyIconWrapStyle}>
              <ShieldIcon />
            </div>
            <h2 style={emptyTitleStyle}>No rules yet</h2>
            <p style={emptySubtitleStyle}>Create your first guardrail to automatically watch for ROAS, spend, CTR, and other metric changes.</p>
            <button type="button" onClick={openNew} style={{ ...primaryButtonStyle, marginTop: 20 }}>
              Create your first rule
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  {["Metric", "Condition", "Severity", "Brand", "Status", "Actions"].map((heading) => (
                    <th key={heading} style={tableHeadingStyle}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, index) => {
                  const sev = SEV_CFG[rule.severity];
                  return (
                    <tr
                      key={rule.id}
                      style={{ background: index % 2 === 0 ? "#fff" : "#fcfcff" }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.background = "rgba(99,102,241,0.03)";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#fcfcff";
                      }}
                    >
                      <td style={tableCellStyle}>
                        <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 600 }}>{rule.metricKey?.toUpperCase() ?? rule.metric}</div>
                      </td>
                      <td style={tableCellStyle}>{rule.operator} {rule.threshold}</td>
                      <td style={tableCellStyle}>
                        <span style={pillStyle(sev.color, sev.bg, sev.border)}>{rule.severity}</span>
                      </td>
                      <td style={tableCellStyle}>
                        {rule.brand?.name ? <span style={pillStyle("#4f46e5", "rgba(99,102,241,0.1)", "rgba(99,102,241,0.2)")}>{rule.brand.name}</span> : "Unassigned"}
                      </td>
                      <td style={tableCellStyle}>
                        <button
                          type="button"
                          onClick={() => void handleToggle(rule)}
                          style={{
                            ...secondaryButtonStyle,
                            padding: "8px 14px",
                            fontSize: 12,
                            borderColor: rule.isActive ? "rgba(34,197,94,0.2)" : "rgba(148,163,184,0.24)",
                            background: rule.isActive ? "rgba(34,197,94,0.08)" : "#fff",
                            color: rule.isActive ? "#16a34a" : "#64748b",
                          }}
                        >
                          {rule.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button type="button" onClick={() => openEdit(rule)} style={{ ...secondaryButtonStyle, padding: "8px 12px", fontSize: 12 }}>
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDelId(rule.id)}
                            style={{
                              ...secondaryButtonStyle,
                              padding: "8px 12px",
                              fontSize: 12,
                              borderColor: "rgba(239,68,68,0.2)",
                              background: "rgba(239,68,68,0.08)",
                              color: "#dc2626",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ maxWidth: 560 }}>
          <DialogHeader
            icon={<ShieldIcon />}
            title={editRule ? "Edit Rule" : "New Guardrail Rule"}
            description={editRule ? "Update the threshold settings" : "Set a threshold to trigger automatic alerts"}
            onClose={() => setOpen(false)}
          />

          <div style={{ display: "grid", gap: 16, padding: "20px 24px 0" }}>
            <div>
              <label style={inputLabelStyle}>Brand</label>
              <select style={{ ...subtleInputStyle, minHeight: 46 }} value={form.brandId} onChange={(event) => setForm((current) => ({ ...current, brandId: event.target.value }))}>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={inputLabelStyle}>Metric</label>
              <select style={{ ...subtleInputStyle, minHeight: 46 }} value={form.metric} onChange={(event) => setForm((current) => ({ ...current, metric: event.target.value }))}>
                {METRICS.map((metric) => (
                  <option key={metric} value={metric}>
                    {metric.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={inputLabelStyle}>Operator</label>
                <select style={{ ...subtleInputStyle, minHeight: 46 }} value={form.operator} onChange={(event) => setForm((current) => ({ ...current, operator: event.target.value }))}>
                  {OPERATORS.map((operator) => (
                    <option key={operator}>{operator}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={inputLabelStyle}>Threshold</label>
                <input style={{ ...subtleInputStyle, minHeight: 46 }} type="number" placeholder="e.g. 2.5" value={form.threshold} onChange={(event) => setForm((current) => ({ ...current, threshold: event.target.value }))} />
              </div>
            </div>

            <div>
              <label style={inputLabelStyle}>Severity</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["WARNING", "CRITICAL"] as const).map((severity) => {
                  const cfg = SEV_CFG[severity];
                  const activeSeverity = form.severity === severity;
                  return (
                    <button
                      key={severity}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, severity }))}
                      style={{
                        minHeight: 46,
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: `1px solid ${activeSeverity ? cfg.border : severity === "WARNING" ? "rgba(217,119,6,0.28)" : "rgba(220,38,38,0.28)"}`,
                        background: activeSeverity ? cfg.color : "#fff",
                        color: activeSeverity ? "#fff" : cfg.color,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {severity}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)} style={secondaryButtonStyle}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !form.threshold || !form.brandId}
              style={{ ...primaryButtonStyle, opacity: saving || !form.threshold || !form.brandId ? 0.65 : 1 }}
            >
              {saving ? "Saving..." : editRule ? "Save Changes" : "Create Rule"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
          <DialogContent style={{ maxWidth: 400 }}>
          <DialogHeader
            icon={<ShieldIcon />}
            title="Delete Rule?"
            description="This rule will be permanently removed and alerts will stop triggering."
            onClose={() => setDelId(null)}
          />
          <DialogFooter>
            <button type="button" onClick={() => setDelId(null)} style={secondaryButtonStyle}>
              Cancel
            </button>
            <button type="button" onClick={() => void handleDelete()} style={{ ...primaryButtonStyle, background: "var(--critical)", boxShadow: "none" }}>
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
