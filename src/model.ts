// Pure business logic: no React. Credits are integers.
export type Workload = 'cpu' | 'gpu' | 'render' | 'sim'
export type RStatus = 'available' | 'busy' | 'reserved' | 'maintenance' | 'retired'
export type JStatus = 'queued' | 'running' | 'completed' | 'cancelled' | 'cutoff'
export interface Resource { id: string; name: string; lab: string; cpu: string; memGb: number; gpu?: string; workloads: Workload[]; status: RStatus }
export interface Job { id: string; resourceId: string; workload: Workload; minutes: number; estimate: number; actual?: number; status: JStatus; progress: number; createdAt: string; reason?: string }
export interface Settings { allowance: number; rates: Record<Workload, number>; maxConcurrent: number; maxMinutes: number; open: string; close: string; days: number[] }
export type ActKind = 'job' | 'admin' | 'system'
export interface Activity { id: string; text: string; at: string; read: boolean; kind?: ActKind }
export type Role = 'student' | 'lab_manager' | 'campus_admin' | 'super_admin'
export interface SimUser { id: string; name: string; role: Role; status: 'active' | 'suspended' } // SIMULATED sample accounts, not real registrations
export interface AuditEntry { id: string; at: string; actor: Role; action: string; target: string; outcome: 'success' | 'denied'; reason?: string }
export interface LedgerEntry { id: string; at: string; actor: Role; amount: number; reason: string }
export interface State { v: 1; users: SimUser[]; audit: AuditEntry[]; ledger: LedgerEntry[]; date: string; settings: Settings; resources: Resource[]; jobs: Job[]; paused?: boolean; consumed: number; grants: number; history: { date: string; consumed: number }[]; activity: Activity[] }
export type Res<T = State> = { ok: true; state: T } | { ok: false; error: string }

export const WORKLOADS: Workload[] = ['cpu', 'gpu', 'render', 'sim']
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const ACTIVE: JStatus[] = ['queued', 'running'] // both count toward concurrency AND reservations

export function seed(now = new Date()): State {
  const R = (id: string, name: string, lab: string, cpu: string, memGb: number, workloads: Workload[], status: RStatus, gpu?: string): Resource => ({ id, name, lab, cpu, memGb, gpu, workloads, status })
  return { v: 1, users: [{ id: 'u1', name: 'Sample Student A', role: 'student', status: 'active' }, { id: 'u2', name: 'Sample Student B', role: 'student', status: 'suspended' }, { id: 'u3', name: 'Sample Lab Manager', role: 'lab_manager', status: 'active' }, { id: 'u4', name: 'Sample Campus Admin', role: 'campus_admin', status: 'active' }, { id: 'u5', name: 'Sample Super Admin', role: 'super_admin', status: 'active' }], audit: [], ledger: [], date: dayKey(now), consumed: 0, grants: 0, history: [], activity: [],
    settings: { allowance: 100, rates: { cpu: 4, gpu: 12, render: 10, sim: 6 }, maxConcurrent: 2, maxMinutes: 480, open: '08:00', close: '20:00', days: [1, 2, 3, 4, 5] },
    jobs: [], resources: [
      R('n1', 'Atlas-CPU-01', 'Lab A', '32-core EPYC', 128, ['cpu', 'sim'], 'available'),
      R('n2', 'Atlas-CPU-02', 'Lab A', '16-core Xeon', 64, ['cpu', 'sim'], 'busy'),
      R('n3', 'Helix-GPU-01', 'Lab B', '16-core Ryzen', 64, ['gpu', 'render', 'cpu'], 'available', 'RTX 4080'),
      R('n4', 'Helix-GPU-02', 'Lab B', '16-core Ryzen', 64, ['gpu', 'render'], 'reserved', 'RTX 4070'),
      R('n5', 'Forge-RND-01', 'Lab C', '24-core Threadripper', 128, ['render', 'sim', 'cpu'], 'available', 'RTX A4000'),
      R('n6', 'Cedar-CPU-01', 'Lab D', '8-core i7', 32, ['cpu'], 'maintenance')] }
}

