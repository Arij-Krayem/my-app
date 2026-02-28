"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/apiFetch";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "LOST";
  source?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

const STATUS_COLORS: Record<Lead["status"], { bg: string; text: string }> = {
  NEW:       { bg: "rgba(108,99,255,0.15)", text: "#6c63ff" },
  CONTACTED: { bg: "rgba(251,191,36,0.15)", text: "#f59e0b" },
  QUALIFIED: { bg: "rgba(16,185,129,0.15)", text: "#10b981" },
  LOST:      { bg: "rgba(244,63,94,0.15)",  text: "#f43f5e" },
};

const EMPTY: { name:string; email:string; phone:string; status:Lead["status"]; source:string; notes:string } =
  { name:"", email:"", phone:"", status:"NEW", source:"", notes:"" };

export default function LeadsPage() {
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [debouncedQ, setDQ]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Lead | null>(null);
  const [form, setForm]           = useState({ ...EMPTY });
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const t = setTimeout(() => { setDQ(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        ...(debouncedQ ? { q: debouncedQ } : {}),
      });
      const data = await apiFetch<LeadsResponse>(`/api/leads?${params}`);
      setLeads(data.leads);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  function openCreate() { setEditing(null); setForm({ ...EMPTY }); setModalOpen(true); }
  function openEdit(lead: Lead) {
    setEditing(lead);
    setForm({ name:lead.name, email:lead.email, phone:lead.phone ?? "", status:lead.status, source:lead.source ?? "", notes:lead.notes ?? "" });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/leads/${editing.id}`, { method:"PATCH", body:JSON.stringify(form) });
      } else {
        await apiFetch("/api/leads", { method:"POST", body:JSON.stringify(form) });
      }
      setModalOpen(false);
      fetchLeads();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/api/leads/${id}`, { method:"DELETE" });
      setDeleteId(null);
      fetchLeads();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    :root{--surface:#13161b;--surface2:#1a1e25;--border:#242830;--accent:#6c63ff;--adim:rgba(108,99,255,0.15);--text:#e8eaf0;--muted:#6b7280;--danger:#f43f5e;--font:'Plus Jakarta Sans',sans-serif;}
    .lr{font-family:var(--font);color:var(--text);}
    .ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;}
    .pt{font-size:22px;font-weight:800;letter-spacing:-0.4px;}
    .ps{font-size:13px;color:var(--muted);margin-top:2px;}
    .tb{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;}
    .sw{position:relative;flex:1;min-width:200px;max-width:360px;}
    .sb{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:9px 14px 9px 38px;color:var(--text);font-family:var(--font);font-size:14px;outline:none;transition:border-color .15s;}
    .sb:focus{border-color:var(--accent);}
    .si{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none;}
    .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;border:none;font-family:var(--font);font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;}
    .bp{background:var(--accent);color:#fff;}.bp:hover{background:#5a52e0;}
    .bg{background:var(--surface2);color:var(--muted);border:1px solid var(--border);}.bg:hover{color:var(--text);}
    .bd{background:rgba(244,63,94,.12);color:var(--danger);border:1px solid rgba(244,63,94,.2);}.bd:hover{background:rgba(244,63,94,.22);}
    .bsm{padding:6px 12px;font-size:12px;}
    .btn:disabled{opacity:.5;cursor:not-allowed;}
    .tw{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;}
    table{width:100%;border-collapse:collapse;}
    thead th{padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;background:var(--surface2);border-bottom:1px solid var(--border);}
    tbody tr{border-bottom:1px solid var(--border);transition:background .1s;}
    tbody tr:last-child{border-bottom:none;}
    tbody tr:hover{background:var(--surface2);}
    td{padding:13px 16px;font-size:14px;vertical-align:middle;}
    .tn{font-weight:600;color:var(--text);}
    .tm{color:var(--muted);font-size:13px;}
    .badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;}
    .acts{display:flex;gap:6px;}
    .empty{text-align:center;padding:60px 20px;color:var(--muted);font-size:14px;}
    .ei{font-size:36px;margin-bottom:12px;}
    .pg{display:flex;align-items:center;justify-content:space-between;margin-top:20px;flex-wrap:wrap;gap:12px;}
    .pgi{font-size:13px;color:var(--muted);}
    .pgb{display:flex;gap:6px;}
    .pb{width:34px;height:34px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--muted);display:flex;align-items:center;justify-content:center;font-family:var(--font);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;}
    .pb:hover:not(:disabled){border-color:var(--accent);color:var(--accent);}
    .pb.active{background:var(--accent);border-color:var(--accent);color:#fff;}
    .pb:disabled{opacity:.4;cursor:not-allowed;}
    .ov{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;}
    .mo{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:32px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;}
    .mt{font-size:18px;font-weight:800;margin-bottom:24px;letter-spacing:-.3px;}
    .fg{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    .ff{grid-column:1/-1;}
    .fl{font-size:12px;font-weight:600;color:var(--muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em;}
    .fi,.fs,.fta{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:9px;padding:10px 12px;color:var(--text);font-family:var(--font);font-size:14px;outline:none;transition:border-color .15s;}
    .fi:focus,.fs:focus,.fta:focus{border-color:var(--accent);}
    .fs option{background:var(--surface2);}
    .fta{resize:vertical;min-height:80px;}
    .mf{display:flex;gap:10px;justify-content:flex-end;margin-top:24px;}
    .eb{background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.25);border-radius:10px;padding:12px 16px;color:var(--danger);font-size:13px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:10px;}
    .cb{text-align:center;padding:8px 0 16px;}
    .ci{font-size:40px;margin-bottom:12px;}
    .ct{font-size:17px;font-weight:700;margin-bottom:6px;}
    .cd{font-size:13px;color:var(--muted);}
  `;

  return (
    <>
      <style>{css}</style>
      <div className="lr">
        <div className="ph">
          <div>
            <div className="pt">Leads</div>
            <div className="ps">{total} total lead{total !== 1 ? "s" : ""}</div>
          </div>
          <button className="btn bp" onClick={openCreate}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Lead
          </button>
        </div>

        {error && (
          <div className="eb">
            {error}
            <button onClick={() => setError(null)} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:16}}>✕</button>
          </div>
        )}

        <div className="tb">
          <div className="sw">
            <span className="si"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input className="sb" placeholder="Search leads…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="tw">
          {loading ? (
            <div className="empty"><div style={{color:"#6c63ff"}}>Loading…</div></div>
          ) : leads.length === 0 ? (
            <div className="empty">
              <div className="ei">🔍</div>
              {debouncedQ ? `No leads matching "${debouncedQ}"` : "No leads yet. Create your first one!"}
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Source</th><th>Created</th><th></th></tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td><span className="tn">{lead.name}</span></td>
                    <td><span className="tm">{lead.email}</span></td>
                    <td><span className="tm">{lead.phone ?? "—"}</span></td>
                    <td>
                      <span className="badge" style={{background:STATUS_COLORS[lead.status].bg, color:STATUS_COLORS[lead.status].text}}>
                        {lead.status}
                      </span>
                    </td>
                    <td><span className="tm">{lead.source ?? "—"}</span></td>
                    <td><span className="tm">{new Date(lead.createdAt).toLocaleDateString()}</span></td>
                    <td>
                      <div className="acts">
                        <button className="btn bg bsm" onClick={() => openEdit(lead)}>Edit</button>
                        <button className="btn bd bsm" onClick={() => setDeleteId(lead.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pg">
            <div className="pgi">Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,total)} of {total}</div>
            <div className="pgb">
              <button className="pb" onClick={() => setPage(p => p-1)} disabled={page===1}>‹</button>
              {Array.from({length:Math.min(totalPages,7)},(_,i) => (
                <button key={i+1} className={`pb${page===i+1?" active":""}`} onClick={() => setPage(i+1)}>{i+1}</button>
              ))}
              <button className="pb" onClick={() => setPage(p => p+1)} disabled={page===totalPages}>›</button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="ov" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="mo">
            <div className="mt">{editing ? "Edit Lead" : "New Lead"}</div>
            <div className="fg">
              <div>
                <div className="fl">Full Name *</div>
                <input className="fi" value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))} placeholder="Jane Doe" />
              </div>
              <div>
                <div className="fl">Email *</div>
                <input className="fi" type="email" value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))} placeholder="jane@example.com" />
              </div>
              <div>
                <div className="fl">Phone</div>
                <input className="fi" value={form.phone} onChange={e => setForm(f => ({...f,phone:e.target.value}))} placeholder="+1 234 567 890" />
              </div>
              <div>
                <div className="fl">Status</div>
                <select className="fs" value={form.status} onChange={e => setForm(f => ({...f,status:e.target.value as Lead["status"]}))}>
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>
              <div className="ff">
                <div className="fl">Source</div>
                <input className="fi" value={form.source} onChange={e => setForm(f => ({...f,source:e.target.value}))} placeholder="Google Ads, Referral…" />
              </div>
              <div className="ff">
                <div className="fl">Notes</div>
                <textarea className="fta" value={form.notes} onChange={e => setForm(f => ({...f,notes:e.target.value}))} placeholder="Any additional notes…" />
              </div>
            </div>
            <div className="mf">
              <button className="btn bg" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn bp" onClick={handleSave} disabled={saving || !form.name || !form.email}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Create Lead"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="ov" onClick={e => { if (e.target === e.currentTarget) setDeleteId(null); }}>
          <div className="mo" style={{maxWidth:400}}>
            <div className="cb">
              <div className="ci">🗑️</div>
              <div className="ct">Delete this lead?</div>
              <div className="cd">This action cannot be undone.</div>
            </div>
            <div className="mf">
              <button className="btn bg" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn bd" onClick={() => handleDelete(deleteId)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}