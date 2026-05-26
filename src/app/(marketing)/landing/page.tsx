"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DotGrid from "@/components/ui/DotGrid";
import styles from "./page.module.css";

const navItems = [
  { label: "Home", href: "#home", match: ["home"] },
  { label: "Features", href: "#features", match: ["features"] },
  { label: "About", href: "#about", match: ["about"], hasChevron: true },
  { label: "How it Works", href: "#how-it-works", match: ["how-it-works"] },
];

const stats = [
  { label: "Campaigns monitored daily", value: 2400, suffix: "+", decimals: 0 },
  { label: "Average ROAS lift", value: 4.2, suffix: "x", decimals: 1 },
  { label: "Alert accuracy confidence", value: 92, suffix: "%", decimals: 0 },
  { label: "Seconds to detect a drift", value: 18, suffix: "s", decimals: 0 },
];

const kpiCards = [
  { label: "TOTAL SPEND", value: "$24,582", change: "12.4%", positive: true },
  { label: "ROAS", value: "4.2x", change: "8.1%", positive: true },
  { label: "CTR", value: "3.8%", change: "2.3%", positive: false },
  { label: "CPC", value: "$1.24", change: "5.2%", positive: false },
];

const features = [
  {
    title: "KPI Monitoring",
    description: "Track ROAS, CTR, CPC, and CAC across Google and Meta in one readable command center.",
    tone: "indigo",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    title: "Python Anomaly Detection",
    description: "Detect performance drifts before wasted spend stacks up with automated checks against the signals that matter.",
    tone: "green",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    title: "Instant Alerts",
    description: "Set thresholds for spend, CTR, CPC, and conversion health so your team sees issues fast and acts with context.",
    tone: "amber",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

const processSteps = [
  { number: "1", title: "Upload your data", description: "Bring in Google Ads or Meta CSV exports and centralize raw campaign performance in minutes." },
  { number: "2", title: "Map your columns", description: "Standardize headers once, then reuse that mapping to keep ingestion smooth for future uploads." },
  { number: "3", title: "Get alerted instantly", description: "Receive anomaly detections the moment spend or efficiency moves outside your guardrails." },
];

const platforms = [
  { label: "Google Ads", mark: "G", tone: "google" },
  { label: "Meta Ads", mark: "M", tone: "meta" },
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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatCount(value: number, decimals = 0) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function delayClass(index: number) {
  return styles[`delay${Math.min(index, 5)}`];
}

function featureToneClass(tone: string) {
  if (tone === "green") return styles.featureToneGreen;
  if (tone === "amber") return styles.featureToneAmber;
  return styles.featureToneIndigo;
}

function platformToneClass(tone: string) {
  return tone === "meta" ? styles.platformMeta : styles.platformGoogle;
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
          entry.target.classList.add(styles.isVisible);
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.16 },
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
          const suffix = target.dataset.suffix ?? "";
          const start = performance.now();

          const tick = (now: number) => {
            const progress = Math.min((now - start) / 1200, 1);
            target.textContent = `${formatCount(finalValue * easeOutCubic(progress), decimals)}${suffix}`;
            if (progress < 1) window.requestAnimationFrame(tick);
          };

          window.requestAnimationFrame(tick);
          countObserver.unobserve(target);
        });
      },
      { threshold: 0.25 },
    );

    document.querySelectorAll<HTMLElement>("[data-countup]").forEach((item) => countObserver.observe(item));
    return () => countObserver.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 820) setMobileOpen(false);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className={styles.page}>
      <nav className={cx(styles.navbar, isScrolled && styles.navbarScrolled)}>
        <Link href="#home" className={styles.brand} aria-label="VisioAd home" onClick={() => setMobileOpen(false)}>
          <span className={styles.brandIcon}>V</span>
          <span className={styles.brandWordmark}>
            VISIO<span>AD</span>
          </span>
        </Link>

        <div className={styles.navLinks} aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cx(styles.navLink, item.match.includes(activeSection) && styles.navLinkActive)}
            >
              <span>{item.label}</span>
              {item.hasChevron ? (
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </Link>
          ))}
        </div>

        <div className={styles.navActions}>
          <Link href="/login" className={styles.signInLink}>
            Sign In
          </Link>
          <span className={styles.navDivider} aria-hidden="true" />
          <Link href="/register" className={cx(styles.primaryButton, styles.navButton)}>
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className={cx(styles.menuToggle, mobileOpen && styles.menuToggleOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          aria-controls="landing-mobile-menu"
          onClick={() => setMobileOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div id="landing-mobile-menu" className={cx(styles.mobileMenu, mobileOpen && styles.mobileMenuOpen)}>
        <div className={styles.mobileMenuPanel}>
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/login" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
            Sign In
          </Link>
          <Link href="/register" className={cx(styles.primaryButton, styles.mobileCta)} onClick={() => setMobileOpen(false)}>
            Get Started
          </Link>
        </div>
      </div>

      <main>
        <section id="home" className={styles.hero}>
          <div className={styles.heroDotgrid} aria-hidden="true">
            <DotGrid dotSize={8} gap={22} baseColor="#dbe2ff" activeColor="#6366f1" proximity={140} shockRadius={220} shockStrength={3.2} resistance={820} returnDuration={1.4} />
          </div>

          <div className={styles.heroInner}>
            <div className={cx(styles.heroSequence, styles.sequence0)}>
              <h1 className={styles.heroTitle}>
                Stop guessing.
                <br />
                <span>Start monitoring with confidence.</span>
              </h1>
            </div>

            <div className={cx(styles.heroSequence, styles.sequence1)}>
              <p className={styles.heroSubtitle}>
                Centralize Google and Meta Ads monitoring, catch abnormal performance before spend gets away from you, and give your team a cleaner way to act fast.
              </p>
            </div>

            <div className={cx(styles.heroActions, styles.heroSequence, styles.sequence2)}>
              <Link href="/register" className={styles.primaryButton}>
                Get Started
              </Link>
              <Link href="#features" className={styles.secondaryButton}>
                See Features
              </Link>
            </div>

            <div className={styles.statsGrid}>
              {stats.map((stat, index) => (
                <article key={stat.label} className={cx(styles.statCard, styles.reveal, delayClass(index))} data-reveal="true">
                  <strong className={styles.statValue} data-countup="true" data-value={stat.value} data-suffix={stat.suffix} data-decimals={stat.decimals}>
                    0
                  </strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.kpiSection} aria-label="Campaign health snapshot">
          <div className={styles.sectionInner}>
            <div className={styles.kpiPanel}>
              <div className={styles.kpiPanelHeader}>
                <div>
                  <span className={styles.eyebrow}>Performance Overview</span>
                  <h2>Cross-channel campaign health</h2>
                </div>
                <span className={styles.livePill}>
                  <span className={styles.pulseDot} />
                  LIVE
                </span>
              </div>

              <div className={styles.kpiGrid}>
                {kpiCards.map((card, index) => (
                  <article key={card.label} className={cx(styles.kpiCard, styles.reveal, delayClass(index))} data-reveal="true">
                    <span className={styles.kpiLabel}>{card.label}</span>
                    <strong>{card.value}</strong>
                    <span className={card.positive ? styles.kpiPositive : styles.kpiNegative}>
                      {card.positive ? "+" : "-"} {card.change} vs last period
                    </span>
                  </article>
                ))}
              </div>

              <div className={styles.alertList}>
                <div className={cx(styles.alertRow, styles.reveal, styles.delay4)} data-reveal="true">
                  <span className={cx(styles.alertDot, styles.alertCritical)} />
                  <div>
                    <strong>Summer Sale Campaign</strong>
                    <span>Spend velocity is rising faster than conversion volume.</span>
                  </div>
                  <em className={styles.criticalBadge}>CRITICAL</em>
                </div>
                <div className={cx(styles.alertRow, styles.reveal, styles.delay5)} data-reveal="true">
                  <span className={cx(styles.alertDot, styles.alertWarning)} />
                  <div>
                    <strong>Brand Awareness Q3</strong>
                    <span>CTR dipped below the weekly baseline in the last 3 hours.</span>
                  </div>
                  <em className={styles.warningBadge}>WARNING</em>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className={cx(styles.contentSection, styles.sectionAlt)}>
          <div className={styles.sectionInner}>
            <SectionHeading eyebrow="Why VisioAd" title="Everything your team needs to monitor performance" copy="From ingestion to alerts, the workflow stays in one calm, readable interface your operators can trust." />

            <div className={styles.featureGrid}>
              {features.map((feature, index) => (
                <article key={feature.title} className={cx(styles.featureCard, styles.reveal, delayClass(index))} data-reveal="true">
                  <div className={cx(styles.featureIcon, featureToneClass(feature.tone))}>{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className={styles.contentSection}>
          <div className={cx(styles.sectionInner, styles.aboutGrid)}>
            <div className={cx(styles.aboutCopy, styles.reveal)} data-reveal="true">
              <span className={styles.eyebrow}>About</span>
              <h2>Full-service brand advertising, without blind spots</h2>
              <p>
                VisioAd gives media teams a single operating layer for campaign data, anomaly detection, and decision-ready signal tracking across the platforms they already use every day.
              </p>
              <div className={styles.platformList}>
                {platforms.map((platform, index) => (
                  <div key={platform.label} className={cx(styles.platformPill, styles.reveal, delayClass(index))} data-reveal="true">
                    <span className={cx(styles.platformMark, platformToneClass(platform.tone))}>{platform.mark}</span>
                    {platform.label}
                  </div>
                ))}
              </div>
            </div>

            <div className={cx(styles.aboutPanel, styles.reveal, styles.delay2)} data-reveal="true">
              <div className={styles.aboutPanelTop}>
                <div>
                  <span className={styles.eyebrow}>Team Snapshot</span>
                  <h3>Monitoring in one view</h3>
                </div>
                <span className={styles.miniPill}>Ops Ready</span>
              </div>
              <div className={styles.miniChart}>
                <span />
              </div>
              <div className={styles.miniMetrics}>
                <div>
                  <strong>12</strong>
                  <span>active guardrails</span>
                </div>
                <div>
                  <strong>07</strong>
                  <span>markets tracked</span>
                </div>
                <div>
                  <strong>24/7</strong>
                  <span>alert visibility</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className={cx(styles.contentSection, styles.sectionAlt)}>
          <div className={styles.sectionInner}>
            <SectionHeading eyebrow="The Process" title="How it works" copy="Move from raw exports to a proactive monitoring workflow in three clear steps." />

            <div className={styles.processGrid}>
              <div className={styles.processLine} aria-hidden="true" />
              {processSteps.map((step, index) => (
                <article key={step.number} className={cx(styles.processCard, styles.reveal, delayClass(index))} data-reveal="true">
                  <div className={styles.processNumber}>{step.number}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={cx(styles.contentSection, styles.finalCta)}>
          <div className={styles.sectionInner}>
            <div className={cx(styles.ctaBanner, styles.reveal)} data-reveal="true">
              <span className={styles.eyebrow}>Ready when you are</span>
              <h2>Ready to stop budget waste?</h2>
              <p>Start catching anomalies before they cost your team money, momentum, or confidence.</p>
              <Link href="/register" className={styles.primaryButton}>
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerColumn}>
            <h3>VisioAd</h3>
            <p>Built for teams who want faster visibility across campaigns, cleaner signals, and less wasted spend.</p>
          </div>

          <div className={styles.footerColumn}>
            <h3>Quicklinks</h3>
            <div className={styles.footerLinks}>
              {footerQuicklinks.map((link) => (
                <Link key={link.label} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.footerColumn}>
            <h3>Contact Us</h3>
            <div className={styles.footerLinks}>
              <a href="https://www.visioad.com/" target="_blank" rel="noreferrer" className={styles.footerContactItem}>
                <GlobeIcon />
                <span>www.visioad.com</span>
              </a>
              <a href="tel:+21631439350" className={styles.footerContactItem}>
                <PhoneIcon />
                <span>+216 31 439 350</span>
              </a>
              <a href="mailto:Info@Visioad.Com" className={styles.footerContactItem}>
                <MailIcon />
                <span>Info@Visioad.Com</span>
              </a>
              <span className={styles.footerContactItem}>
                <MapPinIcon />
                <span>Immeuble Centre Ibrahim, Av. Habib Bourguiba, Sousse 4000</span>
              </span>
            </div>
          </div>

          <div className={styles.footerColumn}>
            <h3>Social Media</h3>
            <div className={styles.footerLinks}>
              {socialLinks.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>&copy; 2026 VisioAd. All rights reserved.</span>
          <div>
            <Link href="#privacy">Privacy Policy</Link>
            <Link href="#terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div className={cx(styles.sectionHeading, styles.reveal)} data-reveal="true">
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg className={styles.footerContactIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className={styles.footerContactIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.64 2.61a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.47-1.3a2 2 0 0 1 2.11-.45c.83.31 1.71.52 2.61.64A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className={styles.footerContactIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className={styles.footerContactIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s-6-5.33-6-11a6 6 0 1 1 12 0c0 5.67-6 11-6 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
