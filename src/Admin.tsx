import { useEffect, useState } from 'react'
import * as m from './model'
import { Icon, AreaChart } from './ui'

// Admin panel: live monitoring + control. CLIENT-SIDE SIMULATION: roles are a demo switch, not authentication.
const ROLE_LABEL: Record<m.Role, string> = { student: 'Student', lab_manager: 'Lab Manager', campus_admin: 'Campus Administrator', super_admin: 'Super Administrator' }
const ADMIN_ROLES: m.Role[] = ['lab_manager', 'campus_admin', 'super_admin']
const ROLE_KEY = 'idlenode-admin-role'
const readRole = (): m.Role | null => { try { const r = sessionStorage.getItem(ROLE_KEY) as m.Role | null; return r && ADMIN_ROLES.includes(r) ? r : null } catch { return null } }
const writeRole = (r: m.Role | null) => { try { r ? sessionStorage.setItem(ROLE_KEY, r) : sessionStorage.removeItem(ROLE_KEY) } catch { /* ignore */ } }

const Sim = ({ children }: { children: string }) => <p className="note">Simulated: {children}</p>
function Confirm({ title, body, label, danger, onYes, onNo }: { title: string; body: string; label: string; danger?: boolean; onYes: () => void; onNo: () => void }) {
  return <div className="modal" onClick={onNo}><div className="card dlg" role="alertdialog" aria-modal="true" aria-labelledby="cf" aria-describedby="cd" onClick={e => e.stopPropagation()}>
    <h2 id="cf">{title}</h2><p id="cd" className="muted">{body}</p>
    <div className="row"><button className={danger ? 'danger' : ''} onClick={onYes}>{label}</button><button className="ghost" autoFocus onClick={onNo}>Cancel</button></div></div></div>
}
const blank = (): m.Resource => ({ id: '', name: '', lab: 'Lab A', cpu: '', memGb: 16, workloads: ['cpu'], status: 'available' })
function ResourceForm({ s, init, isNew, onSave, onClose }: { s: m.State; init: m.Resource; isNew: boolean; onSave: (r: m.Resource) => void; onClose: () => void }) {
  const [f, setF] = useState({ ...init, memGb: String(init.memGb) as unknown as number, gpu: init.gpu ?? '' })
  const draft: m.Resource = { ...f, memGb: f.memGb === ('' as unknown as number) ? NaN : Number(f.memGb), gpu: f.gpu.trim() || undefined }
  const others = s.resources.filter(r => r.id !== init.id)
  const errs = m.validateResource(isNew ? draft : { ...draft, id: 'x-ok' }, others).filter(e => isNew || !e.startsWith('ID'))
  const field = (k: 'id' | 'name' | 'lab' | 'cpu' | 'gpu', l: string, dis = false) => <label>{l}<input disabled={dis} value={f[k] ?? ''} onChange={e => setF({ ...f, [k]: e.target.value })} /></label>
  return <div className="modal"><div className="card dlg" role="dialog" aria-modal="true" aria-labelledby="rf">
    <h2 id="rf">{isNew ? 'Register resource' : `Edit ${init.name}`}</h2>
    {field('id', 'ID', !isNew)}{field('name', 'Name')}{field('lab', 'Lab')}{field('cpu', 'CPU')}
    <label>Memory (GB)<input inputMode="numeric" value={String(f.memGb)} onChange={e => setF({ ...f, memGb: e.target.value as unknown as number })} /></label>{field('gpu', 'GPU model (optional)')}
    <fieldset><legend>Workloads</legend>{m.WORKLOADS.map(w => <label className="chk" key={w}><input type="checkbox" checked={f.workloads.includes(w)} onChange={e => setF({ ...f, workloads: e.target.checked ? [...f.workloads, w] : f.workloads.filter(x => x !== w) })} />{w}</label>)}</fieldset>
    <p className="note">Sample node record. It is not connected to a real worker and reports no live telemetry.</p>
    {errs.map(e => <p className="err" key={e}>{e}</p>)}
    <div className="row"><button disabled={errs.length > 0} onClick={() => onSave(draft)}>{isNew ? 'Register' : 'Save changes'}</button><button className="ghost" onClick={onClose}>Close</button></div></div></div>
}