export const cost = (rate: number, minutes: number) => !Number.isFinite(rate) || !Number.isFinite(minutes) || rate <= 0 || minutes <= 0 ? 0 : Math.ceil((rate * minutes) / 60)
export const reserved = (s: State) => s.jobs.filter(j => ACTIVE.includes(j.status)).reduce((a, j) => a + j.estimate, 0)
export const allowanceTotal = (s: State) => s.settings.allowance + s.grants
export const available = (s: State) => Math.max(0, allowanceTotal(s) - s.consumed - reserved(s))
// 80% rule: (consumed + reserved) / grant-inclusive allowance. Used on every screen.
export const usedPct = (s: State) => { const t = allowanceTotal(s); return t <= 0 ? 100 : Math.min(100, Math.round(((s.consumed + reserved(s)) / t) * 100)) }
export const warn = (s: State) => usedPct(s) >= 80

const mins = (t: string) => { const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(t); return m ? +m[1] * 60 + +m[2] : null }
export function validateSettings(x: Settings): string[] {
  const e: string[] = [], o = mins(x.open), c = mins(x.close)
  if (!Number.isInteger(x.allowance) || x.allowance < 0) e.push('Daily allowance must be a whole number ≥ 0.')
  if (!Number.isInteger(x.maxConcurrent) || x.maxConcurrent < 1) e.push('Concurrency limit must be a whole number ≥ 1.')
  if (!Number.isInteger(x.maxMinutes) || x.maxMinutes < 5 || x.maxMinutes > 1440) e.push('Maximum job duration must be 5–1440 minutes.')
  for (const w of WORKLOADS) if (!Number.isFinite(x.rates[w]) || x.rates[w] < 0) e.push(`Rate for ${w} must be ≥ 0.`)
  if (o === null || c === null) e.push('Times must be HH:MM.')
  else if (c <= o) e.push('Overnight hours are not supported: closing must be after opening.')
  if (!x.days.length || x.days.some(d => !Number.isInteger(d) || d < 0 || d > 6)) e.push('Select at least one open weekday.')
  return e
}
export function remainingOpenMinutes(s: Settings, now: Date): number {
  const o = mins(s.open), c = mins(s.close)
  if (o === null || c === null || c <= o || !s.days.includes(now.getDay())) return 0
  const m = now.getHours() * 60 + now.getMinutes()
  return m < o || m >= c ? 0 : c - m
}
export const resourceStatus = (s: State, r: Resource, now: Date): RStatus | 'closed' =>
  r.status !== 'available' ? r.status : remainingOpenMinutes(s.settings, now) === 0 ? 'closed' : s.jobs.some(j => j.resourceId === r.id && j.status === 'running') ? 'busy' : 'available'
export const compatible = (r: Resource, w: Workload) => r.workloads.includes(w)
export function filterResources(rs: Resource[], f: { status?: RStatus; workload?: Workload; q?: string }) {
  const q = (f.q ?? '').trim().toLowerCase()
  return rs.filter(r => (!f.status || r.status === f.status) && (!f.workload || compatible(r, f.workload)) &&
    (!q || [r.name, r.lab, r.cpu, r.gpu ?? ''].some(t => t.toLowerCase().includes(q))))
}

// One validator for submit AND start. `checkingStart` excludes the job itself from concurrency counts.
export function validateRun(s: State, i: { resourceId: string; workload: Workload; minutes: number }, now: Date, selfId?: string): string[] {
  const e: string[] = [], r = s.resources.find(x => x.id === i.resourceId)
  if (!r) return ['Select a resource.']
  if (s.paused) e.push('New jobs are paused by an administrator.')
  if (!Number.isInteger(i.minutes) || i.minutes < 5 || i.minutes > s.settings.maxMinutes) e.push(`Duration must be 5–${s.settings.maxMinutes} whole minutes.`)
  if (!compatible(r, i.workload)) e.push(`${r.name} does not support ${i.workload}.`)
  if (r.status !== 'available') e.push(`${r.name} is ${r.status}.`)
  const others = s.jobs.filter(j => ACTIVE.includes(j.status) && j.id !== selfId)
  if (others.length >= s.settings.maxConcurrent) e.push(`Concurrency limit (${s.settings.maxConcurrent}) reached.`)
  const rem = remainingOpenMinutes(s.settings, now)
  if (rem === 0) e.push('Lab is closed now.')
  else if (i.minutes > rem) e.push(`Only ${rem} min until closing; job needs ${i.minutes}.`)
  const est = cost(s.settings.rates[i.workload], i.minutes)
  const free = available(s) + (selfId ? s.jobs.find(j => j.id === selfId)?.estimate ?? 0 : 0)
  if (est > free) e.push(`Needs ${est} credits; ${free} available.`)
  return e
}
const log = (s: State, text: string, now: Date, kind: ActKind = 'job'): State => ({ ...s, activity: [{ id: `a${now.getTime()}-${s.activity.length}`, text, at: now.toISOString(), read: false, kind }, ...s.activity].slice(0, 200) })
const fail = (error: string): Res => ({ ok: false, error })

