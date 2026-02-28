"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  const cards = [
    { href:"/leads",   label:"Leads",   desc:"View and manage your leads",  icon:"👥", color:"#6c63ff" },
    { href:"/uploads", label:"Uploads",  desc:"Upload and manage your files", icon:"📁", color:"#10b981" },
    ...(user?.role === "AGENCY_ADMIN" ? [{ href:"/users", label:"Users", desc:"Manage team members", icon:"⚙️", color:"#f59e0b" }] : []),
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        :root{--surface:#13161b;--surface2:#1a1e25;--border:#242830;--text:#e8eaf0;--muted:#6b7280;--font:'Plus Jakarta Sans',sans-serif;}
        .db{font-family:var(--font);color:var(--text);}
        .welcome{margin-bottom:32px;}
        .wt{font-size:26px;font-weight:800;letter-spacing:-.5px;margin-bottom:4px;}
        .ws{font-size:14px;color:var(--muted);}
        .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;}
        .card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;text-decoration:none;color:var(--text);transition:transform .15s,border-color .15s,box-shadow .15s;display:block;}
        .card:hover{transform:translateY(-2px);border-color:rgba(108,99,255,.4);box-shadow:0 8px 24px rgba(0,0,0,.3);}
        .card-icon{font-size:28px;margin-bottom:14px;}
        .card-label{font-size:16px;font-weight:700;margin-bottom:4px;}
        .card-desc{font-size:13px;color:var(--muted);}
        .card-arrow{margin-top:16px;font-size:18px;}
      `}</style>
      <div className="db">
        <div className="welcome">
          <div className="wt">Welcome back, {user?.name ?? user?.email?.split("@")[0]} 👋</div>
          <div className="ws">Here's what you can do today</div>
        </div>
        <div className="cards">
          {cards.map(c => (
            <Link key={c.href} href={c.href} className="card">
              <div className="card-icon">{c.icon}</div>
              <div className="card-label" style={{color:c.color}}>{c.label}</div>
              <div className="card-desc">{c.desc}</div>
              <div className="card-arrow">→</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}