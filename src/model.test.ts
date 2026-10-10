import { describe, it, expect } from 'vitest'
import * as m from './model'
const mon = new Date(2026, 9, 12, 10, 0) // Mon 10:00 (deterministic)
const ok = (r: m.Res): m.State => { if (!r.ok) throw new Error(r.error); return r.state }
const sub = (s: m.State, minutes = 60, resourceId = 'n1', workload: m.Workload = 'cpu') => m.submit(s, { resourceId, workload, minutes }, mon)

describe('cost & credits', () => {
  it('ceils and handles zero/invalid', () => { expect(m.cost(4, 61)).toBe(5); expect(m.cost(0, 60)).toBe(0); expect(m.cost(NaN, 60)).toBe(0); expect(m.cost(4, -5)).toBe(0) })
  it('reserve on submit, not again on start', () => {
    let s = ok(sub(m.seed(mon))); expect(m.reserved(s)).toBe(4); expect(m.available(s)).toBe(96)
    s = ok(m.start(s, s.jobs[0].id, mon)); expect(m.reserved(s)).toBe(4); expect(m.available(s)).toBe(96)
  })
  it('finish charges once; second finish rejected', () => {
    let s = ok(sub(m.seed(mon))); const id = s.jobs[0].id; s = ok(m.start(s, id, mon)); s = ok(m.finish(s, id, mon))
    expect(s.consumed).toBe(4); expect(m.reserved(s)).toBe(0); expect(m.finish(s, id, mon).ok).toBe(false)
  })
  it('cancel queued is free; cancelled cannot start', () => {
    let s = ok(sub(m.seed(mon))); const id = s.jobs[0].id; s = ok(m.cancel(s, id, mon))
    expect(s.consumed).toBe(0); expect(m.available(s)).toBe(100); expect(m.start(s, id, mon).ok).toBe(false)
  })
  it('cutoff charges for progress and releases rest', () => {
    let s = ok(sub(m.seed(mon), 120)); const id = s.jobs[0].id; s = ok(m.start(s, id, mon))
    s = { ...s, jobs: s.jobs.map(j => ({ ...j, progress: 50 })) }; s = ok(m.cutoff(s, id, mon))
    expect(s.consumed).toBe(4); expect(m.reserved(s)).toBe(0); expect(s.jobs[0].status).toBe('cutoff')
  })
  it('available never negative; threshold uses grant-inclusive allowance', () => {
    let s = { ...m.seed(mon), consumed: 150 }; expect(m.available(s)).toBe(0)
    s = { ...m.seed(mon), consumed: 70 }; expect(m.warn(s)).toBe(false); s = ok(m.grant(s, 100)); expect(m.usedPct(s)).toBe(35)
  })
  it('insufficient credits rejected without state change', () => {
    const s = { ...m.seed(mon), consumed: 99 }; const r = sub(s, 120); expect(r.ok).toBe(false); expect(s.jobs).toHaveLength(0)
  })
})
describe('schedule & validation', () => {
  it('empty days / overnight / bad times rejected, no loops', () => {
    const b = m.seed(mon).settings
    expect(m.validateSettings({ ...b, days: [] })).not.toHaveLength(0)
    expect(m.validateSettings({ ...b, open: '22:00', close: '06:00' })[0]).toMatch(/Overnight/)
    expect(m.validateSettings({ ...b, open: '8am' })).not.toHaveLength(0)
    expect(m.remainingOpenMinutes({ ...b, days: [] }, mon)).toBe(0)
  })
  it('boundaries: open inclusive, close exclusive, weekend closed', () => {
    const b = m.seed(mon).settings
    expect(m.remainingOpenMinutes(b, new Date(2026, 9, 12, 8, 0))).toBe(720); expect(m.remainingOpenMinutes(b, new Date(2026, 9, 12, 20, 0))).toBe(0)
    expect(m.remainingOpenMinutes(b, new Date(2026, 9, 10, 10, 0))).toBe(0)
  })
  it('rejects job that cannot finish before close', () => { expect(m.submit(m.seed(mon), { resourceId: 'n1', workload: 'cpu', minutes: 60 }, new Date(2026, 9, 12, 19, 30)).ok).toBe(false) })
  it('compatibility, maintenance, reserved', () => {
    const s = m.seed(mon); expect(sub(s, 60, 'n1', 'gpu').ok).toBe(false); expect(sub(s, 60, 'n6').ok).toBe(false); expect(sub(s, 60, 'n4', 'gpu').ok).toBe(false)
  })
  it('concurrency counts queued+running and blocks at limit', () => {
    let s = ok(sub(m.seed(mon))); s = ok(sub(s, 30, 'n3', 'gpu')); expect(sub(s, 30, 'n5', 'sim').ok).toBe(false)
  })
  it('filters: cpu returns only cpu-capable; empty result possible', () => {
    const rs = m.seed(mon).resources; const cpu = m.filterResources(rs, { workload: 'cpu' })
    expect(cpu.length).toBeLessThan(rs.length); expect(cpu.every(r => r.workloads.includes('cpu'))).toBe(true)
    expect(m.filterResources(rs, { q: 'zzz' })).toHaveLength(0); expect(m.filterResources(rs, { status: 'maintenance' })).toHaveLength(1)
  })
})
describe('rollover, csv, persistence, admin', () => {
  it('rollover archives once and keeps active reservations', () => {
    let s = ok(sub(m.seed(mon))); s = { ...s, consumed: 9, grants: 5 }; const next = new Date(2026, 9, 13, 1, 0)
    const r = m.rollover(s, next); expect(r.history).toEqual([{ date: '2026-10-12', consumed: 9 }]); expect(r.consumed).toBe(0); expect(r.grants).toBe(0); expect(m.reserved(r)).toBe(4)
    expect(m.rollover(r, next)).toBe(r)
  })
  it('csv escapes and maps columns', () => {
    let s = m.seed(mon); s = { ...s, resources: [{ ...s.resources[0], name: 'A,"B"\nC' }, ...s.resources.slice(1)] }
    s = ok(sub(s)); const csv = m.toCsv(s); expect(csv).toContain('"A,""B""\nC"'); expect(csv.split('\r\n')[0]).toBe('\uFEFFrecord_type,id,date,resource,workload,status,estimated_credits,actual_credits')
    expect(csv).toContain(',cpu,queued,4,')
  })
  it('malformed storage recovers to defaults; partial data keeps fields', () => {
    expect(m.parseState('{bad', mon).recovered).toBe(true); expect(m.parseState('{"v":2}', mon).recovered).toBe(true)
    const p = m.parseState(JSON.stringify({ ...m.seed(mon), consumed: 7, settings: { allowance: 50 } }), mon); expect(p.recovered).toBe(false); expect(p.state.consumed).toBe(7); expect(p.state.settings.maxConcurrent).toBe(2)
  })
  it('admin validation and maintenance guard', () => {
    const s = m.seed(mon); expect(m.applySettings(s, { ...s.settings, allowance: -1 }).ok).toBe(false); expect(m.grant(s, 0).ok).toBe(false)
    let t = ok(sub(s)); t = ok(m.start(t, t.jobs[0].id, mon)); expect(m.setResourceStatus(t, 'n1', 'maintenance').ok).toBe(false)
  })
})