export function submit(s: State, i: { resourceId: string; workload: Workload; minutes: number }, now: Date): Res {
  const e = validateRun(s, i, now); if (e.length) return fail(e.join(' '))
  const job: Job = { id: `j${now.getTime()}-${s.jobs.length + 1}`, ...i, estimate: cost(s.settings.rates[i.workload], i.minutes), status: 'queued', progress: 0, createdAt: now.toISOString() }
  return { ok: true, state: log({ ...s, jobs: [job, ...s.jobs] }, `You queued a ${i.workload} job on ${s.resources.find(r => r.id === i.resourceId)?.name ?? i.resourceId}: ${job.estimate} credits reserved.`, now) }
}
const patch = (s: State, id: string, p: Partial<Job>): State => ({ ...s, jobs: s.jobs.map(j => (j.id === id ? { ...j, ...p } : j)) })
export function start(s: State, id: string, now: Date): Res {
  const j = s.jobs.find(x => x.id === id); if (!j || j.status !== 'queued') return fail('Only queued jobs can start.')
  if (s.jobs.some(x => x.status === 'running') && s.settings.maxConcurrent < 1) return fail('Concurrency limit reached.')
  const e = validateRun(s, j, now, id); if (e.length) return fail(e.join(' '))
  return { ok: true, state: log(patch(s, id, { status: 'running' }), `Job ${id} started. Its reserved credits stay reserved until it ends.`, now) } // no second reservation
}
export function settle(s: State, id: string, to: JStatus, pct: number, from: JStatus[], reason: string, now: Date): Res {
  const j = s.jobs.find(x => x.id === id); if (!j || !from.includes(j.status)) return fail(`Job is ${j?.status ?? 'missing'}; action not allowed.`)
  const actual = Math.min(j.estimate, Math.ceil((j.estimate * pct) / 100))
  return { ok: true, state: log({ ...patch(s, id, { status: to, actual, reason, progress: to === 'completed' ? 100 : j.progress }), consumed: s.consumed + actual }, `Job ${id} ${{ completed: 'finished', cancelled: 'was cancelled', cutoff: 'was stopped at closing time', queued: '', running: '' }[to]}: charged ${actual} of ${j.estimate} credits${actual < j.estimate ? ` (${j.estimate - actual} returned)` : ''}.`, now) }
}
export const finish = (s: State, id: string, now: Date) => settle(s, id, 'completed', 100, ['running'], 'Finished', now)
export const cutoff = (s: State, id: string, now: Date) => settle(s, id, 'cutoff', s.jobs.find(j => j.id === id)?.progress ?? 0, ['running'], 'Stopped at lab closing time (policy: stop). Charged for progress.', now)
// Policy: cancelling a queued job is free; cancelling a running job charges for progress made.
export const cancel = (s: State, id: string, now: Date) => settle(s, id, 'cancelled', s.jobs.find(j => j.id === id)?.status === 'running' ? s.jobs.find(j => j.id === id)!.progress : 0, ['queued', 'running'], 'Cancelled by user', now)
export const tick = (s: State): State => s.jobs.some(j => j.status === 'running' && j.progress < 96) ? { ...s, jobs: s.jobs.map(j => (j.status === 'running' ? { ...j, progress: Math.min(96, j.progress + 2) } : j)) } : s
// No carryover. Archives yesterday's consumed total; active jobs keep their reservations; grants expire.
export function rollover(s: State, now: Date): State {
  const d = dayKey(now); if (d <= s.date) return s // idempotent; never applies twice
  return log({ ...s, date: d, consumed: 0, grants: 0, history: [...s.history.filter(h => h.date !== s.date), { date: s.date, consumed: s.consumed }].slice(-30) }, 'New day: daily credits reset. Unfinished jobs keep their reserved credits.', now, 'system')
}
export const grant = (s: State, n: number): Res => !Number.isInteger(n) || n <= 0 ? fail('Grant must be a positive whole number.') : { ok: true, state: { ...s, grants: s.grants + n } }
export function applySettings(s: State, x: Settings): Res { const e = validateSettings(x); return e.length ? fail(e.join(' ')) : { ok: true, state: { ...s, settings: x } } }
export const setResourceStatus = (s: State, id: string, status: RStatus): Res =>
  status === 'maintenance' && s.jobs.some(j => j.resourceId === id && j.status === 'running') ? fail('Resource has a running job; finish or cancel it first.') : { ok: true, state: { ...s, resources: s.resources.map(r => (r.id === id ? { ...r, status } : r)) } }
