import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
  FiSearch, FiChevronRight, FiStar, FiSun, FiCompass,
  FiBarChart2, FiTrello, FiZap, FiRadio, FiNavigation
} from 'react-icons/fi';
import { GiPlanetCore, GiHabitatDome, GiGalaxy } from 'react-icons/gi';
import { MdOutlineScience, MdOutlineRocketLaunch } from 'react-icons/md';
import './App.css';

const API = 'http://localhost:8000';

// ── Planet image via NASA / Wikipedia fallback ──
function getPlanetImageUrl(name) {
  const encoded = encodeURIComponent(name.replace(/ /g, '_'));
  return `https://exoplanetarchive.ipac.caltech.edu/ExoplanetSearch/img/PlanetFavicon.ico`;
}

// ── Deterministic color from planet name ──
function planetColor(name = '') {
  const colors = [
    ['#ff6b35', '#ff9a56'],
    ['#06b6d4', '#0ea5e9'],
    ['#8b5cf6', '#a78bfa'],
    ['#10b981', '#34d399'],
    ['#f59e0b', '#fbbf24'],
    ['#ef4444', '#f87171'],
    ['#ec4899', '#f472b6'],
    ['#14b8a6', '#2dd4bf'],
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
  return colors[Math.abs(h)];
}

// ── Planet Visual (live-rendered gradient sphere) ──
function PlanetVisual({ name, size = 120, animate = true }) {
  const [c1, c2] = planetColor(name);
  const [c3] = planetColor(name + '_alt');

  return (
    <div
      className="planet-visual"
      style={{ width: size, height: size }}
    >
      <div
        className="planet-sphere"
        style={{
          background: `radial-gradient(circle at 32% 28%, ${c2}, ${c1} 45%, ${c3} 80%, #000 100%)`,
          boxShadow: `0 0 ${size * 0.4}px ${c1}66, 0 0 ${size * 0.8}px ${c1}22, inset -${size * 0.15}px -${size * 0.1}px ${size * 0.25}px rgba(0,0,0,0.6)`,
        }}
      >
        <div className="planet-shine" />
        <div className="planet-atmosphere" style={{ boxShadow: `0 0 ${size * 0.25}px ${size * 0.1}px ${c1}44` }} />
      </div>
      {animate && (
        <div className="planet-ring-wrap">
          <div className="planet-ring" style={{ borderColor: `${c1}55` }} />
        </div>
      )}
    </div>
  );
}

// ── Starfield ──
function Starfield() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let id;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const stars = Array.from({ length: 600 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.8 + 0.2,
      o: Math.random() * 0.8 + 0.1,
      s: Math.random() * 0.015 + 0.003,
      p: Math.random() * Math.PI * 2,
    }));
    const draw = (t) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.p += s.s;
        const o = s.o * (0.5 + 0.5 * Math.sin(s.p));
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${o})`;
        ctx.fill();
      });
      id = requestAnimationFrame(draw);
    };
    draw(0);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="starfield" />;
}

// ── Cursor ──
function Cursor() {
  const mx = useMotionValue(-100); const my = useMotionValue(-100);
  const sx = useSpring(mx, { stiffness: 300, damping: 28 });
  const sy = useSpring(my, { stiffness: 300, damping: 28 });
  useEffect(() => {
    const h = e => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);
  return (
    <>
      <motion.div className="cursor-dot" style={{ left: mx, top: my }} />
      <motion.div className="cursor-glow" style={{ left: sx, top: sy }} />
    </>
  );
}

// ── Badge ──
function TypeBadge({ type }) {
  const map = { Rocky: '#ff6b35', 'Super-Earth': '#10b981', 'Neptune-like': '#06b6d4', 'Gas Giant': '#f59e0b' };
  const c = map[type] || '#8b5cf6';
  return <span className="badge" style={{ '--bc': c }}>{type || 'Unknown'}</span>;
}
function HabBadge({ value }) {
  return value === 1
    ? <span className="badge" style={{ '--bc': '#10b981' }}>◉ Habitable Zone</span>
    : <span className="badge" style={{ '--bc': '#4b5563' }}>✕ Non-Habitable</span>;
}

// ── Info Row ──
function InfoRow({ label, value, unit }) {
  if (value == null) return null;
  const disp = typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : value;
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{disp}{unit && <em>{unit}</em>}</span>
    </div>
  );
}

// ── Planet Card ──
function PlanetCard({ data }) {
  const { planet, star, discovery } = data;
  const [c1] = planetColor(planet.name);

  const sections = [
    {
      title: 'Orbital & Physical', icon: <GiPlanetCore size={16} />, color: c1,
      rows: [
        { label: 'Orbital Period', value: planet.orbital_period, unit: ' days' },
        { label: 'Radius', value: planet.radius, unit: ' R⊕' },
        { label: 'Mass', value: planet.mass, unit: ' M⊕' },
        { label: 'Eq. Temperature', value: planet.temperature, unit: ' K' },
        { label: 'Semi-Major Axis', value: planet.semi_major, unit: ' AU' },
        { label: 'Insolation Flux', value: planet.insolation, unit: ' S⊕' },
      ]
    },
    {
      title: `Host Star · ${star.name || '?'}`, icon: <FiSun size={16} />, color: '#f59e0b',
      rows: [
        { label: 'Spectral Class', value: star.class },
        { label: 'Temperature', value: star.temperature, unit: ' K' },
        { label: 'Radius', value: star.radius, unit: ' R☉' },
        { label: 'Mass', value: star.mass, unit: ' M☉' },
        { label: 'Surface Gravity', value: star.surface_gravity, unit: ' log g' },
        { label: 'Metallicity', value: star.metallicity, unit: ' dex' },
      ]
    },
    {
      title: 'Discovery', icon: <MdOutlineRocketLaunch size={16} />, color: '#8b5cf6',
      rows: [
        { label: 'Method', value: discovery.method },
        { label: 'Year', value: discovery.year },
        { label: 'Facility', value: discovery.facility },
        { label: 'Distance', value: discovery.distance_pc, unit: ' pc' },
        { label: 'RA', value: discovery.ra, unit: '°' },
        { label: 'Dec', value: discovery.dec, unit: '°' },
      ]
    }
  ];

  return (
    <motion.div className="result-wrap" initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
      <div className="result-hero">
        <div className="result-planet-visual">
          <PlanetVisual name={planet.name} size={180} />
        </div>
        <div className="result-meta">
          <div className="result-eyebrow"><FiNavigation size={12} /> CONFIRMED EXOPLANET</div>
          <h1 className="result-name" style={{ '--glow': c1 }}>{planet.name}</h1>
          <div className="result-badges">
            <TypeBadge type={planet.type} />
            <HabBadge value={planet.habitable_zone} />
          </div>
          {planet.temperature && (
            <div className="result-temp-bar">
              <span className="rtb-label">Equilibrium Temperature</span>
              <div className="rtb-track">
                <motion.div
                  className="rtb-fill"
                  style={{ background: `linear-gradient(90deg, #06b6d4, ${c1})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((planet.temperature / 2000) * 100, 100)}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
              <span className="rtb-val">{planet.temperature} K</span>
            </div>
          )}
        </div>
      </div>

      <div className="cards-grid">
        {sections.map((sec, si) => (
          <motion.div
            key={sec.title}
            className="data-card"
            style={{ '--card-accent': sec.color }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 * si + 0.3, duration: 0.6 }}
            whileHover={{ y: -6 }}
          >
            <div className="card-head">
              <span className="card-icon-wrap" style={{ color: sec.color }}>{sec.icon}</span>
              <span className="card-title">{sec.title}</span>
              <div className="card-glow" style={{ background: sec.color }} />
            </div>
            <div className="card-body">
              {sec.rows.map((r, i) => <InfoRow key={i} {...r} />)}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════
// SEARCH PAGE
// ══════════════════════════════════════
function SearchPage() {
  const [query, setQuery] = useState('');
  const [suggestions, setSugg] = useState([]);
  const [planet, setPlanet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setSugg([]); return; }
    const t = setTimeout(async () => {
      try { const r = await axios.get(`${API}/search?q=${encodeURIComponent(query)}&limit=8`); setSugg(r.data.results); }
      catch {}
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  const search = async (name) => {
    setLoading(true); setError(''); setPlanet(null); setSugg([]); setQuery(name);
    try { const r = await axios.get(`${API}/planet/${encodeURIComponent(name)}`); setPlanet(r.data); }
    catch { setError(`No planet found matching "${name}"`); }
    setLoading(false);
  };

  const EXAMPLES = ['55 Cnc e', 'GJ 1214 b', '14 Her b', '16 Cyg B b', 'Kepler-22 b'];

  return (
    <div className="search-page">
      <motion.div className="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        <motion.div className="hero-badge" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <FiRadio size={12} className="pulse-icon" />
          NASA Exoplanet Archive · 6,231 Worlds
        </motion.div>

        <motion.h1 className="hero-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
          <span className="ht-line">Beyond Our</span>
          <span className="ht-line ht-gradient">Solar System</span>
        </motion.h1>

        <motion.p className="hero-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
          Probe the depths of confirmed exoplanet data. Search any world—uncover its orbital mechanics, stellar host, and discovery story.
        </motion.p>

        <motion.div className={`search-wrap ${focused ? 'focused' : ''}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.65 }}>
          <FiSearch size={18} className="s-icon" />
          <input
            className="s-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && query && search(query)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 160)}
            placeholder="Search any exoplanet…"
            autoFocus
          />
          <motion.button className="s-btn" onClick={() => query && search(query)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <FiZap size={15} /> Explore
          </motion.button>

          <AnimatePresence>
            {suggestions.length > 0 && focused && (
              <motion.div className="suggestions" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                {suggestions.map((s, i) => (
                  <motion.div key={s} className="sugg-item" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} onClick={() => search(s)}>
                    <div className="sugg-dot" />
                    <span>{s}</span>
                    <FiChevronRight size={13} className="sugg-arrow" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div className="examples" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>
          <span className="examples-label">Try:</span>
          {EXAMPLES.map((p, i) => (
            <motion.button key={p} className="ex-pill" onClick={() => search(p)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 + i * 0.07 }} whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.96 }}>
              {p}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loader" className="loader-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="loader-orb" />
            <span>Scanning the archive…</span>
          </motion.div>
        )}
        {error && !loading && (
          <motion.div key="err" className="error-box" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <FiCompass size={18} /> {error}
          </motion.div>
        )}
        {planet && !loading && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PlanetCard data={planet} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════
// STATS PAGE
// ══════════════════════════════════════
function StatsPage() {
  const [stats, setStats] = useState(null);
  useEffect(() => { axios.get(`${API}/stats`).then(r => setStats(r.data)).catch(() => {}); }, []);

  if (!stats) return <div className="loader-wrap"><div className="loader-orb" /><span>Loading…</span></div>;

  const typeColors = { 'Gas Giant': '#f59e0b', 'Neptune-like': '#06b6d4', 'Super-Earth': '#10b981', 'Rocky': '#ff6b35' };
  const maxFac = Math.max(...Object.values(stats.top_facilities));

  const summaries = [
    { label: 'Confirmed Worlds', value: stats.total_planets.toLocaleString(), color: '#06b6d4', icon: <GiPlanetCore size={26} /> },
    { label: 'In Habitable Zone', value: stats.habitable, color: '#10b981', icon: <GiHabitatDome size={26} /> },
    { label: 'Planet Types', value: Object.keys(stats.planet_types).length, color: '#f59e0b', icon: <FiTrello size={26} /> },
    { label: 'Stellar Classes', value: Object.keys(stats.stellar_classes).length, color: '#8b5cf6', icon: <FiStar size={26} /> },
  ];

  const charts = [
    { title: 'Planet Types', icon: <GiPlanetCore size={14} />, data: Object.entries(stats.planet_types).sort((a,b)=>b[1]-a[1]), max: stats.total_planets, color: ([t]) => typeColors[t] || '#8b5cf6' },
    { title: 'Stellar Classes', icon: <FiSun size={14} />, data: Object.entries(stats.stellar_classes).sort((a,b)=>b[1]-a[1]), max: stats.total_planets, color: () => '#06b6d4' },
    { title: 'Discovery Facilities', icon: <MdOutlineRocketLaunch size={14} />, data: Object.entries(stats.top_facilities).sort((a,b)=>b[1]-a[1]), max: maxFac, color: () => '#8b5cf6' },
  ];

  return (
    <motion.div className="stats-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <div className="page-head">
        <div className="page-eyebrow"><FiBarChart2 size={13} /> CATALOG STATISTICS</div>
        <h2 className="page-title">The Numbers</h2>
        <p className="page-sub">A live breakdown of the confirmed exoplanet catalog</p>
      </div>

      <div className="stat-cards">
        {summaries.map((s, i) => (
          <motion.div key={s.label} className="stat-card" style={{ '--sc': s.color }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -6 }}>
            <div className="sc-icon" style={{ color: s.color }}>{s.icon}</div>
            <div className="sc-val" style={{ color: s.color }}>{s.value}</div>
            <div className="sc-lbl">{s.label}</div>
            <div className="sc-glow" style={{ background: s.color }} />
          </motion.div>
        ))}
      </div>

      <div className="charts-grid">
        {charts.map((chart, ci) => (
          <motion.div key={chart.title} className="chart-card" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + ci * 0.12 }} whileHover={{ y: -4 }}>
            <div className="chart-title">{chart.icon}{chart.title}</div>
            {chart.data.map(([name, val], i) => (
              <div key={name} className="bar-row">
                <span className="bar-label">{name}</span>
                <div className="bar-track">
                  <motion.div className="bar-fill" style={{ background: chart.color([name]) }}
                    initial={{ width: 0 }} animate={{ width: `${(val / chart.max * 100).toFixed(1)}%` }}
                    transition={{ delay: 0.5 + i * 0.06, duration: 0.8, ease: 'easeOut' }} />
                </div>
                <span className="bar-count">{val.toLocaleString()}</span>
              </div>
            ))}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════
// HABITABLE PAGE - FULL WIDTH
// ══════════════════════════════════════
function HabitablePage() {
  const [planets, setPlanets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { axios.get(`${API}/habitable`).then(r => setPlanets(r.data.planets)).catch(() => {}); }, []);

  const load = async (name) => {
    setLoading(true);
    try { const r = await axios.get(`${API}/planet/${encodeURIComponent(name)}`); setSelected(r.data); }
    catch {}
    setLoading(false);
  };

  return (
    <motion.div className="habitable-page-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <div className="page-head-full">
        <div className="page-eyebrow"><GiHabitatDome size={13} /> HABITABILITY</div>
        <h2 className="page-title">Habitable Worlds</h2>
        <p className="page-sub">{planets.length} candidates in their star's habitable zone</p>
      </div>

      <div className="hab-layout-full">
        <div className="hab-list-full">
          {planets.map((p, i) => {
            const [c1] = planetColor(p.pl_name);
            const isActive = selected?.planet?.name === p.pl_name;
            return (
              <motion.div key={p.pl_name} className={`hab-item-full ${isActive ? 'active' : ''}`} style={{ '--hc': c1 }}
                onClick={() => load(p.pl_name)} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.01 }} whileHover={{ x: 5 }}>
                <div className="hi-orb-full"><PlanetVisual name={p.pl_name} size={42} animate={false} /></div>
                <div className="hi-info-full">
                  <div className="hi-name-full">{p.pl_name}</div>
                  <div className="hi-meta-full">
                    {p.stellar_class && <span>Type {p.stellar_class}</span>}
                    {p.pl_eqt && <span>{Math.round(p.pl_eqt)} K</span>}
                    {p.disc_year && <span>{p.disc_year}</span>}
                  </div>
                </div>
                <FiChevronRight className="hi-arrow-full" size={14} />
              </motion.div>
            );
          })}
        </div>

        <div className="hab-detail-full">
          <AnimatePresence mode="wait">
            {loading && <motion.div key="l" className="loader-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="loader-orb" /><span>Loading…</span></motion.div>}
            {!loading && selected && <motion.div key="d" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><PlanetCard data={selected} /></motion.div>}
            {!loading && !selected && (
              <motion.div key="e" className="empty-state-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="empty-orb-full" />
                <p>Select a planet to explore</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════
export default function App() {
  const [page, setPage] = useState('search');
  const NAV = [
    { id: 'search', label: 'Search', icon: <FiSearch size={15} /> },
    { id: 'stats', label: 'Statistics', icon: <FiBarChart2 size={15} /> },
    { id: 'habitable', label: 'Habitable', icon: <GiHabitatDome size={15} /> },
  ];

  return (
    <div className="app">
      <video className="bg-video" autoPlay loop muted playsInline>
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <div className="bg-overlay" />
      <Starfield />
      <Cursor />

      <div className="nebulae">
        <div className="neb n1" />
        <div className="neb n2" />
        <div className="neb n3" />
      </div>

      <motion.nav className="navbar" initial={{ opacity: 0, y: -28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
        <div className="nav-brand">
          <GiGalaxy size={24} className="nav-logo-icon" />
          <span className="nav-wordmark">EXOPLANET<em>DB</em></span>
        </div>
        <div className="nav-links">
          {NAV.map(item => (
            <button key={item.id} className={`nav-btn ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}>
              {item.icon}
              <span>{item.label}</span>
              {page === item.id && <motion.div className="nav-pill" layoutId="pill" />}
            </button>
          ))}
        </div>
      </motion.nav>

      <main className="main">
        <AnimatePresence mode="wait">
          {page === 'search' && <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}><SearchPage /></motion.div>}
          {page === 'stats' && <motion.div key="st" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}><StatsPage /></motion.div>}
          {page === 'habitable' && <motion.div key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}><HabitablePage /></motion.div>}
        </AnimatePresence>
      </main>
    </div>
  );
}