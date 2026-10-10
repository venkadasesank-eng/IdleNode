import { useEffect, useMemo, useRef, useState } from 'react'
import * as m from './model'
import { Icon, NavIcon, Waves, AreaChart, Hatched, CountUp, motionOn } from './ui'
import AdminPanel from './Admin'

type Page = 'Overview' | 'Compute Resources' | 'My Jobs' | 'Activity Log' | 'Remote Workspace' | 'Usage & Limits'
const PAGES: Page[] = ['Overview', 'Compute Resources', 'My Jobs', 'Activity Log', 'Remote Workspace', 'Usage & Limits']
const ICONS = ['grid', 'cpu', 'jobs', 'log', 'terminal', 'chart']
const PAGE_ICON: Record<string, string> = Object.fromEntries(PAGES.map((p, i) => [p, ICONS[i]]))
const HELP: Record<Page, string> = {
  Overview: 'A quick summary: how many credits you have left, your running jobs and which computers are free.',
  'Compute Resources': 'Pick a computer to run your work on. Green "available" ones are ready; others are busy, in maintenance or the lab is closed.',
  'My Jobs': 'Your submitted jobs. A job waits in the queue until you press Start, and you press Finish when it is done.',
  'Activity Log': 'A history of everything that happened to your jobs and credits, including actions by administrators.',
  'Remote Workspace': 'A preview of the terminal and files you would use on a node. Nothing here is real yet.',
  'Usage & Limits': 'How many credits you get each day, how many you have used, and a download of your usage.',
}
const Sim = ({ children }: { children: string }) => <p className="note">Simulated: {children}</p>