describe('admin', () => {
  const base = () => m.seed(mon), at = mon
  it('permission matrix: students/lab managers cannot grant; reason + bounds required', () => {
    expect(m.adminGrant(base(), 'student', 10, 'because', at).ok).toBe(false); expect(m.adminGrant(base(), 'lab_manager', 10, 'because', at).ok).toBe(false)
    expect(m.adminGrant(base(), 'campus_admin', 10, 'no', at).ok).toBe(false); expect(m.adminGrant(base(), 'campus_admin', 0, 'valid reason', at).ok).toBe(false); expect(m.adminGrant(base(), 'campus_admin', 10001, 'valid reason', at).ok).toBe(false)
    const s = ok(m.adminGrant(base(), 'campus_admin', 20, 'lab project', at)); expect(s.grants).toBe(20); expect(s.ledger[0]).toMatchObject({ amount: 20, reason: 'lab project', actor: 'campus_admin' })
  })
  it('no privilege escalation; last super admin protected', () => {
    expect(m.setUserRole(base(), 'campus_admin', 'u1', 'super_admin').ok).toBe(false); expect(m.setUserRole(base(), 'lab_manager', 'u1', 'student').ok).toBe(false)
    expect(m.setUserRole(base(), 'campus_admin', 'u5', 'student').ok).toBe(false); expect(m.setUserRole(base(), 'super_admin', 'u5', 'student').ok).toBe(false)
    expect(m.setUserStatus(base(), 'super_admin', 'u5', 'suspended').ok).toBe(false); expect(ok(m.setUserRole(base(), 'super_admin', 'u1', 'campus_admin')).users[0].role).toBe('campus_admin')
    expect(m.setUserStatus(base(), 'campus_admin', 'u1', 'suspended').ok).toBe(true)
  })
  it('resource validation, scope, retire guard', () => {
    const r = { id: 'n9', name: 'New-GPU', lab: 'Lab A', cpu: '8-core', memGb: 32, workloads: ['gpu' as m.Workload], status: 'available' as m.RStatus }
    expect(m.addResource(base(), 'campus_admin', r).ok).toBe(false) // gpu workload without GPU model
    expect(m.addResource(base(), 'campus_admin', { ...r, gpu: 'RTX' }).ok).toBe(true); expect(m.addResource(base(), 'campus_admin', { ...r, gpu: 'RTX', id: 'n1' }).ok).toBe(false)
    expect(m.addResource(base(), 'lab_manager', { ...r, gpu: 'RTX' }).ok).toBe(false); expect(m.addResource(base(), 'campus_admin', { ...r, gpu: 'RTX', memGb: 0 }).ok).toBe(false)
    const n1 = base().resources[0]; expect(m.updateResource(base(), 'lab_manager', { ...n1, name: 'Renamed' }).ok).toBe(true); expect(m.updateResource(base(), 'lab_manager', { ...base().resources[2], name: 'X' }).ok).toBe(false)
    const s = ok(sub(base())); expect(m.setRetired(s, 'campus_admin', 'n1', true).ok).toBe(false); expect(ok(m.setRetired(base(), 'campus_admin', 'n1', true)).resources[0].status).toBe('retired')
    expect(sub(ok(m.setRetired(base(), 'campus_admin', 'n1', true))).ok).toBe(false)
  })
  it('audit records success and denied; reset keeps audit; policy needs permission', () => {
    let s = m.audited(base(), m.adminGrant(base(), 'student', 5, 'valid reason', at), 'student', 'credits.grant', 'pool', at); expect(s.error).toBeTruthy(); expect(s.state.audit[0].outcome).toBe('denied'); expect(s.state.grants).toBe(0)
    const g = m.audited(s.state, m.adminGrant(s.state, 'campus_admin', 5, 'valid reason', at), 'campus_admin', 'credits.grant', 'pool', at, 'valid reason'); expect(g.state.audit).toHaveLength(2); expect(g.state.audit[0].outcome).toBe('success')
    expect(m.resetDemo(g.state, 'campus_admin', at).ok).toBe(false); const r = ok(m.resetDemo(g.state, 'super_admin', at)); expect(r.audit).toHaveLength(2); expect(r.grants).toBe(0)
    expect(m.editPolicy(base(), 'lab_manager', base().settings).ok).toBe(false); expect(m.editPolicy(base(), 'campus_admin', { ...base().settings, maxMinutes: 2 }).ok).toBe(false)
  })
  it('max duration setting is enforced; stats come from state', () => {
    const s = ok(m.editPolicy(base(), 'campus_admin', { ...base().settings, maxMinutes: 30 })); expect(sub(s, 60).ok).toBe(false); expect(sub(s, 30).ok).toBe(true)
    const st = m.adminStats(ok(sub(base())), mon); expect(st.jc.queued).toBe(1); expect(st.users).toBe(5); expect(st.suspended).toBe(1); expect(st.rc.maintenance).toBe(1)
  })
})