export function workloadTotals(s: State) { const t: Record<string, number> = {}; for (const j of s.jobs) if (j.actual) t[j.workload] = (t[j.workload] ?? 0) + j.actual; return t }

const q = (v: unknown) => { const t = String(v ?? ''); return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t }
export function toCsv(s: State): string {
  const rows: unknown[][] = [['record_type', 'id', 'date', 'resource', 'workload', 'status', 'estimated_credits', 'actual_credits']]
  for (const h of s.history) rows.push(['daily_total', '', h.date, '', '', '', '', h.consumed])
  rows.push(['daily_total', '', s.date, '', '', 'in_progress', '', s.consumed])
  for (const j of s.jobs) rows.push(['job', j.id, j.createdAt, s.resources.find(r => r.id === j.resourceId)?.name ?? j.resourceId, j.workload, j.status, j.estimate, j.actual ?? ''])
  return '\uFEFF' + rows.map(r => r.map(q).join(',')).join('\r\n') + '\r\n'
}

// ---- Admin: permission matrix, scoped operations, audit trail. Client-side SIMULATION only: not a security boundary. ----
export const PERMS: Record<string, Role[]> = {
  'resource.edit': ['lab_manager', 'campus_admin', 'super_admin'], 'resource.register': ['campus_admin', 'super_admin'], 'resource.retire': ['campus_admin', 'super_admin'],
  'credits.grant': ['campus_admin', 'super_admin'], 'policy.edit': ['campus_admin', 'super_admin'], 'user.manage': ['campus_admin', 'super_admin'],
  'audit.view': ['campus_admin', 'super_admin'], 'job.control': ['lab_manager', 'campus_admin', 'super_admin'], 'system.pause': ['campus_admin', 'super_admin'], 'role.assign.super': ['super_admin'], 'reset': ['super_admin'] }
