import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, BarChart3, ShoppingCart, Package, Users, Shield,
  Zap, Globe, ArrowRight, CheckCircle, Star, TrendingUp,
  Receipt, Settings, Activity, ChevronRight, Sparkles,
  Lock, Clock, Layers, Monitor, Cpu, Database
} from 'lucide-react';

// ─── Animated Counter Hook ────────────────────────────────────────────────────
const useCounter = (end, duration = 2000, start = 0) => {
  const [count, setCount] = useState(start);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * (end - start) + start));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, start, duration]);

  return [count, setStarted];
};

// ─── Intersection Observer Hook ───────────────────────────────────────────────
const useInView = (threshold = 0.1) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
};

// ─── Stat Counter Component ───────────────────────────────────────────────────
const StatCounter = ({ value, suffix, label, inView }) => {
  const [count, setStarted] = useCounter(value, 2200);
  useEffect(() => { if (inView) setStarted(true); }, [inView]);
  return (
    <div className="text-center">
      <div className="text-4xl font-black text-white tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-slate-400 mt-1 font-medium">{label}</div>
    </div>
  );
};

// ─── Feature Card ─────────────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, desc, color, delay }) => (
  <div
    className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/40 transition-all duration-500 hover:-translate-y-1 overflow-hidden"
    style={{ animationDelay: delay }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <h3 className="font-bold text-slate-100 text-base mb-2">{title}</h3>
    <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

// ─── Pricing Card ─────────────────────────────────────────────────────────────
const PricingCard = ({ plan, price, features, highlighted, badge }) => (
  <div className={`relative rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1 ${
    highlighted
      ? 'bg-indigo-600/10 border-indigo-500/50 shadow-xl shadow-indigo-900/20'
      : 'bg-slate-900/60 border-slate-800/80'
  }`}>
    {badge && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">{badge}</span>
      </div>
    )}
    <div className="mb-5">
      <h3 className="font-bold text-slate-100 text-lg">{plan}</h3>
      <div className="mt-3 flex items-end gap-1">
        <span className="text-4xl font-black text-white">{price}</span>
        {price !== 'Custom' && <span className="text-slate-400 text-sm mb-1">/month</span>}
      </div>
    </div>
    <ul className="space-y-3 mb-7">
      {features.map((f, i) => (
        <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          {f}
        </li>
      ))}
    </ul>
    <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
      highlighted
        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-700/30'
        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
    }`}>
      Get Started
    </button>
  </div>
);

// ─── Testimonial Card ─────────────────────────────────────────────────────────
const TestimonialCard = ({ name, role, company, text, stars }) => (
  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/80 transition-all duration-300">
    <div className="flex gap-0.5 mb-4">
      {[...Array(stars)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
    <p className="text-sm text-slate-300 leading-relaxed mb-5">"{text}"</p>
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm">
        {name[0]}
      </div>
      <div>
        <div className="font-semibold text-slate-100 text-sm">{name}</div>
        <div className="text-xs text-slate-500">{role} · {company}</div>
      </div>
    </div>
  </div>
);

// ─── Main Landing Page ────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const [statsRef, statsInView] = useInView(0.3);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: ShoppingCart, title: 'POS Billing Terminal', desc: 'Lightning-fast point-of-sale with barcode scanning, real-time inventory deduction, and instant receipt generation.', color: 'bg-indigo-600/20 text-indigo-400', delay: '0ms' },
    { icon: Package, title: 'Inventory Control', desc: 'Full product catalog management with stock tracking, low-stock alerts, and category organization.', color: 'bg-violet-600/20 text-violet-400', delay: '50ms' },
    { icon: BarChart3, title: 'Sales Analytics', desc: 'Deep revenue insights with interactive charts, period comparisons, and exportable CSV reports.', color: 'bg-emerald-600/20 text-emerald-400', delay: '100ms' },
    { icon: Receipt, title: 'Invoice History', desc: 'Searchable invoice archive with QR codes, print support, and full refund management workflows.', color: 'bg-cyan-600/20 text-cyan-400', delay: '150ms' },
    { icon: Users, title: 'Admin Management', desc: 'Role-based access control with CEO and Admin roles, activity tracking, and account lifecycle management.', color: 'bg-rose-600/20 text-rose-400', delay: '200ms' },
    { icon: Activity, title: 'Activity Audit Logs', desc: 'Complete immutable audit trail of every login, sale, product change, and system event with timestamps.', color: 'bg-amber-600/20 text-amber-400', delay: '250ms' },
    { icon: Settings, title: 'Shop Configuration', desc: 'Customize shop name, logo, currency, tax rates, and receipt footer from a unified settings panel.', color: 'bg-pink-600/20 text-pink-400', delay: '300ms' },
    { icon: Zap, title: 'Real-Time Updates', desc: 'Socket.io powered live dashboard that updates sales and inventory across all connected terminals instantly.', color: 'bg-orange-600/20 text-orange-400', delay: '350ms' },
    { icon: Shield, title: 'Enterprise Security', desc: 'JWT + refresh token rotation, bcrypt hashing, rate limiting, Helmet headers, and CORS protection built-in.', color: 'bg-teal-600/20 text-teal-400', delay: '400ms' },
  ];

  const stats = [
    { value: 50000, suffix: '+', label: 'Transactions Processed' },
    { value: 99, suffix: '.9%', label: 'Uptime Guarantee' },
    { value: 2500, suffix: '+', label: 'Active Merchants' },
    { value: 12, suffix: 'ms', label: 'Avg. Response Time' },
  ];

  const testimonials = [
    { name: 'Kamran Malik', role: 'CEO', company: 'Malik Electronics', text: 'The POS terminal is blazing fast. Our checkout time dropped by 60% and the live inventory updates across our two stores are a game changer.', stars: 5 },
    { name: 'Sana Riaz', role: 'Operations Manager', company: 'FreshMart', text: 'Finally an ERP that our staff actually enjoys using. The role-based access is perfect — my CEO view is completely separate from what my cashiers see.', stars: 5 },
    { name: 'Ahmed Farooq', role: 'Owner', company: 'Farooq Traders', text: 'The sales reports helped me identify my top products and I doubled revenue in 3 months. The invoice system with QR codes is incredibly professional.', stars: 5 },
  ];

  const techStack = [
    { icon: Monitor, label: 'React 18', sub: 'Frontend' },
    { icon: Cpu, label: 'Node.js', sub: 'Runtime' },
    { icon: Database, label: 'MongoDB', sub: 'Database' },
    { icon: Zap, label: 'Socket.io', sub: 'Real-time' },
    { icon: Lock, label: 'JWT Auth', sub: 'Security' },
    { icon: Layers, label: 'RESTful API', sub: 'Architecture' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">

      {/* ── Ambient Background Gradients ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-violet-600/6 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[80px]" />
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800/50 shadow-xl shadow-slate-950/40' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Store className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-indigo-300 to-slate-100 bg-clip-text text-transparent">
              MerchantERP
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-slate-100 transition-colors">Features</a>
            <a href="#stats" className="hover:text-slate-100 transition-colors">Stats</a>
            <a href="#pricing" className="hover:text-slate-100 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-slate-100 transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-indigo-700/30"
            >
              Launch ERP <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-36 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-600/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Enterprise Merchant ERP — v2.0 Now Live
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
            <span className="text-white">Run Your Store</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
              Like an Enterprise
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            A full-stack merchant management platform with POS billing, real-time inventory,
            deep sales analytics, and role-based access control — built for serious businesses.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-7 py-3.5 rounded-2xl text-sm transition-all duration-200 shadow-2xl shadow-indigo-700/40 hover:shadow-indigo-600/40 hover:-translate-y-0.5"
            >
              Access ERP System <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold px-7 py-3.5 rounded-2xl text-sm transition-all duration-200 hover:-translate-y-0.5"
            >
              <Store className="w-4 h-4 text-indigo-400" /> Try Demo Account
            </button>
          </div>

          {/* Trust Bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            {['No credit card required', 'Free demo account', 'Instant setup', 'SOC 2 compliant'].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 max-w-5xl mx-auto relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950 z-10 pointer-events-none" style={{ top: '60%' }} />
          <div className="rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl shadow-slate-950/80">
            {/* Browser chrome */}
            <div className="bg-slate-900 px-4 py-3 flex items-center gap-2 border-b border-slate-800">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-slate-800 rounded-md px-3 py-1 text-xs text-slate-500 max-w-xs mx-auto text-center">
                  localhost:5175/dashboard
                </div>
              </div>
            </div>
            <img
              src="/landing-dashboard.jpg"
              alt="MerchantERP Dashboard"
              className="w-full"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.style.minHeight = '340px';
                e.target.parentElement.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)';
                e.target.parentElement.innerHTML += `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:48px">
                  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;width:100%;max-width:700px">
                    ${['$184,320', '4,892 Units', '731 Users', '4.15%'].map((v, i) => `<div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);border-radius:12px;padding:16px;text-align:center"><div style="color:#a5b4fc;font-size:11px;margin-bottom:6px">${['Revenue','Sales','Customers','Conversion'][i]}</div><div style="color:#fff;font-weight:900;font-size:18px">${v}</div></div>`).join('')}
                  </div>
                  <div style="width:100%;max-width:700px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);border-radius:12px;padding:20px;height:120px;display:flex;align-items:center;justify-content:center;color:#4f46e5;font-size:13px;font-weight:600">📊 Revenue & Sales Chart — Real-time</div>
                </div>`;
              }}
            />
          </div>
          <div className="absolute -inset-8 bg-indigo-600/5 rounded-3xl -z-10 blur-2xl" />
        </div>
      </section>

      {/* ── Stats Section ─────────────────────────────────────────────────── */}
      <section id="stats" ref={statsRef} className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-600/10 to-violet-600/5 border border-indigo-500/20 rounded-3xl px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((s, i) => (
                <StatCounter key={i} {...s} inView={statsInView} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-600/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <Layers className="w-3.5 h-3.5" />
              Everything You Need
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Built for Real Merchants
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Every feature was designed based on actual retail challenges — from the POS counter to the executive boardroom.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">How It Works</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Get your entire business running in three steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            {[
              { step: '01', icon: Shield, title: 'Setup CEO Account', desc: 'Bootstrap your ERP with a CEO master account. Your data is isolated and encrypted from day one.', color: 'text-indigo-400 bg-indigo-600/15' },
              { step: '02', icon: Users, title: 'Invite Your Team', desc: 'Create Admin accounts for your cashiers and staff. Each role sees exactly what they need — nothing more.', color: 'text-violet-400 bg-violet-600/15' },
              { step: '03', icon: TrendingUp, title: 'Start Selling', desc: 'Open the POS terminal, scan products, issue invoices, and watch your dashboard populate in real-time.', color: 'text-emerald-400 bg-emerald-600/15' },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="text-center relative">
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mx-auto mb-5 border border-current/20`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-xs font-black text-slate-600 tracking-widest mb-2">{step}</div>
                <h3 className="font-bold text-slate-100 text-lg mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-6 border-y border-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-600 uppercase tracking-widest mb-10">Powered by battle-tested technology</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
            {techStack.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center group">
                <div className="w-12 h-12 mx-auto bg-slate-800/60 border border-slate-700/50 rounded-xl flex items-center justify-center mb-2 group-hover:border-indigo-500/30 group-hover:bg-indigo-600/10 transition-all duration-300">
                  <Icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                <div className="text-xs font-bold text-slate-300">{label}</div>
                <div className="text-[10px] text-slate-600">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/25 text-violet-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <Star className="w-3.5 h-3.5" />
              Simple Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Choose Your Plan</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              All plans include the full feature set. Scale as your business grows.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PricingCard
              plan="Starter"
              price="Free"
              features={['1 Store Location', '2 Admin Accounts', 'POS Billing Terminal', 'Basic Sales Reports', 'Invoice History (30 days)', 'Email Support']}
            />
            <PricingCard
              plan="Business"
              price="$29"
              badge="Most Popular"
              highlighted
              features={['3 Store Locations', '10 Admin Accounts', 'Advanced Analytics', 'Full Invoice Archive', 'Activity Audit Logs', 'Real-time Dashboard', 'Priority Support']}
            />
            <PricingCard
              plan="Enterprise"
              price="Custom"
              features={['Unlimited Locations', 'Unlimited Admins', 'Custom Integrations', 'Dedicated Database', 'SLA Guarantee', 'White-label Option', '24/7 Phone Support']}
            />
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section id="testimonials" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Loved by Merchants</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Real businesses, real results.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => <TestimonialCard key={i} {...t} />)}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-indigo-600/5 border border-indigo-500/30 rounded-3xl px-8 py-16 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,rgba(99,102,241,0.12)_0%,transparent_70%)] pointer-events-none" />
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-6">
              <Store className="w-7 h-7 text-indigo-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Join thousands of merchants who have streamlined their operations with MerchantERP.
              Start for free — no credit card, no commitment.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-2xl text-sm transition-all duration-200 shadow-2xl shadow-indigo-700/40 hover:-translate-y-0.5"
              >
                Get Started Free <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-3.5 rounded-2xl text-sm transition-all duration-200 hover:-translate-y-0.5"
              >
                View Live Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-800/60 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Store className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="font-black text-base bg-gradient-to-r from-indigo-300 to-slate-100 bg-clip-text text-transparent">
                MerchantERP
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              {['Features', 'Pricing', 'Privacy Policy', 'Terms of Service', 'Support'].map((l) => (
                <a key={l} href="#" className="hover:text-slate-300 transition-colors">{l}</a>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-800/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              © 2026 MerchantERP. Built with ❤️ by Asad Ali. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;