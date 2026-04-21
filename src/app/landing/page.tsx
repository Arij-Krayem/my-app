"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DotGrid from "@/components/ui/DotGrid";

const navItems = [
  { label: "Home", href: "#home", match: ["home"] },
  { label: "Features", href: "#features", match: ["features"], chevron: false },
  { label: "About", href: "#about", match: ["about"], chevron: true },
  { label: "How it Works", href: "#how-it-works", match: ["how-it-works"], chevron: false },
];

const stats = [
  { label: "Campaigns monitored daily", value: 2400, suffix: "+", decimals: 0 },
  { label: "Average ROAS lift", value: 4.2, suffix: "x", decimals: 1 },
  { label: "Alert accuracy confidence", value: 92, suffix: "%", decimals: 0 },
  { label: "Seconds to detect a drift", value: 18, suffix: "s", decimals: 0 },
];

const features = [
  {
    title: "KPI Monitoring",
    description: "Track ROAS, CTR, CPC, and CAC across Google and Meta in one readable command center.",
    accent: "#6366F1",
    tint: "rgba(99,102,241,0.12)",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  },
  {
    title: "Python Anomaly Detection",
    description: "Detect performance drifts before wasted spend stacks up with automated checks against the signals that matter.",
    accent: "#0F9D58",
    tint: "rgba(15,157,88,0.12)",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>,
  },
  {
    title: "Instant Alerts",
    description: "Set thresholds for spend, CTR, CPC, and conversion health so your team sees issues fast and acts with context.",
    accent: "#F59E0B",
    tint: "rgba(245,158,11,0.12)",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  },
];

const processSteps = [
  { number: "1", title: "Upload your data", description: "Bring in Google Ads or Meta CSV exports and centralize raw campaign performance in minutes." },
  { number: "2", title: "Map your columns", description: "Standardize headers once, then reuse that mapping to keep ingestion smooth for future uploads." },
  { number: "3", title: "Get alerted instantly", description: "Receive anomaly detections the moment spend or efficiency moves outside your guardrails." },
];

const footerQuicklinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "About", href: "#about" },
];

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/ste_visioad/" },
  { label: "Website", href: "https://www.visioad.com/" },
];

const kpiCards = [
  { label: "TOTAL SPEND", value: "$24,582", change: "12.4%", positive: true },
  { label: "ROAS", value: "4.2x", change: "8.1%", positive: true },
  { label: "CTR", value: "3.8%", change: "2.3%", positive: false },
  { label: "CPC", value: "$1.24", change: "5.2%", positive: false },
];