type Tab = 'Monitor' | 'Jobs' | 'Nodes' | 'Users' | 'Credits & Policy' | 'Audit log'
const TABS: Tab[] = ['Monitor', 'Jobs', 'Nodes', 'Users', 'Credits & Policy', 'Audit log']
const TAB_ICON: Record<Tab, string> = { Monitor: 'monitor', Jobs: 'jobs', Nodes: 'server', Users: 'users', 'Credits & Policy': 'coins', 'Audit log': 'audit' }
const TAB_KEY = 'idlenode-admin-tab'
const readTab = (): Tab => { try { const t = sessionStorage.getItem(TAB_KEY) as Tab | null; return t && TABS.includes(t) ? t : 'Monitor' } catch { return 'Monitor' } }

export default function AdminPanel({ s, setS, setToast, exit }: { s: m.State; setS: (f: (x: m.State) => m.State) => void; setToast: (t: string) => void; exit: () => void }) {
  const [role, setRoleRaw] = useState<m.Role | null>(readRole), [tab, setTabRaw] = useState<Tab>(readTab)
  const [cf, setCf] = useState<{ title: string; body: string; label: string; danger?: boolean; go: () => void } | null>(null)
  const [uq, setUq] = useState(''), [ur, setUr] = useState(''), [us, setUs] = useState(''), [aq, setAq] = useState(''), [ao, setAo] = useState(''), [pg, setPg] = useState(0), [rf, setRf] = useState<{ r: m.Resource; isNew: boolean } | null>(null)
  const [jf, setJf] = useState(''), [jq, setJq] = useState('')
  const [gAmt, setGAmt] = useState(''), [gWhy, setGWhy] = useState('')
  const [clock, setClock] = useState(() => new Date())
  const [f, setF] = useState({ allowance: String(s.settings.allowance), maxConcurrent: String(s.settings.maxConcurrent), maxMinutes: String(s.settings.maxMinutes), open: s.settings.open, close: s.settings.close, days: s.settings.days, rates: { ...s.settings.rates } as Record<m.Workload, number | string> })
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t) }, [])
  const setRole = (r: m.Role | null) => { writeRole(r); setRoleRaw(r) }
  const setTab = (t: Tab) => { try { sessionStorage.setItem(TAB_KEY, t) } catch { /* ignore */ } setTabRaw(t) }
  const num = (t: string | number) => (String(t).trim() === '' ? NaN : Number(t)), now = () => new Date()
  const run = (r: m.Res, action: string, target: string, okMsg: string, reason?: string) => { const a = m.audited(s, r, role!, action, target, now(), reason); setS(() => a.state); setToast(a.error ?? okMsg); return !a.error }
  const ask = (title: string, body: string, label: string, go: () => void, danger = false) => setCf({ title, body, label, danger, go })

  if (!role) return <div className="adminlogin"><div className="card dlg">
    <div className="brand"><span className="logo">I</span><span>IdleNode Admin</span><button className="avatar push" aria-label="Student app" title="Student profile: back to IdleNode" onClick={exit}>S</button></div>
    <h2 className="signin"><Icon n="shield" size={20} />Sign in to the admin panel</h2>
    <p className="muted">This is a <b>demo role switch, not authentication</b>. Anyone with this page can use it and every rule runs in your browser. A real deployment must check roles on a server for every action.</p>
    {ADMIN_ROLES.map(r => <button key={r} className={r === 'super_admin' ? '' : 'ghost'} onClick={() => setRole(r)}>Continue as {ROLE_LABEL[r]}</button>)}
    <button className="ghost" onClick={exit}>Back to IdleNode</button></div></div>

  const st = m.adminStats(s, now()), scope = m.labScope(role), canPause = m.can(role, 'system.pause')
  const draft: m.Settings = { ...s.settings, allowance: num(f.allowance), maxConcurrent: num(f.maxConcurrent), maxMinutes: num(f.maxMinutes), open: f.open, close: f.close, days: f.days, rates: Object.fromEntries(m.WORKLOADS.map(w => [w, num(f.rates[w])])) as Record<m.Workload, number> }
  const perrs = m.validateSettings(draft), active = s.jobs.filter(j => j.status === 'queued' || j.status === 'running'), busy = active.length
  const users = s.users.filter(u => (!uq || u.name.toLowerCase().includes(uq.toLowerCase())) && (!ur || u.role === ur) && (!us || u.status === us))
  const log = s.audit.filter(a => (!ao || a.outcome === ao) && (!aq || `${a.action} ${a.target} ${a.actor} ${a.reason ?? ''}`.toLowerCase().includes(aq.toLowerCase())))
  const pages = Math.max(1, Math.ceil(log.length / 8)), pageNo = Math.min(pg, pages - 1)
  const labOf = (j: m.Job) => s.resources.find(r => r.id === j.resourceId)?.lab ?? '—', nodeOf = (j: m.Job) => s.resources.find(r => r.id === j.resourceId)?.name ?? j.resourceId
  const mayJob = (j: m.Job) => m.can(role, 'job.control') && (!scope || labOf(j) === scope)
  const jobs = s.jobs.filter(j => (!jf || j.status === jf) && (!jq || `${j.id} ${j.workload} ${nodeOf(j)}`.toLowerCase().includes(jq.toLowerCase())))
  const events = [...s.activity.map(a => ({ id: a.id, at: a.at, text: a.text, tag: 'system' })), ...s.audit.map(a => ({ id: a.id, at: a.at, text: `${ROLE_LABEL[a.actor]}: ${a.action} · ${a.target}${a.outcome === 'denied' ? ' (denied)' : ''}`, tag: a.outcome === 'denied' ? 'denied' : 'admin' }))].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12)
  const pts = [...s.history.slice(-6), { date: s.date, consumed: s.consumed }].map(h => ({ label: h.date.slice(5), v: h.consumed }))
  const stat = (k: string, v: number | string, to: Tab, hint?: string, tone = '') => <button className={`kpi ${tone}`} onClick={() => setTab(to)} aria-label={`${k}: ${v}. Open ${to}`}><span className="kl">{k}</span><strong>{v}</strong>{hint && <span className="kh">{hint}</span>}<span className="go"><Icon n="arrow" size={16} /></span></button>
  const jobAct = (j: m.Job, op: m.JobOp) => {
    const go = () => run(m.adminJobOp(s, role, j.id, op, now()), `job.${op}`, `${j.id} on ${nodeOf(j)}`, `Job ${op === 'stop' ? 'stopped' : op === 'start' ? 'started' : 'finished'}.`)
    if (op === 'stop') ask('Stop this job?', `${nodeOf(j)} · ${j.workload} (${j.id}). ${j.status === 'running' ? `It is ${j.progress}% through and will be charged for progress made.` : 'It has not started, so it is free.'}`, 'Stop job', go, true); else go()
  }

  return <div className="adminapp">
    <header className="adminhead">
      <div className="brand"><span className="logo">I</span><span>IdleNode Admin</span></div>
      <span className={s.paused ? 'sys paused' : 'sys live'} role="status"><i />{s.paused ? 'New jobs paused' : 'Accepting jobs'}</span>
      <span className="muted live">Live · {clock.toLocaleTimeString()}</span>
      <div className="grow" />
      <span className="rolebadge"><b>{ROLE_LABEL[role]}</b>{scope ? ` · ${scope} only` : ' · all labs'}</span>
      <label className="inl">Demo role<select value={role} onChange={e => setRole(e.target.value as m.Role)}>{ADMIN_ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></label>
      <button className="ghost" onClick={exit}><Icon n="exit" size={16} />Exit to app</button>
      <button className="ghost" onClick={() => setRole(null)}><Icon n="users" size={16} />Sign out</button>
      <button className="avatar" aria-label="Student app" title="Student profile: back to IdleNode" onClick={exit}>S</button>
    </header>
    <div className="ctrlbar card">
      <div><strong className="ctl">System controls</strong><p className="muted">Pause stops anyone from submitting or starting jobs. Running jobs keep going until you stop them.</p></div>
      <div className="row">
        <button className={s.paused ? '' : 'ghost'} disabled={!canPause} onClick={() => ask(s.paused ? 'Resume new jobs?' : 'Pause new jobs?', s.paused ? 'Students can submit and start jobs again.' : 'Students will be unable to submit or start jobs until you resume.', s.paused ? 'Resume' : 'Pause', () => run(m.setPaused(s, role, !s.paused, now()), 'system.pause', s.paused ? 'resume' : 'pause', s.paused ? 'New jobs resumed.' : 'New jobs paused.'))}><Icon n={s.paused ? 'play' : 'pause'} size={16} />{s.paused ? 'Resume new jobs' : 'Pause new jobs'}</button>
        <button className="danger" disabled={!canPause || busy === 0} onClick={() => ask('Stop ALL jobs?', `${busy} queued or running job(s) will be stopped. Running jobs are charged for progress; queued jobs are free.`, 'Stop all jobs', () => run(m.adminStopAll(s, role, now()), 'job.stop_all', `${busy} jobs`, 'All jobs stopped.'), true)}><Icon n="stop" size={16} />Emergency stop all ({busy})</button>
      </div>
      {!canPause && <p className="note">Your role cannot pause the system or stop all jobs.</p>}
    </div>
    <div className="row tabs" role="tablist" aria-label="Admin sections">{TABS.map(t => <button key={t} role="tab" aria-selected={t === tab} className={t === tab ? '' : 'ghost'} onClick={() => setTab(t)}><Icon n={TAB_ICON[t]} size={16} />{t}</button>)}</div>
    <div className="page" key={tab}>
    {tab === 'Monitor' && <>
      <div className="kpis">
        {stat('Running jobs', st.jc.running, 'Jobs', `${st.jc.queued} queued`, 'accent')}{stat('Nodes online', st.rc.available + st.rc.busy + st.rc.reserved, 'Nodes', `${st.rc.maintenance} maintenance · ${st.rc.retired} retired`)}
        {stat('Credits used', `${m.usedPct(s)}%`, 'Credits & Policy', `${st.consumed} consumed · ${m.reserved(s)} reserved`)}{stat('Users (simulated)', st.users, 'Users', `${st.active} active · ${st.suspended} suspended`)}{stat('Finished jobs', st.jc.completed + st.jc.cancelled + st.jc.cutoff, 'Jobs', `${st.jc.completed} done · ${st.jc.cancelled + st.jc.cutoff} stopped`)}</div>
      <div className="dash">
        <div className="card span4"><h2>Node activity</h2><div className="grid wide">{s.resources.map(r => { const eff = m.resourceStatus(s, r, now()), u = m.simUtil(s, r), j = s.jobs.find(x => x.resourceId === r.id && x.status === 'running'); return <div className="nodecard" key={r.id}>
          <div className="row between"><strong className="nm">{r.name}</strong><span className={`pill ${eff}`}>{eff}</span></div>
          <p className="muted">{r.lab} · {r.cpu}{r.gpu ? ` · ${r.gpu}` : ''}</p>
          <div className="bar" role="progressbar" aria-valuenow={u} aria-valuemin={0} aria-valuemax={100} aria-label={`${r.name} simulated utilization`}><i className={u > 90 ? 'warn' : ''} style={{ width: `${u}%` }} /></div>
          <p className="muted">{j ? `${u}% load · ${j.workload} job ${j.progress}%` : 'Idle'}</p></div> })}</div><Sim>load is derived from simulated job state; no real machine is measured.</Sim></div>
        <div className="card span2"><h2>Warnings</h2>{st.warnings.length ? <ul className="feed">{st.warnings.map(w => <li key={w}><i />{w}</li>)}</ul> : <p className="muted">No warnings from current state.</p>}</div>
        <div className="card span2"><h2>Daily credit trend</h2>{pts.length > 1 ? <AreaChart pts={pts} label="Consumed credits per day" /> : <div className="empty"><strong>{s.consumed}</strong> credits today<p className="muted">The trend appears after the first daily rollover.</p></div>}</div>
        <div className="card span4"><h2>Live event feed</h2>{events.length ? <ul className="feed">{events.map(e => <li key={e.id}><i /><span className={`pill ${e.tag === 'denied' ? 'maintenance' : e.tag === 'admin' ? 'running' : 'available'}`}>{e.tag}</span>{e.text}<span className="muted">{new Date(e.at).toLocaleTimeString()}</span></li>)}</ul> : <p className="muted">No events yet. Submit a job in the app or use a control above.</p>}</div>
        <div className="card span4"><h2>Security events</h2><p className="muted">None to show. Login, sessions and security monitoring do not exist in this frontend-only version, so no events are generated.</p></div></div></>}
    {tab === 'Jobs' && <>
      <div className="row"><label>Search<input value={jq} onChange={e => setJq(e.target.value)} placeholder="Job ID, node, workload" /></label><label>Status<select value={jf} onChange={e => setJf(e.target.value)}><option value="">All</option>{['queued', 'running', 'completed', 'cancelled', 'cutoff'].map(x => <option key={x}>{x}</option>)}</select></label></div>
      <div className="card scroll"><table className="tbl"><caption className="sr">All jobs</caption><thead><tr><th scope="col">Job</th><th scope="col">Node</th><th scope="col">Status</th><th scope="col">Progress</th><th scope="col">Credits</th><th scope="col">Actions</th></tr></thead><tbody>
        {jobs.map(j => <tr key={j.id}><td>{j.id}<br /><span className="muted">{j.workload} · {j.minutes} min · {new Date(j.createdAt).toLocaleTimeString()}</span></td><td>{nodeOf(j)}<br /><span className="muted">{labOf(j)}</span></td><td><span className={`pill ${j.status}`}>{j.status}</span></td>
          <td style={{ minWidth: 110 }}>{j.status === 'running' ? <div className="bar" role="progressbar" aria-valuenow={j.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Job ${j.id} simulated progress`}><i className="live" style={{ width: `${j.progress}%` }} /></div> : <span className="muted">{j.status === 'completed' ? '100%' : '—'}</span>}</td>
          <td>est {j.estimate}<br /><span className="muted">charged {j.actual ?? '—'}</span></td>
          <td><div className="row">{j.status === 'queued' && <button disabled={!mayJob(j)} onClick={() => jobAct(j, 'start')}>Start</button>}{j.status === 'running' && <button disabled={!mayJob(j)} onClick={() => jobAct(j, 'finish')}>Finish</button>}{(j.status === 'queued' || j.status === 'running') && <button className="danger" disabled={!mayJob(j)} onClick={() => jobAct(j, 'stop')}>Stop</button>}{!mayJob(j) && (j.status === 'queued' || j.status === 'running') && <span className="note">Not your lab</span>}</div></td></tr>)}
        {jobs.length === 0 && <tr><td colSpan={6} className="muted">No jobs match. Jobs appear here as soon as someone submits one in the app.</td></tr>}</tbody></table></div>
      <Sim>jobs are timers only; Start, Finish and Stop change simulated state and credit accounting, nothing is executed.</Sim></>}
    {tab === 'Users' && <><Sim>sample accounts for demonstrating role management. There is no real sign-up or login.</Sim>
      <div className="row"><label>Search<input value={uq} onChange={e => setUq(e.target.value)} /></label><label>Role<select value={ur} onChange={e => setUr(e.target.value)}><option value="">All</option>{m.ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></label><label>Status<select value={us} onChange={e => setUs(e.target.value)}><option value="">All</option><option>active</option><option>suspended</option></select></label></div>
      <div className="card scroll"><table className="tbl"><caption className="sr">Simulated users</caption><thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead><tbody>
        {users.map(u => <tr key={u.id}><td>{u.name}</td><td><select aria-label={`Role for ${u.name}`} value={u.role} onChange={e => { const to = e.target.value as m.Role; ask('Change role?', `${u.name}: ${ROLE_LABEL[u.role]} → ${ROLE_LABEL[to]}.`, 'Change role', () => run(m.setUserRole(s, role, u.id, to), 'user.role', `${u.name} → ${to}`, 'Role updated.')) }}>{m.ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></td>
          <td><span className={`pill ${u.status === 'active' ? 'available' : 'maintenance'}`}>{u.status}</span></td>
          <td><button className={u.status === 'active' ? 'danger' : 'ghost'} onClick={() => { const to = u.status === 'active' ? 'suspended' : 'active'; ask(`${to === 'suspended' ? 'Suspend' : 'Activate'} account?`, `${u.name} will be ${to}.`, to === 'suspended' ? 'Suspend' : 'Activate', () => run(m.setUserStatus(s, role, u.id, to), 'user.status', `${u.name} → ${to}`, `Account ${to}.`), to === 'suspended') }}>{u.status === 'active' ? 'Suspend' : 'Activate'}</button></td></tr>)}
        {users.length === 0 && <tr><td colSpan={4} className="muted">No users match.</td></tr>}</tbody></table></div></>}
    {tab === 'Nodes' && <><div className="row"><button disabled={!m.can(role, 'resource.register')} onClick={() => setRf({ r: blank(), isNew: true })}><Icon n="plus" size={16} />Register resource</button>{!m.can(role, 'resource.register') && <span className="note">Your role cannot register resources.</span>}</div>
      <div className="card scroll"><table className="tbl"><caption className="sr">Resources</caption><thead><tr><th scope="col">Resource</th><th scope="col">Lab</th><th scope="col">Capability</th><th scope="col">Effective status</th><th scope="col">Set condition</th><th scope="col">Actions</th></tr></thead><tbody>
        {s.resources.map(r => { const eff = m.resourceStatus(s, r, now()), mine = !scope || r.lab === scope; return <tr key={r.id}><td>{r.name}<br /><span className="muted">{r.id}</span></td><td>{r.lab}</td><td>{r.cpu}, {r.memGb} GB{r.gpu ? `, ${r.gpu}` : ''}<br /><span className="muted">{r.workloads.join(', ')}</span></td><td><span className={`pill ${eff}`}>{eff}</span></td>
          <td><select aria-label={`Condition for ${r.name}`} disabled={!mine || !m.can(role, 'resource.edit') || r.status === 'retired'} value={r.status} onChange={e => { const to = e.target.value as m.RStatus; ask('Change condition?', `${r.name}: ${r.status} → ${to}. Effective status still depends on lab hours and jobs.`, 'Apply', () => run(m.can(role, 'resource.edit') ? m.setResourceStatus(s, r.id, to) : { ok: false, error: 'Not permitted.' }, 'resource.status', `${r.name} → ${to}`, 'Condition updated.')) }}>{(['available', 'busy', 'reserved', 'maintenance'] as m.RStatus[]).concat(r.status === 'retired' ? ['retired'] : []).map(x => <option key={x}>{x}</option>)}</select></td>
          <td className="row"><button className="ghost" disabled={!mine} onClick={() => setRf({ r, isNew: false })}>Edit</button>
            <button className={r.status === 'retired' ? 'ghost' : 'danger'} onClick={() => { const re = r.status !== 'retired'; ask(re ? 'Retire resource?' : 'Reactivate resource?', re ? `${r.name} will stop accepting jobs.` : `${r.name} returns in maintenance for review.`, re ? 'Retire' : 'Reactivate', () => run(m.setRetired(s, role, r.id, re), 'resource.retire', r.name, re ? 'Resource retired.' : 'Resource reactivated.'), re) }}>{r.status === 'retired' ? 'Reactivate' : 'Retire'}</button></td></tr> })}</tbody></table></div></>}
    {tab === 'Credits & Policy' && <>
      <div className="card"><h2>Lab policy</h2><div className="row">
        <label>Daily allowance<input inputMode="numeric" value={f.allowance} onChange={e => setF({ ...f, allowance: e.target.value })} /></label><label>Max concurrent jobs<input inputMode="numeric" value={f.maxConcurrent} onChange={e => setF({ ...f, maxConcurrent: e.target.value })} /></label><label>Max job minutes<input inputMode="numeric" value={f.maxMinutes} onChange={e => setF({ ...f, maxMinutes: e.target.value })} /></label>
        <label>Opens<input type="time" value={f.open} onChange={e => setF({ ...f, open: e.target.value })} /></label><label>Closes<input type="time" value={f.close} onChange={e => setF({ ...f, close: e.target.value })} /></label></div>
        <fieldset><legend>Credits per hour</legend><div className="row">{m.WORKLOADS.map(w => <label key={w}>{w}<input inputMode="numeric" value={String(f.rates[w])} onChange={e => setF({ ...f, rates: { ...f.rates, [w]: e.target.value } })} /></label>)}</div></fieldset>
        <fieldset><legend>Open days</legend>{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => <label className="chk" key={d}><input type="checkbox" checked={f.days.includes(i)} onChange={e => setF({ ...f, days: e.target.checked ? [...f.days, i] : f.days.filter(x => x !== i) })} />{d}</label>)}</fieldset>
        <p className="note">Cutoff policy is fixed to "stop" in this version. The 80% warning threshold is fixed.</p>
        {perrs.map(e => <p className="err" key={e}>{e}</p>)}
        <button disabled={perrs.length > 0 || !m.can(role, 'policy.edit')} onClick={() => { const go = () => run(m.editPolicy(s, role, draft), 'policy.edit', 'lab policy', 'Policy saved.'); busy ? ask('Apply policy with active jobs?', `${busy} queued or running job(s) exist. Rule changes apply to jobs started or submitted from now on; existing reservations are kept.`, 'Apply policy', go) : go() }}>Save policy</button>{!m.can(role, 'policy.edit') && <span className="note"> Your role cannot edit policy.</span>}</div>
      <div className="card"><h2>Grant credits (today only)</h2><div className="row"><label>Credits<input inputMode="numeric" value={gAmt} onChange={e => setGAmt(e.target.value)} /></label><label>Reason<input value={gWhy} onChange={e => setGWhy(e.target.value)} placeholder="e.g. course project" /></label>
        <button disabled={!m.can(role, 'credits.grant')} onClick={() => { const n = num(gAmt); ask('Grant credits?', `Add ${n} credits to today's pool. Reason: ${gWhy || '(none)'}.`, 'Grant', () => { if (run(m.adminGrant(s, role, n, gWhy, now()), 'credits.grant', 'campus pool', 'Credits granted.', gWhy)) { setGAmt(''); setGWhy('') } }) }}>Review grant</button></div>
        {s.ledger.length ? <div className="scroll"><table className="tbl"><caption className="sr">Credit ledger</caption><thead><tr><th scope="col">When</th><th scope="col">By</th><th scope="col">Credits</th><th scope="col">Reason</th></tr></thead><tbody>{s.ledger.slice(0, 8).map(l => <tr key={l.id}><td>{new Date(l.at).toLocaleString()}</td><td>{ROLE_LABEL[l.actor]}</td><td>+{l.amount}</td><td>{l.reason}</td></tr>)}</tbody></table></div> : <p className="muted">No grants recorded.</p>}</div>
      <div className="card zone"><h2>Reset demo data</h2><p className="muted">Erases jobs, usage, grants and settings in "idlenode-state-v1". The audit log is kept. Super administrator only.</p>
        <button className="danger" disabled={!m.can(role, 'reset')} onClick={() => ask('Reset all demo data?', 'This cannot be undone.', 'Reset everything', () => { const a = m.audited(s, m.resetDemo(s, role, now()), role, 'demo.reset', 'all data', now()); setS(() => a.state); setToast(a.error ?? 'Demo reset.') }, true)}>Reset…</button></div></>}
    {tab === 'Audit log' && (m.can(role, 'audit.view') ? <><Sim>entries are stored in this browser and can be cleared by the user. A trustworthy audit trail must live on a server.</Sim>
      <div className="row"><label>Search<input value={aq} onChange={e => { setAq(e.target.value); setPg(0) }} /></label><label>Outcome<select value={ao} onChange={e => { setAo(e.target.value); setPg(0) }}><option value="">All</option><option>success</option><option>denied</option></select></label></div>
      <div className="card scroll"><table className="tbl"><caption className="sr">Audit log</caption><thead><tr><th scope="col">Time</th><th scope="col">Actor</th><th scope="col">Action</th><th scope="col">Target</th><th scope="col">Outcome</th><th scope="col">Reason</th><th scope="col">ID</th></tr></thead><tbody>
        {log.slice(pageNo * 8, pageNo * 8 + 8).map(a => <tr key={a.id}><td>{new Date(a.at).toLocaleString()}</td><td>{ROLE_LABEL[a.actor]}</td><td>{a.action}</td><td>{a.target}</td><td><span className={`pill ${a.outcome === 'denied' ? 'maintenance' : 'available'}`}>{a.outcome}</span></td><td>{a.reason ?? ''}</td><td className="muted">{a.id}</td></tr>)}
        {log.length === 0 && <tr><td colSpan={7} className="muted">No audit entries yet.</td></tr>}</tbody></table></div>
      <div className="row"><button className="ghost" disabled={pageNo === 0} onClick={() => setPg(pageNo - 1)}>Previous</button><span className="muted">Page {pageNo + 1} of {pages}</span><button className="ghost" disabled={pageNo >= pages - 1} onClick={() => setPg(pageNo + 1)}>Next</button></div></>
      : <div className="card"><p className="muted">Your role cannot view the audit log.</p></div>)}
    </div>
    {rf && <ResourceForm s={s} init={rf.r} isNew={rf.isNew} onClose={() => setRf(null)} onSave={r => { if (run(rf.isNew ? m.addResource(s, role, r) : m.updateResource(s, role, r), rf.isNew ? 'resource.register' : 'resource.edit', r.name, rf.isNew ? 'Resource registered.' : 'Resource updated.')) setRf(null) }} />}
    {cf && <Confirm title={cf.title} body={cf.body} label={cf.label} danger={cf.danger} onNo={() => setCf(null)} onYes={() => { const g = cf.go; setCf(null); g() }} />}
  </div>
}