export default function App() {
  const init = useRef(m.loadState()).current
  const [s, setS] = useState(init.state)
  const [page, setPage] = useState<Page>('Overview')
  const [nav, setNav] = useState(false)
  const [toast, setToast] = useState(init.recovered ? 'Saved data was unreadable; defaults restored.' : '')
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('idlenode-theme') ?? 'system' } catch { return 'system' } })
  const [palette, setPalette] = useState(false)
  const [side, setSide] = useState(false)
  const [admin, setAdmin] = useState(() => location.hash === '#/admin'), [menu, setMenu] = useState(false)
  useEffect(() => { const h = () => { setAdmin(location.hash === '#/admin'); setMenu(false) }; addEventListener('hashchange', h); return () => removeEventListener('hashchange', h) }, [])
  const openAdmin = () => { location.hash = '#/admin'; setNav(false); setPalette(false) }
  const exitAdmin = () => { history.replaceState(null, '', location.pathname + location.search); setAdmin(false) }
  const [motion, setMotion] = useState(() => { try { return localStorage.getItem('idlenode-motion') ?? 'full' } catch { return 'full' } })
  useEffect(() => { document.documentElement.dataset.motion = motion; try { localStorage.setItem('idlenode-motion', motion) } catch { /* ignore */ } }, [motion])
  useEffect(() => m.saveState(s), [s])
  useEffect(() => { // single timer; cleaned up on unmount so StrictMode cannot double it
    const t = setInterval(() => setS(x => m.rollover(m.tick(x), new Date())), 2000); return () => clearInterval(t)
  }, [])
  useEffect(() => {
    const apply = () => { const d = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme = d ? 'dark' : 'light'; document.querySelector('meta[name=theme-color]')?.setAttribute('content', d ? '#14201c' : '#f7f3ea') }
    apply(); try { localStorage.setItem('idlenode-theme', theme) } catch { /* ignore */ }
    const mq = matchMedia('(prefers-color-scheme: dark)'); mq.addEventListener('change', apply); return () => mq.removeEventListener('change', apply)
  }, [theme])
  useEffect(() => { const k = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(p => !p) } if (e.key === 'Escape') { setPalette(false); setNav(false) } }; addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [])
  useEffect(() => { // pointer parallax for the wave background: one rAF-throttled listener, off when motion is off
    let raf = 0; const mv = (e: PointerEvent) => { if (raf || !motionOn()) return; raf = requestAnimationFrame(() => { raf = 0; const r = document.documentElement.style; r.setProperty('--px', String(e.clientX / innerWidth - 0.5)); r.setProperty('--py', String(e.clientY / innerHeight - 0.5)) }) }
    addEventListener('pointermove', mv, { passive: true }); return () => { removeEventListener('pointermove', mv); cancelAnimationFrame(raf) }
  }, [])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 4000); return () => clearTimeout(t) }, [toast])

  const act = (r: m.Res, msg: string) => { if (r.ok) { setS(r.state); setToast(msg) } else setToast(r.error); return r.ok }
  const go = (p: Page) => { setPage(p); setNav(false); setPalette(false) }
  const unread = s.activity.filter(a => !a.read).length

  const icons = ICONS
  if (admin) return <div className="frame adminframe"><AdminPanel s={s} setS={setS} setToast={setToast} exit={exitAdmin} /><div className="toast" role="status" aria-live="polite">{toast}</div></div>
  return <div className="frame"><Waves className="bgwaves" />
    <div className={side ? 'shell slim' : 'shell'}>
    <a className="skip" href="#main">Skip to content</a>
    <aside className={nav ? 'side open' : 'side'} aria-label="Primary">
      <div className="brand"><span className="logo">I</span><span className="lbl">IdleNode</span></div>
      <nav><span className="ind" style={{ transform: `translateY(${PAGES.indexOf(page) * 52}px)` }} />
        {PAGES.map((p, i) => <button key={p} title={p} aria-label={p} className={p === page ? 'nav on' : 'nav'} aria-current={p === page ? 'page' : undefined} onClick={() => go(p)}><NavIcon n={icons[i]} /><span className="lbl">{p}</span></button>)}</nav>
      <button className="nav adminnav" title="Admin Panel" aria-label="Admin Panel" onClick={openAdmin}><NavIcon n="shield" /><span className="lbl">Admin Panel</span></button>
      <button className="nav collapse" title="Collapse sidebar" aria-label="Collapse sidebar" aria-pressed={side} onClick={() => setSide(v => !v)}><NavIcon n="panel" /><span className="lbl">Collapse</span></button>
    </aside>
    {nav && <div className="scrim" onClick={() => setNav(false)} />}
    <div className="col">
      <header>
        <button className="icon menu" aria-label="Open navigation" onClick={() => setNav(true)}><Icon n="menu" /></button>
        <h1>{page}</h1>
        <div className="grow" />
        <button className="searchpill" onClick={() => setPalette(true)} aria-label="Open search and command palette (Ctrl+K)"><Icon n="search" size={16} /><span>Search pages</span><kbd>Ctrl K</kbd></button>
        <label className="sel">Theme<select value={theme} onChange={e => setTheme(e.target.value)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
        <label className="sel">Motion<select value={motion} onChange={e => setMotion(e.target.value)}><option value="system">System</option><option value="reduced">Reduced</option><option value="full">Full</option></select></label>
        <button className="icon" title={unread ? `${unread} new in your activity log` : 'Activity log'} aria-label={`${unread} new activity items. Open activity log`} onClick={() => { go('Activity Log') }}><Icon n="bell" />{unread > 0 && <b className="dot">{unread}</b>}</button>
        <div className="acct"><button className="avatar" aria-label="Account menu" aria-haspopup="menu" aria-expanded={menu} title="Account menu" onClick={() => setMenu(v => !v)}>S</button>
          {menu && <><div className="scrim2" onClick={() => setMenu(false)} /><div className="menu-pop card" role="menu">
            <p className="muted">Simulated student profile (no real login)</p>
            <button role="menuitem" className="ghost" onClick={() => { setMenu(false); openAdmin() }}><Icon n="shield" size={16} />Admin panel</button>
            <button role="menuitem" className="ghost" onClick={() => { setMenu(false); go('Usage & Limits') }}><Icon n="chart" size={16} />Usage &amp; limits</button></div></>}</div>
      </header>
      <main id="main"><p className="pagehelp"><Icon n="help" size={16} />{HELP[page]}</p><div className="page" key={page}>
        {page === 'Overview' && <Overview s={s} go={go} />}
        {page === 'Compute Resources' && <Resources s={s} act={act} />}
        {page === 'My Jobs' && <Jobs s={s} act={act} />}
        {page === 'Activity Log' && <ActivityLog s={s} setS={setS} />}
        {page === 'Remote Workspace' && <Workspace />}
        {page === 'Usage & Limits' && <Usage s={s} />}
      </div></main>
    </div></div>
    {palette && <Palette go={go} openAdmin={openAdmin} close={() => setPalette(false)} />}
    <div className="toast" role="status" aria-live="polite">{toast}</div>
  </div>
}
type Act = (r: m.Res, msg: string) => boolean

