// Public marketing landing page, shown at "/".
// Ported from the pre-React front-end (index.html + js/views/landing.js);
// its stylesheet (landing.css) only uses lp-* classes so it can't leak into the portals.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Bell, Briefcase, Building2, CalendarCheck, CalendarX, ChartBar, ChartLine, ChevronDown,
  CircleCheckBig, CircleDollarSign, GraduationCap, Info, Layers, ListChecks, LockKeyhole,
  Menu, Moon, Plug2, Rocket, ShieldCheck, Sparkles, Store, Sun, Target, Timer, TrendingUp, UserPlus, Users,
  Wand, Zap,
} from 'lucide-react';
import useTheme from '../../hooks/useTheme';
import BrandLogo from '../../components/common/BrandLogo';
import { PATHS } from '../../utils/constants';
import './landing.css';

const SECTIONS = [
  ['#top', 'Home'],
  ['#features', 'Features'],
  ['#solutions', 'Solutions'],
  ['#pricing', 'Pricing'],
  ['#faq', 'FAQ'],
  ['#contact', 'Contact'],
];

const AUDIENCES = [
  [Rocket, 'Startups', 'Set up employee records and attendance tracking in minutes without a dedicated HR system.'],
  [Store, 'Small Businesses', 'Replace spreadsheets and manual leave approvals with one simple, connected workflow.'],
  [GraduationCap, 'Educational Institutions', 'Track staff attendance, task allocation, and reporting across departments and campuses.'],
  [Building2, 'Enterprises', 'Role-based access for Admins, HR, Team Leads, and Employees keeps large teams organized.'],
];

// [Icon, title, text, comingSoon]
const FEATURES = [
  [Users, 'Employee Management', 'Maintain a single, organized record for every employee — profiles, roles, and reporting lines.'],
  [CalendarCheck, 'Attendance', 'Automated, work-log-driven attendance tracking that stays accurate without manual entry.'],
  [CalendarX, 'Leave Management', 'Employees request leave and managers approve it in a few clicks, with full status visibility.'],
  [ListChecks, 'Work Allocation', 'Assign, track, and update tasks across teams with clear ownership and progress status.'],
  [ChartBar, 'Analytics', 'Reports and dashboards that turn attendance, tasks, and issues into decisions.'],
  [CircleDollarSign, 'Payroll', 'Payroll processing built on top of attendance and work-log data, on our roadmap.', true],
  [Zap, 'AI Insights', 'Pattern detection across attendance and productivity data to flag what needs attention.', true],
  [UserPlus, 'Recruitment', 'Candidate tracking that hands off cleanly into onboarding and employee records.', true],
  [Plug2, 'API Integrations', 'Connect EmpTrack to the other tools your organization already relies on.', true],
];

const REASONS = [
  [Wand, 'Reduce Manual HR Work', 'Attendance, leave, and task updates flow automatically instead of living in spreadsheets.'],
  [Timer, 'Real-Time Attendance', 'Check-ins and work logs update dashboards instantly, with no end-of-day reconciliation.'],
  [Layers, 'Scalable Architecture', 'Built on a modular NestJS backend so new modules can be added without reworking the core.'],
  [ShieldCheck, 'Role-Based Access', "Admins, HR, Team Leads, and Employees each see exactly what's relevant to their role."],
  [ChartLine, 'Advanced Analytics', 'Attendance, productivity, and escalation trends surfaced as clear, actionable reports.'],
  [LockKeyhole, 'Secure Data', 'Authenticated sessions and role guards keep employee data visible only to the right people.'],
];

const ROADMAP = [
  [CalendarCheck, 'AI Attendance Insights', 'Surface attendance patterns and anomalies automatically.'],
  [ChartBar, 'Workforce Analytics', 'Deeper cross-team comparisons beyond standard reports.'],
  [Target, 'Predictive Reports', 'Forecast attendance and workload trends ahead of time.'],
  [Bell, 'Smart Notifications', 'Context-aware alerts instead of blanket notifications.'],
  [TrendingUp, 'Productivity Monitoring', 'Track output trends tied directly to logged work.'],
];

