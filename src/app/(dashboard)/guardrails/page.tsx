"use client";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import {
  GUARDRAIL_METRICS,
  GUARDRAIL_OPERATORS,
  type GuardrailRuleErrors,
  validateGuardrailRuleInput,
} from "@/lib/guardrail-rule-validation";
import styles from "./page.module.css";

const SEV_CLASS: Record<Rule["severity"], string> = {
  CRITICAL: styles.severityCritical,
  WARNING: styles.severityWarning,
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

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

export default function GuardrailsPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editRule, setEditRule] = useState<Rule | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<GuardrailRuleErrors>({});
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
    setErrors({});
    setFormError("");
    setOpen(true);
  }

  function openEdit(r: Rule) {
    setEditRule(r);
    setForm({ brandId: r.brandId, metric: r.metricKey, operator: r.operator, threshold: String(r.threshold), severity: r.severity });
    setErrors({});
    setFormError("");
    setOpen(true);
  }

  async function handleSave() {
    const validation = validateGuardrailRuleInput({
      brandId: form.brandId,
      metricKey: form.metric,
      operator: form.operator,
      threshold: form.threshold,
      severity: form.severity,
    });

    if (!validation.data) {
      setErrors(validation.errors);
      setFormError("Please correct the highlighted fields before saving this rule.");
      return;
    }

    setSaving(true);
    setErrors({});
    setFormError("");
    try {
      const res = await fetch("/api/alerts/rules", {
        method: editRule ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({
          ...(editRule ? { id: editRule.id } : {}),
          ...validation.data,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.fieldErrors) {
          setErrors(data.fieldErrors);
          setFormError(data.error ?? "Please correct the highlighted fields before saving this rule.");
          return;
        }
        throw new Error(data?.error ?? "Failed to save rule");
      }
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

      <div className={styles.statsGrid}>
        {[
          { label: "Total Rules", value: loading ? "-" : rules.length, className: styles.statPurple },
          { label: "Active", value: loading ? "-" : active, className: styles.statGreen },
          { label: "Critical Rules", value: loading ? "-" : critical, className: styles.statRed },
          { label: "Inactive", value: loading ? "-" : rules.length - active, className: styles.statMuted },
        ].map(st => (
          <div key={st.label} className={`dashboard-card ${styles.statCard}`}>
            <div className={`${styles.statValue} ${st.className}`}>{st.value}</div>
            <div className={styles.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      {msg && msg.startsWith("Failed") && <div className="dashboard-banner-error">{msg}</div>}

      <div className="dashboard-table-card">
        <div className={styles.tableTitle}>
          Rules
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loader} />
            <div className={styles.loadingText}>Loading rules...</div>
          </div>
        ) : rules.length === 0 ? (
          <div className={`dashboard-empty-state ${styles.emptyState}`}>
            <div className="dashboard-empty-icon"><ShieldIcon /></div>
            <div className="dashboard-empty-title">No rules yet</div>
            <div className="dashboard-empty-subtitle">Create your first guardrail to automatically watch for ROAS, spend, CTR, and other metric changes.</div>
          </div>
        ) : (
          <div className={styles.ruleList}>
            {rules.map(rule => {
              return (
                <div key={rule.id} className={`dashboard-card ${styles.ruleCard} ${rule.isActive ? "" : styles.ruleInactive}`}>
                  <div onClick={() => handleToggle(rule)} className={`${styles.toggle} ${rule.isActive ? styles.toggleActive : ""}`}>
                    <div className={styles.toggleKnob} />
                  </div>

                  <div className={styles.ruleMain}>
                    <span className={styles.ruleMetric}>{rule.metricKey?.toUpperCase() ?? rule.metric}</span>
                    <span className={styles.ruleCondition}>{rule.operator} {rule.threshold}</span>
                    <span className={`${styles.severityBadge} ${SEV_CLASS[rule.severity]}`}>
                      {rule.severity}
                    </span>
                    {rule.brand?.name && (
                      <span className={styles.brandBadge}>
                        {rule.brand.name}
                      </span>
                    )}
                  </div>

                  <span className={rule.isActive ? styles.activeText : styles.inactiveText}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </span>

                  <div className={styles.rowActions}>
                    <button onClick={() => openEdit(rule)} className={`btn-secondary ${styles.smallButton}`}>Edit</button>
                    <button onClick={() => setDelId(rule.id)} className={`btn-secondary ${styles.smallButton} ${styles.deleteButton}`}>Delete</button>
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
          <div className={styles.formStack}>
            {formError && (
              <div className={`dashboard-banner-error ${styles.formError}`}>
                {formError}
              </div>
            )}

            {showBrandSelect && (
              <div>
                <label className={styles.label}>Brand</label>
                <select className={styles.select} value={form.brandId} onChange={e => {
                  setForm(f => ({ ...f, brandId: e.target.value }));
                  setErrors(prev => ({ ...prev, brandId: undefined }));
                }}>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.brandId && <div className={styles.errorText}>{errors.brandId}</div>}
              </div>
            )}
            {!showBrandSelect && errors.brandId && <div className={styles.errorText}>{errors.brandId}</div>}

            <div>
              <label className={styles.label}>Metric</label>
              <select className={styles.select} value={form.metric} onChange={e => {
                setForm(f => ({ ...f, metric: e.target.value }));
                setErrors(prev => ({ ...prev, metricKey: undefined, threshold: undefined }));
              }}>
                {GUARDRAIL_METRICS.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
              {errors.metricKey && <div className={styles.errorText}>{errors.metricKey}</div>}
            </div>

            <div className={styles.twoCol}>
              <div>
                <label className={styles.label}>Operator</label>
                <select className={styles.select} value={form.operator} onChange={e => {
                  setForm(f => ({ ...f, operator: e.target.value }));
                  setErrors(prev => ({ ...prev, operator: undefined }));
                }}>
                  {GUARDRAIL_OPERATORS.map(o => <option key={o}>{o}</option>)}
                </select>
                {errors.operator && <div className={styles.errorText}>{errors.operator}</div>}
              </div>
              <div>
                <label className={styles.label}>Threshold</label>
                <input className={styles.input} type="number" placeholder="e.g. 2.5" value={form.threshold} onChange={e => {
                  setForm(f => ({ ...f, threshold: e.target.value }));
                  setErrors(prev => ({ ...prev, threshold: undefined }));
                }} />
                {errors.threshold && <div className={styles.errorText}>{errors.threshold}</div>}
              </div>
            </div>

            <div>
              <label className={styles.label}>Severity</label>
              <div className={styles.severityGrid}>
                {(["WARNING", "CRITICAL"] as const).map(sv => {
                  return (
                    <div key={sv} onClick={() => {
                      setForm(f => ({ ...f, severity: sv }));
                      setErrors(prev => ({ ...prev, severity: undefined }));
                    }} className={`${styles.severityOption} ${SEV_CLASS[sv]} ${form.severity === sv ? styles.severitySelected : ""}`}>
                      {sv}
                    </div>
                  );
                })}
              </div>
              {errors.severity && <div className={styles.errorText}>{errors.severity}</div>}
            </div>
          </div>

          <DialogFooter>
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className={`${styles.primaryDialogButton} ${saving ? styles.buttonSaving : ""}`}>
              {saving ? "Saving..." : editRule ? "Save Changes" : "Create Rule"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent className={styles.deleteDialog}>
          <DialogHeader
            icon={<span className={styles.deleteIcon}>!</span>}
            title="Delete Rule?"
            description="This rule will be permanently removed and alerts will stop triggering."
            onClose={() => setDelId(null)}
          />
          <DialogFooter>
            <button onClick={() => setDelId(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} className={styles.dangerDialogButton}>Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