export const can = (r: Role, a: string) => PERMS[a]?.includes(r) ?? false
export const ROLES: Role[] = ['student', 'lab_manager', 'campus_admin', 'super_admin']
export const labScope = (r: Role) => (r === 'lab_manager' ? 'Lab A' : null) // demo scope: lab managers only manage Lab A
const deny = (a: string) => fail(`Your role is not permitted to do this (${a}).`)
export function record(s: State, actor: Role, action: string, target: string, outcome: AuditEntry['outcome'], now: Date, reason?: string): State {
  const e: AuditEntry = { id: `e${now.getTime()}-${s.audit.length}`, at: now.toISOString(), actor, action, target, outcome, reason }
  return { ...s, audit: [e, ...s.audit].slice(0, 300) }
}
// Wrap any admin result: success is logged on the new state, rejection is logged (as denied) on the old one.
export function audited(s: State, r: Res, actor: Role, action: string, target: string, now: Date, reason?: string): { state: State; error?: string } {
  return r.ok ? { state: record(r.state, actor, action, target, 'success', now, reason) } : { state: record(s, actor, action, target, 'denied', now, r.error), error: r.error }
}
export function adminGrant(s: State, role: Role, n: number, reason: string, now: Date): Res {
  if (!can(role, 'credits.grant')) return deny('credits.grant')
  if (!Number.isInteger(n) || n <= 0 || n > 10000) return fail('Grant must be a whole number from 1 to 10000.')
  if (reason.trim().length < 5) return fail('A reason of at least 5 characters is required.')
  return { ok: true, state: log({ ...s, grants: s.grants + n, ledger: [{ id: `l${now.getTime()}-${s.ledger.length}`, at: now.toISOString(), actor: role, amount: n, reason: reason.trim() }, ...s.ledger].slice(0, 300) }, `An administrator added ${n} credits to today's pool (${reason.trim()}).`, now, 'admin') }
}
export const superCount = (s: State) => s.users.filter(u => u.role === 'super_admin' && u.status === 'active').length
export function setUserRole(s: State, role: Role, id: string, to: Role): Res {
  if (!can(role, 'user.manage')) return deny('user.manage'); const u = s.users.find(x => x.id === id); if (!u) return fail('User not found.')
  if ((to === 'super_admin' || u.role === 'super_admin') && !can(role, 'role.assign.super')) return fail('Only a super administrator can grant or change super-administrator access.')
  if (u.role === 'super_admin' && to !== 'super_admin' && superCount(s) <= 1) return fail('Cannot demote the last active super administrator.')
  return { ok: true, state: { ...s, users: s.users.map(x => (x.id === id ? { ...x, role: to } : x)) } }
}
export function setUserStatus(s: State, role: Role, id: string, to: SimUser['status']): Res {
  if (!can(role, 'user.manage')) return deny('user.manage'); const u = s.users.find(x => x.id === id); if (!u) return fail('User not found.')
  if (u.role === 'super_admin' && !can(role, 'role.assign.super')) return fail('Only a super administrator can change a super administrator.')
  if (u.role === 'super_admin' && to === 'suspended' && superCount(s) <= 1) return fail('Cannot suspend the last active super administrator.')
  return { ok: true, state: { ...s, users: s.users.map(x => (x.id === id ? { ...x, status: to } : x)) } }
}
// ---- Admin job control and system switch ----
const jobLab = (s: State, j: Job) => s.resources.find(r => r.id === j.resourceId)?.lab
export type JobOp = 'start' | 'finish' | 'stop'
export function adminJobOp(s: State, role: Role, id: string, op: JobOp, now: Date): Res {
  if (!can(role, 'job.control')) return deny('job.control')
  const j = s.jobs.find(x => x.id === id); if (!j) return fail('Job not found.')
  const scope = labScope(role); if (scope && jobLab(s, j) !== scope) return fail(`Lab managers can only control jobs in ${scope}.`)
  if (op === 'start') return start(s, id, now)
  if (op === 'finish') return finish(s, id, now)
  return settle(s, id, 'cancelled', j.status === 'running' ? j.progress : 0, ['queued', 'running'], 'Stopped by administrator. Charged for progress made.', now)
}
export function adminStopAll(s: State, role: Role, now: Date): Res {
  if (!can(role, 'system.pause')) return deny('system.pause')
  const ids = s.jobs.filter(j => j.status === 'queued' || j.status === 'running').map(j => j.id)
  if (!ids.length) return fail('There are no queued or running jobs to stop.')
  let cur = s; for (const id of ids) { const r = adminJobOp(cur, role, id, 'stop', now); if (r.ok) cur = r.state }
  return { ok: true, state: cur }
}
export function setPaused(s: State, role: Role, paused: boolean, now: Date): Res {
  if (!can(role, 'system.pause')) return deny('system.pause')
  return { ok: true, state: log({ ...s, paused }, paused ? 'An administrator paused new jobs. You cannot submit or start jobs until they resume.' : 'An administrator resumed new jobs. You can submit jobs again.', now, 'admin') }
}
// Simulated telemetry only: derived from job state, never measured.
export function simUtil(s: State, r: Resource): number {
  const j = s.jobs.find(x => x.resourceId === r.id && x.status === 'running'); if (!j) return 0
  let h = 0; for (const c of j.id) h = (h * 31 + c.charCodeAt(0)) % 997
  return Math.min(99, 55 + (h % 25) + Math.round(j.progress / 5))
}
export function validateResource(r: Resource, others: Resource[]): string[] {
  const e: string[] = []
  if (!/^[a-z0-9][a-z0-9-]{1,23}$/.test(r.id)) e.push('ID must be 2–24 chars: lowercase letters, digits, hyphens.')
  if (others.some(o => o.id === r.id)) e.push('That ID is already used.')
  if (!r.name.trim()) e.push('Name is required.')
  if (others.some(o => o.name.trim().toLowerCase() === r.name.trim().toLowerCase())) e.push('That name is already used.')
  if (!r.lab.trim()) e.push('Lab is required.')
  if (!r.cpu.trim()) e.push('CPU description is required.')
  if (!Number.isInteger(r.memGb) || r.memGb < 1 || r.memGb > 4096) e.push('Memory must be a whole number of GB (1–4096).')
  if (!r.workloads.length) e.push('Select at least one workload.')
  if ((r.workloads.includes('gpu') || r.workloads.includes('render')) && !(r.gpu ?? '').trim()) e.push('GPU and render workloads need a GPU model.')
  return e
}
export function addResource(s: State, role: Role, r: Resource): Res {
  if (!can(role, 'resource.register')) return deny('resource.register'); const e = validateResource(r, s.resources); if (e.length) return fail(e.join(' '))
  return { ok: true, state: { ...s, resources: [...s.resources, { ...r, status: 'available' }] } }
}
export function updateResource(s: State, role: Role, r: Resource): Res {
  if (!can(role, 'resource.edit')) return deny('resource.edit'); const old = s.resources.find(x => x.id === r.id); if (!old) return fail('Resource not found.')
  if (labScope(role) && (old.lab !== labScope(role) || r.lab !== labScope(role))) return fail(`Lab managers can only manage ${labScope(role)}.`)
  const e = validateResource({ ...r, id: 'x-ok' }, s.resources.filter(x => x.id !== r.id)).filter(x => !x.startsWith('ID')); if (e.length) return fail(e.join(' '))
  if (s.jobs.some(j => j.resourceId === r.id && j.status === 'running' && !r.workloads.includes(j.workload))) return fail('A running job uses a workload you are removing.')
  return { ok: true, state: { ...s, resources: s.resources.map(x => (x.id === r.id ? { ...r, status: x.status } : x)) } }
}
export function setRetired(s: State, role: Role, id: string, retire: boolean): Res {
  if (!can(role, 'resource.retire')) return deny('resource.retire')
  if (retire && s.jobs.some(j => j.resourceId === id && (j.status === 'queued' || j.status === 'running'))) return fail('Resource has queued or running jobs. Finish or cancel them first.')
  return { ok: true, state: { ...s, resources: s.resources.map(x => (x.id === id ? { ...x, status: retire ? 'retired' : 'maintenance' } : x)) } } // reactivated nodes return via maintenance so admins review them
}
export const editPolicy = (s: State, role: Role, x: Settings): Res => (can(role, 'policy.edit') ? applySettings(s, x) : deny('policy.edit'))
export const resetDemo = (s: State, role: Role, now: Date): Res => (can(role, 'reset') ? { ok: true, state: { ...seed(now), audit: s.audit } } : deny('reset')) // audit trail survives a reset
export function adminStats(s: State, now: Date) {
  const rc: Record<string, number> = { available: 0, busy: 0, reserved: 0, maintenance: 0, retired: 0, closed: 0 }; for (const r of s.resources) rc[resourceStatus(s, r, now)]++
  const jc: Record<JStatus, number> = { queued: 0, running: 0, completed: 0, cancelled: 0, cutoff: 0 }; for (const j of s.jobs) jc[j.status]++
  const warnings: string[] = []
  if (s.paused) warnings.push('New jobs are paused by an administrator.')
  if (remainingOpenMinutes(s.settings, now) === 0) warnings.push('Lab is closed now; no new jobs can start.')
  if (rc.maintenance) warnings.push(`${rc.maintenance} node(s) under maintenance.`)
  if (s.jobs.filter(j => j.status === 'queued' || j.status === 'running').length >= s.settings.maxConcurrent) warnings.push('Concurrency limit reached.')
  if (warn(s)) warnings.push(`Credit usage at ${usedPct(s)}% of today's allowance.`)
  return { users: s.users.length, active: s.users.filter(u => u.status === 'active').length, suspended: s.users.filter(u => u.status === 'suspended').length, rc, jc, issued: allowanceTotal(s), grants: s.grants, consumed: s.consumed, warnings }
}

export const KEY = 'idlenode-state-v1'
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null
export function parseState(raw: string | null, now = new Date()): { state: State; recovered: boolean } {
  const base = seed(now); if (raw === null) return { state: base, recovered: false }
  try {
    const p: unknown = JSON.parse(raw)
    if (!isObj(p) || p.v !== 1 || !isObj(p.settings) || !Array.isArray(p.resources) || !Array.isArray(p.jobs)) throw new Error('shape')
    const st = { ...base, ...p, settings: { ...base.settings, ...p.settings, rates: { ...base.settings.rates, ...(isObj(p.settings.rates) ? p.settings.rates : {}) } } } as State
    if (st.resources.length === 0 || validateSettings(st.settings).length) throw new Error('invalid')
    if (!st.jobs.every(j => isObj(j) && typeof j.id === 'string' && Number.isFinite(j.estimate))) throw new Error('jobs')
    return { state: st, recovered: false }
  } catch { return { state: base, recovered: true } }
}
export const loadState = () => { try { return parseState(localStorage.getItem(KEY)) } catch { return { state: seed(), recovered: false } } }
export const saveState = (s: State) => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* storage unavailable: keep running in memory */ } }
