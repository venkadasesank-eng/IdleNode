# IdleNode (frontend-only simulation)
Run: `npm install`, then `npm run dev` · `npm test` · `npm run typecheck` · `npm run build`.

## Architecture
`src/model.ts` holds all rules (pure TS, no React): cost, credits, schedule, one validator shared by submit and start, lifecycle, rollover, CSV, versioned persistence. `src/App.tsx` is the student shell and five pages; `src/Admin.tsx` is the admin panel. `src/styles.css` holds theme tokens.

## Rules
- Estimate = ceil(rate × minutes / 60); zero rate = 0.
- Available = max(0, allowance + today's grants − consumed − reserved). Reserved = queued + running estimates.
- 80% warning = (consumed + reserved) / (allowance + grants), on every screen.
- Queued and running jobs both count toward concurrency.
- Cancel queued: free. Cancel running or cutoff: charge for progress. Finish: charge the estimate.
- Overnight lab hours are rejected. Cutoff policy is "stop" only. No carryover; active jobs keep reservations across rollover.

## Student Activity Log
Sidebar → **Activity Log** (or the bell). Lists everything that happened to the student's jobs and credits, grouped by day, tagged **Job**, **Admin** (pause/resume, credit grants) or **System** (daily reset). Search, filter by type, mark all read, download CSV. Keeps the latest 200 entries, stored in this browser only.

## Friendly guidance
Each page has a one-line plain-language hint, Overview has a dismissible 3-step getting-started guide that ticks off as you go, and job cards explain their status in a sentence.

## Admin Panel (client-side simulation, NOT secure)
**How to open it:** click the green **S** avatar (top right) → *Admin panel*, or use *Admin Panel* at the bottom of the sidebar, Ctrl+K → "Admin Panel", or go to `#/admin`. Sign in by choosing a demo role (the role is remembered for the browser session).

Sections: **Monitor** (live running/queued jobs, node load, credit use, warnings, live event feed), **Jobs** (every job with Start / Finish / Stop), **Nodes** (edit, set condition, register, retire), **Users**, **Credits & Policy** (policy, grants with reasons, reset), **Audit log**.

System controls (top of the panel): **Pause new jobs** blocks every submit and start for students; **Emergency stop all** stops every queued/running job (running jobs are charged for progress made).

Roles and rules live in `src/model.ts` (`PERMS`, `can`). Every admin operation checks the role, validates input and is recorded in the audit log (success or denied). The role picker is a demo switch: any visitor can use it. A real deployment needs server-side authentication and the same checks on every API call, plus a server-stored audit log.

| Action | Lab Manager | Campus Admin | Super Admin |
|---|---|---|---|
| Start / finish / stop jobs | Lab A only | yes | yes |
| Pause new jobs, stop all jobs | no | yes | yes |
| Edit resources | Lab A only | yes | yes |
| Register / retire resources | no | yes | yes |
| Edit policy, grant credits (reason required) | no | yes | yes |
| Manage users, view audit log | no | yes | yes |
| Grant or change super-admin role, reset demo | no | no | yes |

The last active super administrator cannot be demoted or suspended. Users shown are labelled simulated samples. Node load on the Monitor page is derived from simulated job state, not measured.

## Design (UI/UX Pro Max README read; its search tool was not run)
Ivory/forest/teal tokens, Georgia headings, system body, 44px targets, visible focus, reduced-motion respected.

## Simulated / not real
Auth and the admin switch, job execution, progress, the workspace terminal and files, utilization. Production needs: real auth and roles, a database, a scheduler and workers, server-side credit accounting, audit logs, rate limiting, campus network controls.
