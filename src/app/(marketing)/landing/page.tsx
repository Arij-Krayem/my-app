"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const kpis = [
  { label: "TOTAL SPEND", value: "$24,582", change: "↑ 12.4%", up: true },
  { label: "ROAS", value: "4.2x", change: "↑ 8.1%", up: true },
  { label: "CTR", value: "3.8%", change: "↓ 2.3%", up: false },
  { label: "CPC", value: "$1.24", change: "↓ 5.2%", up: false },
];

const previewAlerts = [
  { name: "Summer Sale Campaign", badge: "CRITICAL", tone: "critical" },
  { name: "Brand Awareness Q3", badge: "WARNING", tone: "warning" },
];

const features = [
  {
    tone: "blue",
    icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>),
    title: "KPI Monitoring",
    desc: "Track ROAS, CTR, CPC, and CAC in real-time across all your Google & Meta campaigns. Visualized with Recharts for maximum clarity.",
  },
  {
    tone: "green",
    icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>),
    title: "Python Anomaly Detection",
    desc: "Our Python-powered engine analyzes your CSV data to identify performance drifts and automatically flag budget-bleeding campaigns before they escalate.",
  },
  {
    tone: "amber",
    icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>),
    title: "Instant Alerts",
    desc: "Set custom guardrails for any KPI. Get notified the moment a campaign drifts out of bounds with severity-ranked alerts.",
  },
];

const steps = [
  { n: "1", title: "Upload your data", desc: "Export your Google Ads or Meta CSV data and upload it directly to VisioAd in seconds." },
  { n: "2", title: "Map your columns", desc: "Our intelligent mapper helps you align CSV headers to our unified schema with one click." },
  { n: "3", title: "Get alerted instantly", desc: "Python analyzes your data and sends real-time alerts when anomalies are detected in your campaigns." },
];

const platforms = [
  { label: "Google Ads", tone: "google", icon: "G" },
  { label: "Meta Ads", tone: "meta", icon: "f" },
];

const contactItems = [
  {
    icon: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 0c2.5 2.7 3.8 6 3.8 10S14.5 19.3 12 22m0-20c-2.5 2.7-3.8 6-3.8 10S9.5 19.3 12 22M2 12h20" />,
    label: "www.visioad.com",
    href: "https://www.visioad.com",
  },
  {
    icon: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L8 9.5a16 16 0 0 0 6.5 6.5l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2Z" />,
    label: "+216 31 439 350",
    href: "tel:+21631439350",
  },
  {
    icon: <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm18 3-10 6L2 7" />,
    label: "info@visioad.com",
    href: "mailto:info@visioad.com",
  },
  {
    icon: <><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0Z" /><circle cx="12" cy="10" r="3" /></>,
    label: "Immeuble Centre Ibrahim, Av. Habib Bourguiba, Sousse 4000",
  },
];

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
  }, []);

  return (
    <div className={styles.page}>
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <div className={styles.logo}>V</div>
          <span className={styles.brandName}>
            VISIO<span>AD</span>
          </span>
        </div>

        <div className={styles.navActions}>
          <Link href="/login" className={styles.navLink}>Sign In</Link>
          <Link href="/register" className={styles.navButton}>Get Started</Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.glowOne} />
        <div className={styles.glowTwo} />

        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            Stop Guessing.{" "}
            <span>Start Monitoring.</span>
          </h1>

          <p className={styles.heroCopy}>
            Centralized Google & Meta Ads monitoring with intelligent anomaly detection.
            Stop budget-bleeding campaigns before they impact your bottom line.
          </p>

          <div className={styles.heroCta}>
            <Link href="/register" className={styles.primaryButton}>
              Get Started Free →
            </Link>
          </div>

          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <span className={styles.previewTitle}>Performance Overview</span>
              <span className={styles.liveBadge}>● LIVE</span>
            </div>

            <div className={styles.kpiGrid}>
              {kpis.map(k => (
                <div key={k.label} className={styles.kpiCard}>
                  <div className={styles.kpiLabel}>{k.label}</div>
                  <div className={styles.kpiValue}>{k.value}</div>
                  <div className={k.up ? styles.kpiUp : styles.kpiDown}>{k.change} vs last period</div>
                </div>
              ))}
            </div>

            <div className={styles.previewAlerts}>
              {previewAlerts.map(a => (
                <div key={a.name} className={styles.previewAlert}>
                  <div className={styles.alertNameWrap}>
                    <span className={`${styles.alertDot} ${a.tone === "critical" ? styles.alertCriticalDot : styles.alertWarningDot}`} />
                    <span className={styles.alertName}>{a.name}</span>
                  </div>
                  <span className={`${styles.alertBadge} ${a.tone === "critical" ? styles.alertCritical : styles.alertWarning}`}>{a.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.featureSection}>
        <div className={styles.container}>
          <SectionHeading eyebrow="WHY VISIOAD" title="Everything you need to monitor performance" copy="From data ingestion to anomaly alerts — all in one platform." />

          <div className={styles.featureGrid}>
            {features.map(f => (
              <div key={f.title} className={styles.featureCard}>
                <div className={`${styles.featureIcon} ${featureToneClass(f.tone)}`}>
                  {f.icon}
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureText}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.processSection}>
        <div className={styles.processContainer}>
          <div className={styles.sectionEyebrow}>THE PROCESS</div>
          <h2 className={styles.sectionTitle}>How it works</h2>

          <div className={styles.stepsGrid}>
            <div className={styles.stepLine} />
            {steps.map(s => (
              <div key={s.n} className={styles.step}>
                <div className={styles.stepNumber}>{s.n}</div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepText}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.platformSection}>
        <div className={styles.platformContainer}>
          <p className={styles.platformTitle}>Works with your favorite platforms</p>
          <div className={styles.platformGrid}>
            {platforms.map(p => (
              <div key={p.label} className={`${styles.platformCard} ${p.tone === "google" ? styles.googlePlatform : styles.metaPlatform}`}>
                <span className={styles.platformIcon}>{p.icon}</span>
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaBox}>
          <h2 className={styles.ctaTitle}>Ready to stop budget waste?</h2>
          <p className={styles.ctaCopy}>
            Join your team on VisioAd and start catching anomalies before they cost you.
          </p>
          <Link href="/register" className={styles.primaryButton}>
            Get Started Free →
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>V</div>
            <div>
              <div className={styles.footerName}>VisioAd</div>
              <div className={styles.footerTagline}>Full-Service Brand Advertising Agency</div>
            </div>
          </div>

          <div className={styles.contactGrid}>
            <div className={styles.contactTitle}>Contact Us</div>
            {contactItems.map(item => {
              const content = (
                <>
                  <svg className={styles.contactIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                  <span>{item.label}</span>
                </>
              );

              return item.href ? (
                <a key={item.label} href={item.href} className={styles.contactLink}>
                  {content}
                </a>
              ) : (
                <div key={item.label} className={styles.contactItem}>
                  {content}
                </div>
              );
            })}
          </div>

          <div className={styles.footerLinks}>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </div>
        </div>
        <div className={styles.copyright}>
          © 2026 VisioAd. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div className={styles.sectionHeading}>
      <div className={styles.sectionEyebrow}>{eyebrow}</div>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <p className={styles.sectionCopy}>{copy}</p>
    </div>
  );
}

function featureToneClass(tone: string) {
  if (tone === "green") return styles.featureGreen;
  if (tone === "amber") return styles.featureAmber;
  return styles.featureBlue;
}
