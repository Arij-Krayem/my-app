"use client";
import { useState } from "react";

type Severity = "CRITICAL" | "WARNING";
type Operator = ">" | "<" | ">=" | "<=";
interface Rule { id: number; metric: string; operator: Operator; threshold: string; severity: Severity; active: boolean; }

const INIT: Rule[] = [
  { id: 1, metric: "ROAS",  operator: "<",  threshold: "2.5",    severity: "CRITICAL", active: true  },
  { id: 2, metric: "CTR",   operator: "<",  threshold: "1.5",    severity: "WARNING",  active: true  },
  { id: 3, metric: "CPC",   operator: ">",  threshold: "3",      severity: "WARNING",  active: false },
  { id: 4, metric: "Spend", operator: ">",  threshold: "$10,000", severity: "CRITICAL", active: true  },
];

const METRICS   = ["ROAS","CTR","CPC","CPA","Spend","Impressions","Clicks"];
const OPERATORS: Operator[] = [">","<",">=","<="];

export default function GuardrailsPage() {
  const [rules, setRules]     = useState<Rule[]>(INIT);
  const [showModal, setModal] = useState(false);
  const [form, setForm]       = useState<{ metric: string; operator: Operator; threshold: string; severity: Severity }>
    ({ metric: "ROAS", operator: "<", threshold: "", severity: "WARNING" });

  const toggle = (id: number) => setRules(r => r.map(x => x.id === id ? { ...x, active: !x.active } : x));
  const remove = (id: number) => setRules(r => r.filter(x => x.id !== id));
  const save   = () => {
    if (!form.threshold) return;
    setRules(r => [...r, { ...form, id: Date.now(), active: true }]);
    setModal(false);
    setForm({ metric: "ROAS", operator: "<", threshold: "", severity: "WARNING" });
  };

  const SEV = {
    CRITICAL: { color: "#f85149", bg: "rgba(248,81,73,0.1)", border: "rgba(248,81,73,0.25)" },
    WARNING:  { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)" },
  };

  const sel = { padding: "9px 12px", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "9px", color: "var(--t1)", fontSize: "14px", fontFamily: "inherit", outline: "none", width: "100%" };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>Guardrails</h1>
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>Automated alerts when metrics cross your thresholds</p>
        </div>
        <button onClick={() => setModal(true)} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#5865f2,#818cf8)", border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(88,101,242,0.35)", transition: "all 0.15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
          + New Rule
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Rules",   value: rules.length,                          color: "#5865f2", bg: "rgba(88,101,242,0.1)"  },
          { label: "Active",        value: rules.filter(r => r.active).length,    color: "#3fb950", bg: "rgba(63,185,80,0.1)"   },
          { label: "Critical Rules",value: rules.filter(r => r.severity==="CRITICAL").length, color: "#f85149", bg: "rgba(248,81,73,0.1)" },
        ].map(s => (
          <div key={s.label} style={{ padding: "16px 20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--t2)", fontWeight: "500" }}>{s.label}</span>
            <span style={{ fontSize: "22px", fontWeight: "700", color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 110px 80px 120px", gap: "0", padding: "14px 24px", background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
          {["Metric","Condition","Threshold","Severity","Active","Actions"].map(h => (
            <span key={h} style={{ fontSize: "11px", fontWeight: "700", color: "var(--t3)", letterSpacing: "0.8px", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>

        {rules.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🛡️</div>
            <p style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)", marginBottom: "4px" }}>No rules yet</p>
            <p style={{ fontSize: "13px", color: "var(--t2)" }}>Create your first guardrail to get started.</p>
          </div>
        ) : (
          rules.map((r, i) => {
            const sv = SEV[r.severity];
            return (
              <div key={r.id} style={{
                display: "grid", gridTemplateColumns: "1fr 80px 120px 110px 80px 120px",
                gap: "0", padding: "16px 24px", alignItems: "center",
                borderBottom: i < rules.length - 1 ? "1px solid var(--border)" : "none",
                background: r.active ? "transparent" : "rgba(0,0,0,0.1)",
                opacity: r.active ? 1 : 0.6, transition: "all 0.15s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: r.active ? "#3fb950" : "var(--t3)", flexShrink: 0 }} />
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)" }}>{r.metric}</span>
                </div>
                <span style={{ fontSize: "18px", fontWeight: "700", color: "var(--t2)", fontFamily: "monospace" }}>{r.operator}</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)", fontVariantNumeric: "tabular-nums" }}>{r.threshold}</span>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: sv.bg, color: sv.color, border: `1px solid ${sv.border}`, width: "fit-content" }}>{r.severity}</span>

                {/* Toggle */}
                <div onClick={() => toggle(r.id)} style={{ width: "40px", height: "22px", borderRadius: "11px", background: r.active ? "linear-gradient(135deg,#5865f2,#818cf8)" : "var(--border)", cursor: "pointer", position: "relative", transition: "all 0.2s", boxShadow: r.active ? "0 2px 8px rgba(88,101,242,0.4)" : "none" }}>
                  <div style={{ position: "absolute", top: "3px", left: r.active ? "21px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
                </div>

                {/* Delete */}
                <button onClick={() => remove(r.id)} style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(248,81,73,0.3)", background: "rgba(248,81,73,0.08)", color: "#f85149", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.15)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.08)"; }}>
                  Delete
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 60px rgba(0,0,0,0.4)", animation: "fadeUp 0.25s ease both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--t1)" }}>New Guardrail Rule</h2>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: "var(--t3)", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--t2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Metric</label>
                <select value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))} style={sel}>
                  {METRICS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--t2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Operator</label>
                  <select value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value as Operator }))} style={sel}>
                    {OPERATORS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--t2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Threshold</label>
                  <input value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} placeholder="e.g. 2.5" style={{ ...sel, padding: "9px 12px" }}
                    onFocus={e => { e.target.style.borderColor = "#5865f2"; e.target.style.boxShadow = "0 0 0 3px rgba(88,101,242,0.15)"; }}
                    onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--t2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Severity</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {(["WARNING","CRITICAL"] as Severity[]).map(s => {
                    const sv = SEV[s]; const active = form.severity === s;
                    return (
                      <div key={s} onClick={() => setForm(f => ({ ...f, severity: s }))} style={{ padding: "12px", borderRadius: "10px", border: `2px solid ${active ? sv.color : "var(--border)"}`, background: active ? sv.bg : "transparent", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: active ? sv.color : "var(--t2)" }}>{s}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button onClick={() => setModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--t2)", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>Cancel</button>
                <button onClick={save} style={{ flex: 2, padding: "12px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#5865f2,#818cf8)", color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(88,101,242,0.35)" }}>Save Rule</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}