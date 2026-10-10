import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
const P: Record<string, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  cpu: <><rect x="5" y="5" width="14" height="14" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /></>,
  jobs: <path d="M10 6h11M10 12h11M10 18h11M3.5 6.5l1.5 1.5 3-3M3.5 12.5l1.5 1.5 3-3M3.5 18.5l1.5 1.5 3-3" />,
  terminal: <path d="m4 17 6-6-6-6M12 19h8" />,
  chart: <><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 5-6" /></>,
  shield: <><path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  monitor: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  server: <><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="13" width="18" height="7" rx="2" /><path d="M7 7.5h.01M7 16.5h.01" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.8.7 3 2.3 3.3 5.2" /></>,
  coins: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>,
  audit: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4h6v3H9zM9 14l2 2 4-4" /></>,
  pause: <path d="M8 5v14M16 5v14" />,
  play: <path d="M7 4l13 8-13 8z" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  exit: <path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9" />,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  admin: <><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  bell: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" />,
  arrow: <path d="M7 17 17 7M8 7h9v9" />,
  plus: <path d="M12 5v14M5 12h14" />,
  panel: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 3v18" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  log: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h7M9 17h7" /></>,
  check: <path d="m5 12 5 5 9-10" />,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></>,
}
export const Icon = ({ n, size = 18 }: { n: string; size?: number }) =>
  <svg className="ic" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[n]}</svg>

// Navigation icon in a soft rounded tile (accent-filled when the item is active).
export const NavIcon = ({ n }: { n: string }) => <span className="navic"><Icon n={n} size={18} /></span>

// Decorative ambient waves: two slowly drifting groups of fine strokes (transform-only animation).
export function Waves({ className = '' }: { className?: string }) {
  const lines = useMemo(() => Array.from({ length: 16 }, (_, i) => { const y = 40 + i * 14; return `M-120 ${y + 60} C 180 ${y - 40}, 380 ${y + 130}, 700 ${y + 20} S 1100 ${y - 60}, 1360 ${y + 40}` }), [])
  return <svg className={`waves ${className}`} viewBox="0 0 1200 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <g className="w1">{lines.slice(0, 9).map((d, i) => <path key={i} d={d} />)}</g>
    <g className="w2">{lines.slice(7).map((d, i) => <path key={i} d={d} transform="translate(0,26)" />)}</g></svg>
}

// Line/area chart from real points only. Hover shows a tooltip.
export function AreaChart({ pts, label }: { pts: { label: string; v: number }[]; label: string }) {
  const [hi, setHi] = useState<number | null>(null)
  const W = 560, H = 210, l = 36, r = 12, t = 14, b = 26
  const max = Math.max(10, ...pts.map(p => p.v)), top = Math.ceil(max / 4 / 5) * 5 * 4
  const X = (i: number) => l + (i * (W - l - r)) / Math.max(1, pts.length - 1), Y = (v: number) => t + (1 - v / top) * (H - t - b)
  const line = pts.map((p, i) => { if (!i) return `M${X(0)} ${Y(p.v)}`; const a = X(i - 1), c = X(i), m = (a + c) / 2; return `C${m} ${Y(pts[i - 1].v)} ${m} ${Y(p.v)} ${c} ${Y(p.v)}` }).join(' ')
  const area = `${line} L${X(pts.length - 1)} ${H - b} L${X(0)} ${H - b} Z`
  return <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${pts.map(p => `${p.label} ${p.v}`).join(', ')}`}
    onMouseLeave={() => setHi(null)} onMouseMove={e => { const bb = e.currentTarget.getBoundingClientRect(), x = ((e.clientX - bb.left) / bb.width) * W; setHi(pts.reduce((best, _p, i) => (Math.abs(X(i) - x) < Math.abs(X(best) - x) ? i : best), 0)) }}>
    <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity=".28" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
    {[0, 1, 2, 3, 4].map(k => { const v = (top / 4) * k; return <g key={k}><line x1={l} x2={W - r} y1={Y(v)} y2={Y(v)} className="grid-l" /><text x={l - 6} y={Y(v) + 4} textAnchor="end" className="ax">{v}</text></g> })}
    {pts.map((p, i) => <text key={i} x={X(i)} y={H - 6} textAnchor="middle" className="ax">{p.label}</text>)}
    <path d={area} fill="url(#ag)" className="area" /><path d={line} pathLength={1} className="ln" />
    {pts.map((p, i) => <circle key={i} cx={X(i)} cy={Y(p.v)} r={hi === i ? 5 : 3} className="pt" />)}
    {hi !== null && <g className="tip" transform={`translate(${Math.min(Math.max(X(hi), 50), W - 50)},${Math.max(Y(pts[hi].v) - 34, 2)})`}><rect x="-44" width="88" height="26" rx="8" /><text y="17" textAnchor="middle">{pts[hi].label}: {pts[hi].v}</text></g>}
  </svg>
}
export function Hatched({ data }: { data: { k: string; v: number }[] }) {
  const mx = Math.max(...data.map(d => d.v)), lead = data.findIndex(d => d.v === mx)
  return <div className="hbars" role="img" aria-label={`Credits charged by workload: ${data.map(d => `${d.k} ${d.v}`).join(', ')}`}>
    {data.map((d, i) => <div key={d.k}><span className="val">{d.v}</span><i className={i === lead && mx > 0 ? 'solid' : ''} style={{ height: `${Math.max(6, (d.v / Math.max(1, mx)) * 100)}%` }} /><span>{d.k}</span></div>)}</div>
}

// True unless the person chose Reduced, or left it on System and the OS asks for reduced motion.
export const motionOn = () => { const m = document.documentElement.dataset.motion; return m === 'full' || (m !== 'reduced' && !matchMedia('(prefers-reduced-motion: reduce)').matches) }
// Counts up only when the value changes (and once on first show). Screen readers always get the real value.
export function CountUp({ value }: { value: number }) {
  const start = useRef(motionOn() ? 0 : value), [v, setV] = useState(start.current)
  useEffect(() => {
    if (!motionOn()) { setV(value); start.current = value; return }
    const a = start.current, t0 = performance.now(); let id = 0
    const step = (t: number) => { const k = Math.min(1, (t - t0) / 700); setV(Math.round(a + (value - a) * (1 - Math.pow(1 - k, 3)))); if (k < 1) id = requestAnimationFrame(step); else start.current = value }
    id = requestAnimationFrame(step); return () => cancelAnimationFrame(id)
  }, [value])
  return <span><span aria-hidden="true">{v}</span><span className="sr">{value}</span></span>
}