describe('admin job control', () => {
  const run = () => { let s = ok(sub(m.seed(mon))); s = ok(m.start(s, s.jobs[0].id, mon)); return s }
  it('pause blocks submit and start; resume restores', () => {
    let s = ok(m.setPaused(m.seed(mon), 'campus_admin', true, mon)); expect(sub(s).ok).toBe(false)
    s = ok(m.setPaused(s, 'campus_admin', false, mon)); expect(sub(s).ok).toBe(true)
  })
  it('students cannot pause or control jobs; lab manager cannot pause', () => {
    const s = run(); expect(m.setPaused(s, 'student', true, mon).ok).toBe(false); expect(m.setPaused(s, 'lab_manager', true, mon).ok).toBe(false)
    expect(m.adminJobOp(s, 'student', s.jobs[0].id, 'stop', mon).ok).toBe(false)
  })
  it('admin stop charges for progress and frees reservation', () => {
    let s = run(); s = { ...s, jobs: s.jobs.map(j => ({ ...j, progress: 50 })) }; s = ok(m.adminJobOp(s, 'campus_admin', s.jobs[0].id, 'stop', mon))
    expect(s.jobs[0].status).toBe('cancelled'); expect(s.consumed).toBe(2); expect(m.reserved(s)).toBe(0)
  })
  it('lab manager limited to Lab A jobs', () => {
    let s = ok(sub(m.seed(mon), 60, 'n3', 'gpu')); expect(m.adminJobOp(s, 'lab_manager', s.jobs[0].id, 'stop', mon).ok).toBe(false)
    s = ok(sub(m.seed(mon))); expect(m.adminJobOp(s, 'lab_manager', s.jobs[0].id, 'stop', mon).ok).toBe(true)
  })
  it('stop all needs jobs and permission', () => {
    expect(m.adminStopAll(m.seed(mon), 'campus_admin', mon).ok).toBe(false)
    const s = ok(m.adminStopAll(run(), 'super_admin', mon)); expect(s.jobs.every(j => j.status === 'cancelled')).toBe(true)
  })
})

describe('student activity log', () => {
  it('records job events, admin actions and system notices with a kind', () => {
    let s = ok(sub(m.seed(mon))); expect(s.activity[0].kind).toBe('job'); expect(s.activity[0].text).toContain('Atlas-CPU-01')
    s = ok(m.adminGrant(s, 'campus_admin', 20, 'course project', mon)); expect(s.activity[0].kind).toBe('admin')
    s = ok(m.setPaused(s, 'campus_admin', true, mon)); expect(s.activity[0].kind).toBe('admin')
    const next = m.rollover(s, new Date(2026, 9, 13, 9, 0)); expect(next.activity[0].kind).toBe('system'); expect(m.rollover(next, new Date(2026, 9, 13, 10, 0)).activity.length).toBe(next.activity.length)
  })
})