function Guide({ s, go }: { s: m.State; go: (p: Page) => void }) {
  const [hide, setHide] = useState(() => { try { return localStorage.getItem('idlenode-guide') === 'hidden' } catch { return false } })
  const steps: { t: string; d: string; done: boolean; to: Page; b: string }[] = [
    { t: 'Pick a computer', d: 'Open Compute Resources and choose one that says "available".', done: s.jobs.length > 0, to: 'Compute Resources', b: 'Browse resources' },
    { t: 'Submit a job', d: 'Choose the type of work and how many minutes you need. Credits are set aside for it.', done: s.jobs.length > 0, to: 'Compute Resources', b: 'Submit a job' },
    { t: 'Start and finish it', d: 'In My Jobs press Start, then Finish when you are done. You only pay for what you used.', done: s.jobs.some(j => j.status === 'completed'), to: 'My Jobs', b: 'Open My Jobs' },
  ]
  const all = steps.every(x => x.done)
  if (hide) return <button className="ghost helpbtn" onClick={() => { setHide(false); try { localStorage.removeItem('idlenode-guide') } catch { /* ignore */ } }}><Icon n="help" size={16} />Show getting-started guide</button>
  const next = steps.findIndex(x => !x.done)
  return <section className="card guide" aria-label="Getting started">
    <div className="row between"><h2>{all ? 'You have run a job. Nice work!' : 'New here? Three easy steps'}</h2><button className="ghost" onClick={() => { setHide(true); try { localStorage.setItem('idlenode-guide', 'hidden') } catch { /* ignore */ } }}>Hide guide</button></div>
    <ol className="steps">{steps.map((x, i) => <li key={x.t} className={x.done ? 'done' : i === next ? 'now' : ''}><span className="num">{x.done ? <Icon n="check" size={16} /> : i + 1}</span><div><strong>{x.t}</strong><p className="muted">{x.d}</p>{i === next && <button onClick={() => go(x.to)}>{x.b}</button>}</div></li>)}</ol></section>
}
function ActivityLog({ s, setS }: { s: m.State; setS: (f: (x: m.State) => m.State) => void }) {
  const [kind, setKind] = useState(''), [q, setQ] = useState('')
  const KIND: Record<string, string> = { job: 'Job', admin: 'Admin', system: 'System' }
  const kindOf = (a: m.Activity) => a.kind ?? 'job'
  const rows = s.activity.filter(a => (!kind || kindOf(a) === kind) && (!q || a.text.toLowerCase().includes(q.toLowerCase())))
  const unread = s.activity.filter(a => !a.read).length
  const days: [string, m.Activity[]][] = []; for (const a of rows) { const d = new Date(a.at).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }); const g = days.find(x => x[0] === d); g ? g[1].push(a) : days.push([d, [a]]) }
  const count = (k: string) => s.activity.filter(a => kindOf(a) === k).length
  const dl = () => { const c = (v: string) => `"${v.replace(/"/g, '""')}"`, body = ['time,type,event', ...s.activity.map(a => [c(a.at), c(KIND[kindOf(a)]), c(a.text)].join(','))].join('\r\n'); const el = document.createElement('a'); el.href = URL.createObjectURL(new Blob(['\uFEFF' + body], { type: 'text/csv;charset=utf-8' })); el.download = `idlenode-activity-${s.date}.csv`; el.click(); URL.revokeObjectURL(el.href) }
  return <>
    <div className="row">
      <label>Search<input value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. finished, credits" /></label>
      <label>Show<select value={kind} onChange={e => setKind(e.target.value)}><option value="">Everything ({s.activity.length})</option><option value="job">My jobs ({count('job')})</option><option value="admin">Administrator actions ({count('admin')})</option><option value="system">System notices ({count('system')})</option></select></label>
      <button className="ghost" disabled={unread === 0} onClick={() => setS(x => ({ ...x, activity: x.activity.map(a => ({ ...a, read: true })) }))}>Mark all as read{unread ? ` (${unread})` : ''}</button>
      <button className="ghost" disabled={s.activity.length === 0} onClick={dl}>Download CSV</button></div>
    {s.activity.length === 0 && <div className="card empty"><strong>Nothing here yet</strong><p className="muted">When you submit, start or finish a job, it will be listed here with the time.</p></div>}
    {s.activity.length > 0 && rows.length === 0 && <p className="card muted">No entries match. Try clearing the search or choosing "Everything".</p>}
    {days.map(([d, list]) => <div className="card" key={d}><h2>{d}</h2><ul className="timeline">{list.map(a => <li key={a.id} className={a.read ? '' : 'unread'}><time>{new Date(a.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time><span className={`pill ${kindOf(a) === 'admin' ? 'running' : kindOf(a) === 'system' ? 'maintenance' : 'available'}`}>{KIND[kindOf(a)]}</span><span className="ev">{a.text}</span>{!a.read && <b className="newtag">New</b>}</li>)}</ul></div>)}
    <p className="note">Your log keeps the latest 200 entries and is stored only in this browser.</p>
  </>
}
function Gauge({ s }: { s: m.State }) {
  const tot = Math.max(1, m.allowanceTotal(s)), c = Math.min(100, (s.consumed / tot) * 100), r = Math.min(100 - c, (m.reserved(s) / tot) * 100)
  return <div><div className="seg" role="progressbar" aria-valuenow={m.usedPct(s)} aria-valuemin={0} aria-valuemax={100} aria-label="Credits consumed or reserved"><i className="c" style={{ width: `${c}%` }} /><i className="r" style={{ width: `${r}%` }} /><b className="mark" title="80% warning" /></div>
    <ul className="legend"><li><i className="c" />Consumed {s.consumed}</li><li><i className="r" />Reserved {m.reserved(s)}</li><li><i className="a" />Available {m.available(s)}</li></ul>
    <p className="muted">Daily {s.settings.allowance} + grants {s.grants} = {m.allowanceTotal(s)}. {m.usedPct(s)}% consumed or reserved; warning at 80%.</p></div>
}
function Kpi({ label, value, hint, to, go, accent }: { label: string; value: number; hint: string; to: Page; go: (p: Page) => void; accent?: boolean }) {
  return <button className={accent ? 'kpi accent' : 'kpi'} onClick={() => go(to)} aria-label={`${label}: ${value}. Open ${to}`}><span className="kl">{label}</span><strong><CountUp value={value} /></strong><span className="kh">{hint}</span><span className="go"><Icon n="arrow" size={16} /></span></button>
}
function Overview({ s, go }: { s: m.State; go: (p: Page) => void }) {
  const now = new Date(), rem = m.remainingOpenMinutes(s.settings, now), jobs = s.jobs.filter(j => j.status === 'queued' || j.status === 'running')
  const cnt: Record<string, number> = { available: 0, busy: 0, reserved: 0, maintenance: 0, retired: 0, closed: 0 }; for (const r of s.resources) cnt[m.resourceStatus(s, r, now)]++
  const pts = [...s.history.slice(-6), { date: s.date, consumed: s.consumed }].map(h => ({ label: h.date.slice(5), v: h.consumed })), tot = m.workloadTotals(s)
  return <>
    <section className="hero card"><Waves className="herowaves" /><div className="herotxt">
      <span className="chip"><i />Simulated campus environment</span><h2>Campus compute, shared.</h2>
      <p>Find a compatible node, reserve credits and track simulated jobs. Nothing here runs on real machines.</p>
      <div className="row"><button onClick={() => go('Compute Resources')}><Icon n="plus" size={16} />Browse resources</button><button className="ghost" onClick={() => go('My Jobs')}>View jobs</button></div></div></section>
    <Guide s={s} go={go} />
    {m.warn(s) && <div className="banner">Credit usage is at {m.usedPct(s)}% of today's allowance.</div>}
    <div className="kpis">
      <Kpi accent label="Available credits" value={m.available(s)} hint={`of ${m.allowanceTotal(s)} today`} to="Usage & Limits" go={go} />
      <Kpi label="Consumed" value={s.consumed} hint="charged today" to="Usage & Limits" go={go} />
      <Kpi label="Reserved" value={m.reserved(s)} hint="queued and running jobs" to="My Jobs" go={go} />
      <Kpi label="Active jobs" value={jobs.length} hint={`limit ${s.settings.maxConcurrent}`} to="My Jobs" go={go} />
      <Kpi label="Available nodes" value={cnt.available} hint={`of ${s.resources.length} nodes`} to="Compute Resources" go={go} />
    </div>
    <div className="dash">
      <div className="card span3"><h2>Credit allocation</h2><Gauge s={s} /></div>
      <div className="card dark"><h2>Lab today</h2><strong className="big">{rem > 0 ? 'Open' : 'Closed'}</strong><p>{rem > 0 ? `${rem} min until ${s.settings.close}` : `Hours ${s.settings.open}–${s.settings.close} on selected weekdays. Change them in the Admin Panel.`}</p></div>
      <div className="card span2"><h2>Daily usage trend</h2>{pts.length > 1 ? <AreaChart pts={pts} label="Consumed credits per day" /> : <div className="empty"><strong>{s.consumed}</strong> credits today<p className="muted">The trend appears after the first daily rollover. No history is invented.</p></div>}</div>
      <div className="card"><h2>Charged by workload</h2>{Object.keys(tot).length ? <Hatched data={m.WORKLOADS.map(k => ({ k, v: tot[k] ?? 0 }))} /> : <p className="muted">No charged jobs yet.</p>}</div>
      <div className="card"><h2>Resource availability</h2><ul className="stat">{Object.entries(cnt).map(([k, v]) => <li key={k}><span className={`pill ${k}`}>{k}</span><b>{v}</b></li>)}</ul></div>
      <div className="card span4"><div className="row between"><h2>Recent activity</h2><button className="ghost" onClick={() => go('Activity Log')}>View full log</button></div>{s.activity.length === 0 ? <div className="empty"><p className="muted">No activity yet.</p><button onClick={() => go('Compute Resources')}>Submit a simulated job</button></div> : <ul className="feed">{s.activity.slice(0, 6).map(a => <li key={a.id}><i />{a.text}<span className="muted">{new Date(a.at).toLocaleTimeString()}</span></li>)}</ul>}</div>
    </div></>
}
function Resources({ s, act }: { s: m.State; act: Act }) {
  const [q, setQ] = useState(''), [st, setSt] = useState(''), [w, setW] = useState(''), [sel, setSel] = useState<m.Resource | null>(null)
  const now = new Date()
  const list = useMemo(() => m.filterResources(s.resources, { q, status: (st || undefined) as m.RStatus | undefined, workload: (w || undefined) as m.Workload | undefined }), [s.resources, q, st, w])
  return <>
    <div className="row">
      <label>Search<input value={q} onChange={e => setQ(e.target.value)} placeholder="Name, lab, CPU, GPU" /></label>
      <label>Status<select value={st} onChange={e => setSt(e.target.value)}><option value="">All</option>{['available', 'busy', 'reserved', 'maintenance', 'retired'].map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Workload<select value={w} onChange={e => setW(e.target.value)}><option value="">All</option>{m.WORKLOADS.map(x => <option key={x}>{x}</option>)}</select></label>
    </div>
    {list.length === 0 && <p className="card muted">No resources match these filters.</p>}
    <div className="grid wide">{list.map(r => { const live = m.resourceStatus(s, r, now); return <div className="card" key={r.id}>
      <h2>{r.name} <span className={`pill ${live}`}>{live}</span></h2>
      <p className="muted">{r.lab} · {r.cpu} · {r.memGb} GB{r.gpu ? ` · ${r.gpu}` : ''}</p><p>Supports: {r.workloads.join(', ')}</p>
      <button disabled={live !== 'available'} onClick={() => setSel(r)}>{live === 'available' ? 'Submit job' : live === 'closed' ? 'Lab closed' : `Unavailable (${live})`}</button></div> })}</div>
    {sel && <Submit s={s} r={sel} act={act} close={() => setSel(null)} />}
  </>
}
function Submit({ s, r, act, close }: { s: m.State; r: m.Resource; act: Act; close: () => void }) {
  const [wl, setWl] = useState<m.Workload>(r.workloads[0]), [min, setMin] = useState('60'), [busy, setBusy] = useState(false)
  const minutes = Number(min), valid = min.trim() !== '' && Number.isInteger(minutes)
  const est = valid ? m.cost(s.settings.rates[wl], minutes) : 0
  const errs = valid ? m.validateRun(s, { resourceId: r.id, workload: wl, minutes }, new Date()) : ['Enter a whole number of minutes.']
  return <div className="modal" role="dialog" aria-modal="true" aria-labelledby="dlg"><div className="card dlg">
    <h2 id="dlg">Submit job on {r.name}</h2>
    <label>Workload<select value={wl} onChange={e => setWl(e.target.value as m.Workload)}>{r.workloads.map(x => <option key={x}>{x}</option>)}</select></label>
    <label>Duration (minutes)<input inputMode="numeric" value={min} onChange={e => setMin(e.target.value)} autoFocus /></label>
    <p>Estimate: <strong>{est}</strong> credits (rate {s.settings.rates[wl]}/h, rounded up). Available: {m.available(s)}.</p>
    {errs.map(e => <p className="err" key={e}>{e}</p>)}
    <div className="row"><button disabled={errs.length > 0 || busy} onClick={() => { setBusy(true); if (act(m.submit(s, { resourceId: r.id, workload: wl, minutes }, new Date()), 'Job queued; credits reserved.')) close(); else setBusy(false) }}>Reserve & queue</button><button className="ghost" onClick={close}>Close</button></div>
  </div></div>
}
function Jobs({ s, act }: { s: m.State; act: Act }) {
  const [f, setF] = useState(''), [q, setQ] = useState(''), [conf, setConf] = useState('')
  const rows = s.jobs.filter(j => (!f || j.status === f) && (!q || (j.id + j.workload + (s.resources.find(r => r.id === j.resourceId)?.name ?? '')).toLowerCase().includes(q.toLowerCase())))
  const now = () => new Date()
  return <>
    <div className="row"><label>Search<input value={q} onChange={e => setQ(e.target.value)} /></label><label>Status<select value={f} onChange={e => setF(e.target.value)}><option value="">All</option>{['queued', 'running', 'completed', 'cancelled', 'cutoff'].map(x => <option key={x}>{x}</option>)}</select></label></div>
    {rows.length === 0 && <p className="card muted">No jobs yet. Pick a resource and submit one.</p>}
    {rows.map(j => <div className="card" key={j.id}>
      <h2>{s.resources.find(r => r.id === j.resourceId)?.name} · {j.workload} <span key={j.status} className={`pill ${j.status}`}>{j.status}</span></h2>
      <p className="statushint">{{ queued: 'Waiting in the queue. Press Start to run it. Credits are already set aside for it.', running: 'Running now. Press Finish when your work is done.', completed: 'Done. You were charged for the job and any unused credits came back.', cancelled: 'Cancelled. You were only charged for the part that ran.', cutoff: 'Stopped because the lab closed. You were only charged for the part that ran.' }[j.status]}</p>
      <p className="muted">{j.minutes} min · credits set aside {j.estimate} · charged {j.actual ?? '—'}</p>
      {j.status === 'running' && <div className="bar" role="progressbar" aria-valuenow={j.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Simulated progress"><i className="live" style={{ width: `${j.progress}%` }} /></div>}
      <div className="row">
        {j.status === 'queued' && <button onClick={() => act(m.start(s, j.id, now()), 'Job started.')}>Start</button>}
        {j.status === 'running' && <><button onClick={() => act(m.finish(s, j.id, now()), 'Job finished.')}>Finish</button><button className="ghost" onClick={() => act(m.cutoff(s, j.id, now()), 'Job cut off at closing time.')}>Simulate cutoff</button></>}
        {(j.status === 'queued' || j.status === 'running') && (conf === j.id ? <><span>Cancel this job?</span><button className="danger" onClick={() => { act(m.cancel(s, j.id, now()), 'Job cancelled.'); setConf('') }}>Yes, cancel</button><button className="ghost" onClick={() => setConf('')}>Keep</button></> : <button className="ghost" onClick={() => setConf(j.id)}>Cancel</button>)}
      </div></div>)}
    <Sim>progress is a timer and stops at 96% until you press Finish; nothing is executed.</Sim>
  </>
}
function Workspace() {
  const [tab, setTab] = useState<'terminal' | 'files'>('terminal'), [cmd, setCmd] = useState(''), [out, setOut] = useState<string[]>([])
  const canned: Record<string, string> = { ls: 'data/  results/  train.py', 'nvidia-smi': 'Illustrative output only — no GPU is connected.', pwd: '/home/student/project' }
  return <>
    <div className="banner">Preview only. No terminal, remote desktop or file access exists in this frontend-only version.</div>
    <div className="row" role="tablist">{(['terminal', 'files'] as const).map(t => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? '' : 'ghost'} onClick={() => setTab(t)}><Icon n={t === 'terminal' ? 'terminal' : 'folder'} size={16} />{t}</button>)}</div>
    {tab === 'terminal' ? <div className="card term"><pre>{out.join('\n') || 'Try: ls, pwd, nvidia-smi'}</pre>
      <label>Command (not executed)<input value={cmd} onChange={e => setCmd(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setOut(o => [...o, `$ ${cmd}`, canned[cmd.trim()] ?? 'Preview terminal: command not available.']); setCmd('') } }} /></label></div>
      : <div className="card"><p className="muted">Illustrative listing, not real files.</p><ul><li>data/</li><li>results/</li><li>train.py</li></ul></div>}
  </>
}
function Usage({ s }: { s: m.State }) {
  const days = [...s.history.slice(-6), { date: s.date, consumed: s.consumed }], mx = Math.max(1, ...days.map(d => d.consumed)), tot = m.workloadTotals(s)
  const dl = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([m.toCsv(s)], { type: 'text/csv;charset=utf-8' })); a.download = `idlenode-usage-${s.date}.csv`; a.click(); URL.revokeObjectURL(a.href) }
  return <>
    <div className="grid">{[['Daily allowance', s.settings.allowance], ['Admin grants today', s.grants], ['Consumed', s.consumed], ['Reserved', m.reserved(s)], ['Available', m.available(s)]].map(([k, v]) => <div className="card" key={k}><span className="muted">{k}</span><strong>{v}</strong></div>)}</div>
    <div className="card"><h2>Credits</h2><Gauge s={s} /></div>
    <div className="card"><h2>Last 7 days (consumed)</h2><div className="bars" role="img" aria-label="Consumed credits per day">{days.map(d => <div key={d.date}><i style={{ height: `${(d.consumed / mx) * 100}%` }} /><span>{d.date.slice(5)}<br />{d.consumed}</span></div>)}</div>{s.history.length === 0 && <p className="muted">Only today so far; no history is invented.</p>}</div>
    <div className="card"><h2>Today by workload</h2>{Object.keys(tot).length ? <ul>{Object.entries(tot).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul> : <p className="muted">No charged jobs yet.</p>}</div>
    <button onClick={dl}>Export CSV</button>
  </>
}
function Palette({ go, openAdmin, close }: { go: (p: Page) => void; openAdmin: () => void; close: () => void }) {
  const [q, setQ] = useState(''), [i, setI] = useState(0), prev = useRef(document.activeElement as HTMLElement | null)
  useEffect(() => () => prev.current?.focus(), [])
  const ADMIN = 'Admin Panel', items: string[] = [...PAGES, ADMIN].filter(p => p.toLowerCase().includes(q.toLowerCase())), pick = (p: string) => (p === ADMIN ? openAdmin() : go(p as Page))
  const idx = Math.min(i, Math.max(0, items.length - 1))
  return <div className="modal" onClick={close}><div className="card dlg" role="dialog" aria-modal="true" aria-label="Command palette" onClick={e => e.stopPropagation()}>
    <input autoFocus aria-label="Go to page" placeholder="Go to…" value={q} onChange={e => { setQ(e.target.value); setI(0) }}
      onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); setI(Math.min(idx + 1, items.length - 1)) } else if (e.key === 'ArrowUp') { e.preventDefault(); setI(Math.max(idx - 1, 0)) } else if (e.key === 'Enter' && items[idx]) pick(items[idx]) }} />
    <ul role="listbox">{items.map((p, n) => <li key={p} role="option" aria-selected={n === idx} className={n === idx ? 'sel on' : 'sel'} onClick={() => pick(p)}><Icon n={p === ADMIN ? 'shield' : PAGE_ICON[p]} size={16} />{p}</li>)}{items.length === 0 && <li className="muted">No matching pages.</li>}</ul></div></div>
}