const PLANS = [
  {
    name: 'Free', desc: 'For small teams getting started with structured HR tracking.', price: '$49', period: 'up to 50 employees',
    features: ['Employee management', 'Attendance tracking', 'Leave requests', 'Basic task allocation'],
  },
  {
    name: 'Professional', desc: 'For growing teams that need reporting and escalations.', price: '$149', period: 'unlimited employees', featured: true,
    features: ['Everything in Free', 'Work monitoring & work logs', 'Issue & escalation management', 'Analytics & reports'],
  },
  {
    name: 'Enterprise', desc: 'For larger organizations needing dedicated support.', price: '$499', period: 'talk to our team',
    features: ['Everything in Professional', 'Priority support', 'Custom onboarding', 'Advanced role controls'],
  },
];

const STEPS = [
  ['Set Up Your Organization', 'An admin configures EmpTrack and sets up roles for HR, Team Leads, and Employees.'],
  ['Invite Employees', 'HR adds employee profiles so everyone has access to their own role-based dashboard.'],
  ['Manage Workforce', 'Track attendance, assign tasks, approve leave, and handle issues day to day.'],
  ['Generate Reports', 'Turn accumulated activity into attendance and performance reports automatically.'],
];

const FAQS = [
  ['What is EmpTrack?', 'EmpTrack is a workforce and HR management platform that helps organizations manage employees, track attendance, handle leave requests, assign tasks, and resolve issues and escalations — all from one place.'],
  ['Who is it for?', 'EmpTrack is built for HR teams, team leads, and employees across startups, small businesses, educational institutions, and enterprises that want a structured way to manage daily workforce operations.'],
  ['Can it support multiple organizations?', 'EmpTrack is currently built around a single organization with role-based access for Admins, HR, Team Leads, and Employees. Multi-organization support is on our roadmap.'],
  ['Is payroll supported?', 'Not yet. Payroll is on our roadmap alongside AI-assisted insights and recruitment tracking, built on top of the attendance and work-log data EmpTrack already captures.'],
  ['Can plans be upgraded?', "Plan upgrades aren't automated yet — reach out through the contact details below and we'll help move your organization to the plan that fits."],
  ['Is my data secure?', 'Yes. Every session requires authentication, and role-based access ensures Employees, Team Leads, HR, and Admins only see the data relevant to their role.'],
];

const delay = (ms) => ({ '--delay': `${ms}ms` });

// Icon + title + text card, used by four sections with different card classes.
function Cards({ items, className, badge = 'lp-icon-badge sm outline', step = 60 }) {
  return items.map(([Icon, title, text, soon], i) => (
    <div key={title} className={`${className} lp-reveal`} style={delay(i * step)}>
      {soon && <span className="lp-badge-soon">Coming Soon</span>}
      <span className={badge}><Icon aria-hidden="true" /></span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  ));
}

function SectionHeading({ id, eyebrow, title, sub }) {
  return (
    <div className="lp-heading-block center lp-reveal">
      <span className="lp-eyebrow center">{eyebrow}</span>
      <h2 className="lp-section-title" id={id}>{title}</h2>
      {sub && <p className="lp-section-sub">{sub}</p>}
    </div>
  );
}

