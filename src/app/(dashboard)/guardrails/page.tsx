"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/ui/EmptyState";
import SectionHeader from "@/components/ui/SectionHeader";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import {
  badgeStyle,
  btnDanger,
  btnPrimary,
  btnSecondary,
  cardStyle,
  inputStyle,
  labelStyle,
} from "@/lib/styles";

type Severity = "CRITICAL" | "WARNING";

interface Rule {
  brand?: { name: string };
  brandId: string;
  id: string;
  isActive: boolean;
  metric: string;
  metricKey: string;
  operator: string;
  severity: Severity;
  threshold: number;
}

interface BrandOption {
  id: string;
  name: string;
}

interface RuleFormState {
  brandId: string;
  metric: string;
  operator: string;
  severity: Severity;
  threshold: string;
}

const METRICS = ["spend", "roas", "ctr", "cpc", "cpa", "impressions", "clicks", "conversions"];
const OPERATORS = [">", "<", ">=", "<=", "=="];

const SEVERITY_CONFIG: Record<Severity, { bg: string; border: string; color: string }> = {
  CRITICAL: { color: "#dc2626", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.2)" },
  WARNING: { color: "#d97706", bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.2)" },
};

function ShieldIcon(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export default function GuardrailsPage(): React.ReactElement {
  const [rules, setRules] = useState<Rule[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editRule, setEditRule] = useState<Rule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<RuleFormState>({
    brandId: "",
    metric: "roas",
    operator: "<",
    threshold: "",
    severity: "WARNING",
  });

  const token = useCallback(() => sessionStorage.getItem("access_token") ?? "", []);
  const user = useMemo(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("user");
    return raw ? (JSON.parse(raw) as { role: string }) : null;
  }, []);

  const notify = (text: string): void => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  };

  const loadRules = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch("/api/alerts/rules", {
        headers: { Authorization: `Bearer ${token()}` },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to load rules");

      const data = (await response.json()) as { items?: Rule[] };
      setRules(data.items ?? []);
    } catch {
      notify("Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadBrands = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/brands", {
        headers: { Authorization: `Bearer ${token()}` },
        credentials: "include",
      });
      if (!response.ok) return;

      const data = (await response.json()) as { items?: BrandOption[] };
      const items = data.items ?? [];
      setBrands(items);
      if (items[0]) {
        setForm((current) => ({ ...current, brandId: current.brandId || items[0].id }));
      }
    } catch {
      setBrands([]);
    }
  }, [token]);

  useEffect(() => {
    void loadRules();
    void loadBrands();
  }, [loadBrands, loadRules]);

  const openNew = (): void => {
    setEditRule(null);
    setForm({
      brandId: brands[0]?.id ?? "",
      metric: "roas",
      operator: "<",
      threshold: "",
      severity: "WARNING",
    });
    setOpen(true);
  };

  const openEdit = (rule: Rule): void => {
    setEditRule(rule);
    setForm({
      brandId: rule.brandId,
      metric: rule.metricKey,
      operator: rule.operator,
      threshold: String(rule.threshold),
      severity: rule.severity,
    });
    setOpen(true);
  };

  const handleSave = async (): Promise<void> => {
    if (!form.threshold || !form.brandId) return;

    setSaving(true);
    try {
      const response = await fetch("/api/alerts/rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        credentials: "include",
        body: JSON.stringify({
          brandId: form.brandId,
          metricKey: form.metric,
          operator: form.operator,
          threshold: Number(form.threshold),
          severity: form.severity,
        }),
      });

      if (!response.ok) throw new Error("Failed to save rule");

      setOpen(false);
      notify(editRule ? "Rule updated" : "Rule created");
      await loadRules();
    } catch {
      notify("Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (rule: Rule): void => {
    setRules((current) =>
      current.map((item) => (item.id === rule.id ? { ...item, isActive: !item.isActive } : item)),
    );
  };

  const handleDelete = (): void => {
    setRules((current) => current.filter((rule) => rule.id !== deleteId));
    setDeleteId(null);
    notify("Rule deleted");
  };

  const activeRules = rules.filter((rule) => rule.isActive).length;
  const criticalRules = rules.filter((rule) => rule.severity === "CRITICAL").length;

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader
        title="Alert Rules"
        subtitle="Manage thresholds and severity levels for automatic monitoring."
        action={
          <button onClick={openNew} style={btnPrimary}>
            + New Rule
          </button>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Rules", value: loading ? "..." : rules.length, color: "#5865f2" },
          { label: "Active", value: loading ? "..." : activeRules, color: "#16a34a" },
          { label: "Critical Rules", value: loading ? "..." : criticalRules, color: "#dc2626" },
          { label: "Inactive", value: loading ? "..." : rules.length - activeRules, color: "#94a3b8" },
        ].map((stat) => (
          <div key={stat.label} style={{ ...cardStyle, padding: "18px 22px" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {message ? (
        <div
          style={{
            background: message.startsWith("Failed") ? "rgba(220,38,38,.08)" : "rgba(22,163,74,.08)",
            border: `1px solid ${message.startsWith("Failed") ? "rgba(220,38,38,.25)" : "rgba(22,163,74,.25)"}`,
            borderRadius: 9,
            padding: "10px 16px",
            marginBottom: 16,
            color: message.startsWith("Failed") ? "#dc2626" : "#16a34a",
            fontSize: 14,
          }}
        >
          {message}
        </div>
      ) : null}

      <div style={{ ...cardStyle, padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 18 }}>Rules ({loading ? "..." : rules.length})</div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--t3)" }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "3px solid #e8edf2",
                borderTopColor: "#5865f2",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <div style={{ fontSize: 13 }}>Loading rules...</div>
          </div>
        ) : rules.length === 0 ? (
          <EmptyState
            title="No rules yet"
            subtitle='Click "+ New Rule" to create your first guardrail.'
            icon={<ShieldIcon />}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rules.map((rule) => {
              const severity = SEVERITY_CONFIG[rule.severity];

              return (
                <div
                  key={rule.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 16px",
                    borderRadius: 10,
                    border: "1px solid #e8edf2",
                    background: rule.isActive ? "#ffffff" : "#f8fafc",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(rule)}
                    style={{
                      width: 38,
                      height: 22,
                      borderRadius: 11,
                      background: rule.isActive ? "#5865f2" : "#cbd5e1",
                      cursor: "pointer",
                      position: "relative",
                      flexShrink: 0,
                      transition: "background .2s",
                      border: "none",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 3,
                        left: rule.isActive ? 18 : 3,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "#ffffff",
                        transition: "left .2s",
                      }}
                    />
                  </button>

                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{rule.metricKey?.toUpperCase() ?? rule.metric}</span>
                    <span style={{ color: "var(--t2)", fontSize: 14, margin: "0 8px" }}>
                      {rule.operator} {rule.threshold}
                    </span>
                    <span style={{ ...badgeStyle, background: severity.bg, color: severity.color, border: `1px solid ${severity.border}` }}>
                      {rule.severity}
                    </span>
                    {rule.brand?.name ? (
                      <span
                        style={{
                          ...badgeStyle,
                          marginLeft: 8,
                          background: "rgba(88,101,242,0.08)",
                          color: "#5865f2",
                          border: "1px solid rgba(88,101,242,0.2)",
                        }}
                      >
                        {rule.brand.name}
                      </span>
                    ) : null}
                  </div>

                  <span style={{ fontSize: 12, color: rule.isActive ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </span>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openEdit(rule)} style={{ ...btnSecondary, padding: "7px 14px", fontSize: 13 }}>
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(rule.id)} style={{ ...btnDanger, padding: "7px 14px", fontSize: 13 }}>
                      Delete
                    </button>
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
            {user?.role === "AGENCY_ADMIN" && brands.length > 1 ? (
              <div>
                <label style={labelStyle}>Brand</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.brandId}
                  onChange={(event) => setForm((current) => ({ ...current, brandId: event.target.value }))}
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label style={labelStyle}>Metric</label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={form.metric}
                onChange={(event) => setForm((current) => ({ ...current, metric: event.target.value }))}
              >
                {METRICS.map((metric) => (
                  <option key={metric} value={metric}>
                    {metric.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Operator</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.operator}
                  onChange={(event) => setForm((current) => ({ ...current, operator: event.target.value }))}
                >
                  {OPERATORS.map((operator) => (
                    <option key={operator}>{operator}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Threshold</label>
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="e.g. 2.5"
                  value={form.threshold}
                  onChange={(event) => setForm((current) => ({ ...current, threshold: event.target.value }))}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Severity</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["WARNING", "CRITICAL"] as const).map((severity) => {
                  const config = SEVERITY_CONFIG[severity];
                  const active = form.severity === severity;

                  return (
                    <button
                      key={severity}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, severity }))}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 10,
                        cursor: "pointer",
                        textAlign: "center",
                        border: `2px solid ${active ? config.color : "#e2e8f0"}`,
                        background: active ? config.bg : "#f8fafc",
                        color: active ? config.color : "#64748b",
                        fontWeight: 600,
                        fontSize: 14,
                        transition: "all .15s",
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
            <button onClick={() => setOpen(false)} style={btnSecondary}>
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving || !form.threshold || !form.brandId}
              style={{ ...btnPrimary, opacity: saving || !form.threshold || !form.brandId ? 0.6 : 1 }}
            >
              {saving ? "Saving..." : editRule ? "Save Changes" : "Create Rule"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent style={{ maxWidth: 400 }}>
          <DialogHeader
            icon={<span style={{ fontSize: 18 }}>!</span>}
            title="Delete Rule?"
            description="This rule will be permanently removed and alerts will stop triggering."
            onClose={() => setDeleteId(null)}
          />
          <DialogFooter>
            <button onClick={() => setDeleteId(null)} style={btnSecondary}>
              Cancel
            </button>
            <button onClick={handleDelete} style={btnDanger}>
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