function formatCount(value: number, decimals = 0) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = ["home", "features", "about", "how-it-works"]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { threshold: [0.2, 0.35, 0.6], rootMargin: "-80px 0px -45% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          target.style.transitionDelay = target.dataset.delay ?? "0ms";
          target.classList.add("is-visible");
          revealObserver.unobserve(target);
        });
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((item) => revealObserver.observe(item));
    return () => revealObserver.disconnect();
  }, []);

  useEffect(() => {
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          if (target.dataset.counted === "true") return;
          target.dataset.counted = "true";
          const finalValue = Number(target.dataset.value ?? "0");
          const decimals = Number(target.dataset.decimals ?? "0");
          const prefix = target.dataset.prefix ?? "";
          const suffix = target.dataset.suffix ?? "";
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / 1200, 1);
            target.textContent = `${prefix}${formatCount(finalValue * easeOutCubic(progress), decimals)}${suffix}`;
            if (progress < 1) window.requestAnimationFrame(tick);
          };
          window.requestAnimationFrame(tick);
          countObserver.unobserve(target);
        });
      },
      { threshold: 0.2 },
    );
    document.querySelectorAll<HTMLElement>("[data-countup]").forEach((item) => countObserver.observe(item));
    return () => countObserver.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="visio-landing">
      <nav
        className={`landing-nav ${isScrolled ? "scrolled" : ""}`}
        style={{ position: "fixed", top: 0, left: 0, right: 0 }}
      >
        <Link href="#home" className="brand" aria-label="VisioAd home">
          <span className="brand-icon">V</span>
          <span className="brand-wordmark">VISIO<span>AD</span></span>
        </Link>

        <div className="landing-nav-links" aria-label="Primary">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className={`landing-nav-link ${item.match.includes(activeSection) ? "active" : ""}`} onClick={() => setMobileOpen(false)}>
              <span>{item.label}</span>
              {item.chevron ? <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
            </Link>
          ))}
        </div>

        <div className="landing-nav-actions">
          <Link href="/login" className="signin-link">Sign In</Link>
          <span className="nav-divider" aria-hidden="true" />
          <Link href="/register" className="cta-button shine-button">Get Started</Link>
        </div>

        <button type="button" className={`menu-toggle ${mobileOpen ? "open" : ""}`} aria-label="Toggle menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen((value) => !value)}>
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div className={`mobile-menu ${mobileOpen ? "open" : ""}`}>
        <div className="mobile-menu-panel">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="mobile-link" onClick={() => setMobileOpen(false)}>{item.label}</Link>
          ))}
          <Link href="/login" className="mobile-link" onClick={() => setMobileOpen(false)}>Sign In</Link>
          <Link href="/register" className="cta-button shine-button mobile-cta" onClick={() => setMobileOpen(false)}>Get Started</Link>
        </div>
      </div>

      <main className="landing-main">
        <section id="home" className="hero-section">
          <div className="hero-dotgrid" aria-hidden="true">
            <DotGrid
              dotSize={8}
              gap={22}
              baseColor="#c7d2fe"
              activeColor="#6366f1"
              proximity={140}
              shockRadius={220}
              shockStrength={3.2}
              resistance={820}
              returnDuration={1.4}
            />
          </div>
          <div className="hero-glow glow-left" />
          <div className="hero-glow glow-right" />
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="hero-sequence" style={{ animationDelay: "0ms" }}>
                <h1>Stop guessing.<br /><span>Start monitoring with confidence.</span></h1>
              </div>
              <div className="hero-sequence" style={{ animationDelay: "150ms" }}>
                <p className="hero-subtitle">Centralize Google and Meta Ads monitoring, catch abnormal performance before spend gets away from you, and give your team a cleaner way to act fast.</p>
              </div>
              <div className="hero-sequence" style={{ animationDelay: "300ms" }}>
                <div className="hero-actions">
                  <Link href="/register" className="cta-button shine-button">Get Started</Link>
                </div>
              </div>
              <div className="stats-grid">
                {stats.map((stat, index) => (
                  <div key={stat.label} className="stat-card reveal hover-lift" data-reveal="true" data-delay={`${index * 100}ms`}>
                    <div className="stat-value" data-countup="true" data-value={stat.value} data-prefix="" data-suffix={stat.suffix} data-decimals={stat.decimals}>0</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-sequence hero-card-shell" style={{ animationDelay: "450ms" }}>
              <div className="hero-card">
                <div className="hero-card-header">
                  <div>
                    <div className="eyebrow">Performance Overview</div>
                    <div className="hero-card-title">Cross-channel campaign health</div>
                  </div>
                  <span className="live-pill"><span className="pulse-dot small" />LIVE</span>
                </div>
                <div className="kpi-grid">
                  {kpiCards.map((card, index) => (
                    <div key={card.label} className="kpi-card reveal hover-lift" data-reveal="true" data-delay={`${index * 100}ms`}>
                      <div className="kpi-label">{card.label}</div>
                      <div className="kpi-value">{card.value}</div>
                      <div className={`kpi-change ${card.positive ? "positive" : "negative"}`}>{card.positive ? "+" : "-"} {card.change} vs last period</div>
                    </div>
                  ))}
                </div>
                <div className="alert-stack">
                  <div className="alert-card reveal hover-lift" data-reveal="true" data-delay="450ms">
                    <div className="alert-left"><span className="alert-dot critical" /><div><div className="alert-title">Summer Sale Campaign</div><div className="alert-copy">Spend velocity is rising faster than conversion volume.</div></div></div>
                    <span className="alert-badge critical">CRITICAL</span>
                  </div>
                  <div className="alert-card reveal hover-lift" data-reveal="true" data-delay="550ms">
                    <div className="alert-left"><span className="alert-dot warning" /><div><div className="alert-title">Brand Awareness Q3</div><div className="alert-copy">CTR dipped below the weekly baseline in the last 3 hours.</div></div></div>
                    <span className="alert-badge warning">WARNING</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="content-section section-alt">
          <div className="section-inner">
            <div className="section-heading reveal" data-reveal="true">
              <span className="section-kicker">Why VisioAd</span>
              <h2>Everything your team needs to monitor performance</h2>
              <p>From ingestion to alerts, the workflow stays in one calm, readable interface your operators can trust.</p>
            </div>
            <div className="feature-grid">
              {features.map((feature, index) => (
                <article key={feature.title} className="feature-card reveal hover-lift" data-reveal="true" data-delay={`${index * 100}ms`}>
                  <div className="feature-icon" style={{ color: feature.accent, background: feature.tint, borderColor: `${feature.accent}4D` }}>{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="content-section">
          <div className="section-inner about-grid">
            <div className="about-copy reveal" data-reveal="true">
              <span className="section-kicker">About</span>
              <h2>Full-service brand advertising, without blind spots</h2>
              <p>VisioAd gives media teams a single operating layer for campaign data, anomaly detection, and decision-ready signal tracking across the platforms they already use every day.</p>
              <div className="platform-list">
                {[
                  { label: "Google Ads", mark: "G", color: "#4285F4" },
                  { label: "Meta Ads", mark: "M", color: "#1877F2" },
                ].map((platform, index) => (
                  <div key={platform.label} className="platform-pill reveal" data-reveal="true" data-delay={`${index * 100}ms`}>
                    <span className="platform-mark" style={{ background: platform.color }}>{platform.mark}</span>{platform.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="about-panel reveal hover-lift" data-reveal="true" data-delay="180ms">
              <div className="about-panel-top">
                <div><div className="eyebrow">Team Snapshot</div><div className="hero-card-title">Monitoring in one view</div></div>
                <span className="mini-pill">Ops Ready</span>
              </div>
              <div className="mini-chart"><div className="chart-line" /></div>
              <div className="mini-metrics">
                <div><strong>12</strong><span>active guardrails</span></div>
                <div><strong>07</strong><span>priority alerts</span></div>
                <div><strong>99.2%</strong><span>pipeline uptime</span></div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="content-section section-alt">
          <div className="section-inner">
            <div className="section-heading reveal" data-reveal="true">
              <span className="section-kicker">The Process</span>
              <h2>How it works</h2>
              <p>Move from raw exports to a proactive monitoring workflow in three clear steps.</p>
            </div>
            <div className="process-grid">
              <div className="process-line" />
              {processSteps.map((step, index) => (
                <div key={step.number} className="process-card reveal" data-reveal="true" data-delay={`${index * 100}ms`}>
                  <div className="process-number">{step.number}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="content-section landing-final-cta">
          <div className="section-inner">
            <div className="cta-banner reveal" data-reveal="true">
              <span className="section-kicker">Ready when you are</span>
              <h2>Ready to stop budget waste?</h2>
              <p>Start catching anomalies before they cost your team money, momentum, or confidence.</p>
              <Link href="/register" className="cta-button shine-button">Get Started</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-column reveal" data-reveal="true" data-delay="0ms">
            <h3>VisioAd</h3>
            <p className="footer-copy">Built for teams who want faster visibility across campaigns, cleaner signals, and less wasted spend.</p>
          </div>
          <div className="footer-column reveal" data-reveal="true" data-delay="120ms">
            <h3>Quicklinks</h3>
            <div className="footer-links">{footerQuicklinks.map((link) => <Link key={link.label} href={link.href}>{link.label}</Link>)}</div>
          </div>
          <div className="footer-column reveal" data-reveal="true" data-delay="240ms">
            <h3>Contact Us</h3>
            <div className="footer-links contact-links">
              <a href="https://www.visioad.com/" target="_blank" rel="noreferrer"><span className="inline-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" stroke="currentColor" strokeWidth="1.8" /><path d="M2 12h20" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" stroke="currentColor" strokeWidth="1.8" /></svg></span>www.visioad.com</a>
              <a href="tel:+21631439350"><span className="inline-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.64 2.61a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.47-1.3a2 2 0 0 1 2.11-.45c.83.31 1.71.52 2.61.64A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="1.8" /></svg></span>+216 31 439 350</a>
              <a href="mailto:Info@Visioad.Com"><span className="inline-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.8" /><path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" /></svg></span>Info@Visioad.Com</a>
              <span className="contact-address"><span className="inline-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21s-6-5.33-6-11a6 6 0 1 1 12 0c0 5.67-6 11-6 11Z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" /></svg></span>Immeuble Centre Ibrahim, Av. Habib Bourguiba, Sousse 4000</span>
            </div>
          </div>
          <div className="footer-column reveal" data-reveal="true" data-delay="360ms">
            <h3>Social Media</h3>
            <div className="footer-links">{socialLinks.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>)}</div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 VisioAd. All rights reserved.</span>
          <div className="footer-bottom-links">
            <Link href="#privacy">Privacy Policy</Link>
            <Link href="#terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