export default function Landing() {
  const { toggleTheme } = useTheme();
  const rootRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    const onKey = (event) => event.key === 'Escape' && setMenuOpen(false);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Fade sections in as they scroll into view (.lp-reveal starts hidden).
  useEffect(() => {
    const targets = rootRef.current.querySelectorAll('.lp-reveal');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('in-view'));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }),
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="landing-page" ref={rootRef}>
      <a href="#main-content" className="lp-skip-link">Skip to main content</a>

      <header className={`lp-header${isScrolled ? ' is-scrolled' : ''}${menuOpen ? ' is-open' : ''}`}>
        <div className="lp-header-inner">
          <BrandLogo href="#top" className="lp-logo" />
          <nav className="lp-nav" aria-label="Primary">
            {SECTIONS.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <div className="lp-header-actions">
            <button type="button" className="lp-theme-toggle" onClick={toggleTheme} aria-label="Toggle light/dark theme" title="Toggle light/dark theme">
              <Sun className="theme-icon-sun" aria-hidden="true" />
              <Moon className="theme-icon-moon" aria-hidden="true" />
            </button>
            <Link to={PATHS.LOGIN} className="lp-link-login">Login</Link>
            <Link to={PATHS.COMPANY_REGISTER} className="lp-btn lp-btn-primary">Get Started</Link>
            <button
              type="button"
              className="lp-menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="lpMobileMenu"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Menu aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="lp-mobile-menu" id="lpMobileMenu">
          {SECTIONS.map(([href, label]) => <a key={href} href={href} onClick={closeMenu}>{label}</a>)}
          <Link to={PATHS.LOGIN}>Login</Link>
          <Link to={PATHS.COMPANY_REGISTER} className="lp-btn lp-btn-primary lp-btn-block">Get Started</Link>
        </div>
      </header>

      <main id="main-content">
        <section className="lp-hero" id="top">
          <span className="lp-hero-glow lp-hero-glow-1" aria-hidden="true"></span>
          <span className="lp-hero-glow lp-hero-glow-2" aria-hidden="true"></span>
          <div className="lp-hero-inner">
            <div className="lp-hero-copy lp-reveal">
              <span className="lp-eyebrow"><Sparkles aria-hidden="true" /> Workforce &amp; HR Management Platform</span>
              <h1>Smart Workforce Management for Growing Businesses</h1>
              <p className="lp-hero-desc">
                EmpTrack brings employee records, attendance, leave, task allocation, and reporting into one connected
                platform — so HR teams and managers spend less time on admin work and more time on people.
              </p>
              <div className="lp-hero-actions lp-hero-actions-single">
                <Link to={PATHS.COMPANY_REGISTER} className="lp-btn lp-btn-primary lp-btn-lg lp-btn-hero">
                  Get Started <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="lp-hero-visual lp-reveal" style={delay(120)}>
              <div className="lp-dashboard-mock" role="img" aria-label="Preview of the EmpTrack dashboard showing weekly attendance and recent activity">
                <div className="lp-mock-titlebar">
                  <span className="lp-mock-dot" aria-hidden="true"></span>
                  <span className="lp-mock-dot" aria-hidden="true"></span>
                  <span className="lp-mock-dot" aria-hidden="true"></span>
                  <span>EmpTrack Dashboard</span>
                </div>
                <div className="lp-mock-body">
                  <div className="lp-mock-row">
                    <h4>Weekly Attendance</h4>
                    <span>+4.2%</span>
                  </div>
                  <div className="lp-mock-bars" aria-hidden="true">
                    {[55, 72, 40, 88, 64, 95, 78].map((h, i) => <span key={i} style={{ height: `${h}%` }}></span>)}
                  </div>
                  <ul className="lp-mock-list">
                    <li><CircleCheckBig aria-hidden="true" /> 3 leave requests approved today</li>
                    <li><Briefcase aria-hidden="true" /> 12 tasks marked complete</li>
                    <li><Users aria-hidden="true" /> 46 employees checked in</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-trusted" aria-labelledby="trusted-heading">
          <div className="lp-container">
            <SectionHeading
              id="trusted-heading"
              eyebrow="Built For Every Team"
              title="Suited to How Different Teams Work"
              sub="EmpTrack adapts to organizations of different sizes and structures — from a first HR hire to a multi-team enterprise."
            />
            <div className="lp-trusted-grid">
              <Cards items={AUDIENCES} className="lp-trusted-card" step={80} />
            </div>
          </div>
        </section>

        <section className="lp-features" id="features" aria-labelledby="features-heading">
          <div className="lp-container">
            <SectionHeading
              id="features-heading"
              eyebrow="Platform Features"
              title="Everything You Need to Manage Your Workforce"
              sub="From daily attendance to long-term workforce planning, EmpTrack brings the essential HR tools into a single connected system."
            />
            <div className="lp-features-grid">
              <Cards items={FEATURES} className="lp-feature-card" badge="lp-icon-badge" step={40} />
            </div>
          </div>
        </section>

        <section className="lp-why" id="solutions" aria-labelledby="why-heading">
          <div className="lp-container">
            <SectionHeading
              id="why-heading"
              eyebrow="Why EmpTrack"
              title="Built to Remove the Busywork"
              sub="A workforce platform designed around the day-to-day reality of HR and team management."
            />
            <div className="lp-why-grid">
              <Cards items={REASONS} className="lp-why-card" />
            </div>
          </div>
        </section>

        <section className="lp-ai" aria-labelledby="ai-heading">
          <div className="lp-container">
            <SectionHeading
              id="ai-heading"
              eyebrow="On the Roadmap"
              title="Built for What's Next"
              sub="EmpTrack's data foundation — attendance, tasks, and work logs — is designed to power a set of AI-assisted capabilities as the platform grows."
            />
            <div className="lp-ai-grid">
              <Cards items={ROADMAP} className="lp-ai-card" />
            </div>
            <p className="lp-ai-note lp-reveal">
              <Info aria-hidden="true" /> These capabilities are on our roadmap and not part of the current release.
            </p>
          </div>
        </section>

        <section className="lp-pricing" id="pricing" aria-labelledby="pricing-heading">
          <div className="lp-container">
            <SectionHeading
              id="pricing-heading"
              eyebrow="Pricing"
              title="Plans That Grow With Your Team"
              sub="Illustrative plans for how EmpTrack could be packaged — no payment is collected today."
            />
            <div className="lp-pricing-grid">
              {PLANS.map((plan, i) => (
                <div key={plan.name} className={`lp-price-card${plan.featured ? ' featured' : ''} lp-reveal`} style={delay(i * 80)}>
                  {plan.featured && <span className="lp-price-tag">Most Popular</span>}
                  <h3>{plan.name}</h3>
                  <p className="lp-price-desc">{plan.desc}</p>
                  <div className="lp-price-amount">{plan.price}<span>/ month</span></div>
                  <div className="lp-price-period">{plan.period}</div>
                  <ul className="lp-price-features">
                    {plan.features.map((f) => <li key={f}><CircleCheckBig aria-hidden="true" /> {f}</li>)}
                  </ul>
                  <Link to={PATHS.COMPANY_REGISTER} className={`lp-btn ${plan.featured ? 'lp-btn-primary' : 'lp-btn-secondary'} lp-btn-block`}>
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-how" aria-labelledby="how-heading">
          <div className="lp-container">
            <SectionHeading id="how-heading" eyebrow="How It Works" title="From Setup to Reports in Four Steps" />
            <div className="lp-steps">
              {STEPS.map(([title, text], i) => (
                <div key={title} className="lp-step lp-reveal" style={delay(i * 120)}>
                  <div className="lp-step-num">{i + 1}</div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-faq" id="faq" aria-labelledby="faq-heading">
          <div className="lp-container">
            <SectionHeading id="faq-heading" eyebrow="FAQ" title="Frequently Asked Questions" />
            <div className="lp-faq-list lp-reveal">
              {FAQS.map(([question, answer], i) => (
                <div key={question} className="lp-faq-item">
                  <h3>
                    <button
                      type="button"
                      className="lp-faq-trigger"
                      id={`faq-trigger-${i}`}
                      aria-controls={`faq-panel-${i}`}
                      aria-expanded={openFaq === i}
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      {question}
                      <ChevronDown aria-hidden="true" />
                    </button>
                  </h3>
                  <div className="lp-faq-panel" id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-trigger-${i}`} hidden={openFaq !== i}>
                    {answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-final-cta" aria-labelledby="cta-heading">
          <div className="lp-container">
            <div className="lp-final-cta-content">
              <h2 id="cta-heading" className="lp-reveal">Transform the Way You Manage Your Workforce</h2>
              <p className="lp-reveal" style={delay(60)}>
                Set up EmpTrack for your organization and bring attendance, tasks, and reporting into one place.
              </p>
              <div className="lp-final-cta-actions lp-reveal" style={delay(120)}>
                <Link to={PATHS.COMPANY_REGISTER} className="lp-btn lp-btn-secondary lp-btn-lg">Get Started</Link>
                <a href="mailto:info@emptrack.com" className="lp-btn lp-btn-ghost lp-btn-lg">Schedule Demo</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer" id="contact">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <BrandLogo href="#top" className="lp-logo" />
              <p>
                A workforce and HR management platform built to bring employee management, attendance, leave, and task
                tracking into one connected system.
              </p>
            </div>
            <div className="lp-footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
              </ul>
            </div>
            <div className="lp-footer-col">
              <h4>Resources</h4>
              <ul>
                <li><a href="https://github.com/IIIT-Sricity-FSD-2024-2028/6_EmpTrack#readme" target="_blank" rel="noopener noreferrer">Documentation</a></li>
                <li><a href="https://github.com/IIIT-Sricity-FSD-2024-2028/6_EmpTrack" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              </ul>
            </div>
            <div className="lp-footer-col">
              <h4>Company</h4>
              <ul>
                <li><a href="mailto:info@emptrack.com">Contact</a></li>
                <li><a href="#top">Privacy</a></li>
                <li><a href="#top">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>&copy; {new Date().getFullYear()} EmpTrack. All rights reserved.</span>
            <span>Built as part of a final-year software engineering project.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
