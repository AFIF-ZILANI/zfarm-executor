# Mobile UX audit: actions, loading, data fetching

Date: 2026-11-26. Branch: `fix/ux-audit-2026-11`. Follows `ux-audit-2026-10.md`.

## How this was done

- **Ran on the Android emulator** (Medium_Phone_API_36.1) in Expo Go, against the local API and local DB.
  Signed in as a Worker (`test.worker`) and a Manager (`test.manager`).
- **Failure testing:** stopped the API mid-session to see what each screen shows when the server can't be
  reached (the same as a shed with no signal).
- **Read:** the data layer (`api.ts`, query client in `_layout.tsx`), every screen's loading / error /
  empty branches, the shared form spine, pickers and the submit path.
- **(seen)** = observed on the emulator. **(code)** = from the source.

## P0: wrong information, or blocks the work

| ID | Finding | Fix |
| --- | --- | --- |
| P0-1 | **Offline, forms say "No batch in this house. Nothing can be logged here."** (seen) on Weight for FK House, which Home lists with 10 birds. The flock lookup failed, and the form reports that as "no batch". Offline logging is what this app is built for. `batch-resolver.tsx`. | Seed the per-house lookup from the farm-wide balances already cached. If the flock still can't be loaded, say so with a Retry instead of claiming there is no batch. |
| P0-2 | **Data never refreshes when the app comes back to the foreground** (code). React Query only refetches "on focus" when its `focusManager` is wired to `AppState`; it isn't. A worker opens the app in the morning and sees yesterday's figures until they pull down (and Home has no pull-down, P1-3). | Wire `focusManager` to `AppState` in `_layout.tsx`. |
| P0-3 | **Home "Today" counts tasks done on other days** (seen): "Today, 5 of 5 done" listed five tasks completed on Oct 25. The query has no lower date bound and every DONE task is counted. | Count and list only tasks done today. |
| P0-4 | **Bird count flips between 100 and 200** (seen). Home and Houses share the cache key `['batch-house-balances','all']` but fetch `limit=50` and `limit=100`, so whichever screen loaded last wins. Both truncate: the list includes empty balances, so live ones fall off the page as batches accumulate. Same key-sharing bug for alerts (Home `limit=50`). | One shared hook per list that fetches every page. |
| P0-5 | **A failed load shows a false "nothing here"** (seen, code). Server unreachable: Performance shows "0 points, No points that month, Payroll has not run yet"; Home shows 0 tasks, 0 birds, "Nothing assigned today". By code, the same on Stock item ("Item not found"), Sold packs ("No packs waiting"), Link items ("No QR-tracked lots"), Vaccine confirm ("isn't on the schedule any more"), and every picker ("No active houses."). | One shared "Couldn't load" state with Retry, used on each of these. |

## P1: confusing or slow

| ID | Finding | Fix |
| --- | --- | --- |
| P1-1 | **No save confirmation on 12 of 13 forms** (code, seen). Only Mortality shows "Recorded". Weight, Environment, Treatment, Use supplies, Move supplies, Complete task, Move birds, Correct stock, Give points, Assign, Flag stock just close; Feeding program clears its fields silently. The worker can't tell the save worked. | Haptic + "Saved" toast from the one write path (`useQueuedSubmit`), so every form gets it. |
| P1-2 | **Screen clocks freeze when the screen first opens** (seen): Home said "Today Nov 17" on Nov 26 after the app sat in the background. Tab screens stay mounted for days, so "today", due labels and cycle day go stale. 9 screens hold `now` in state. | `useNow()`: refreshes on screen focus and app foreground. |
| P1-3 | **Home has no pull-to-refresh** (code). Every other list screen has one. | Add it. |
| P1-4 | **Home shows zeros while loading** (code): "0 Tasks left", "0 Birds", "Nothing assigned today" before data arrives. | Skeletons until the first load. |
| P1-5 | **House detail: Stock buttons jump down after load** (seen). They render where a thumb lands, then Recent activity / Vaccines load above them and push them down: a mis-tap waiting to happen. | Put the Stock buttons right after the record tiles, above anything that loads late. |
| P1-6 | **Broken or unloaded photos show a blank circle** (seen, Team list). | Draw initials under the photo, so a failed photo falls back by itself. Home's own copy of the avatar uses the shared one. |
| P1-7 | **Alerts filter chips count only the first 50 of 236** (seen): "All 50, Critical 0" under a tab reading "Alerts 236". Critical could be hidden. | Load every active alert (P0-4 hook). |
| P1-8 | **A disabled submit button doesn't say why** (seen, open since V9 in October). | One line above the button naming what's missing, on the worker log forms. |

## P2: polish

| ID | Finding | Fix |
| --- | --- | --- |
| P2-1 | Login has no app name (seen); Email's keyboard has no "Next". | Name above the form; Next moves to Password. |
| P2-2 | My tasks: done rows say "Done" twice, a pill and "Done · Oct 25" (seen). | Drop the duplicate from the meta line. |

## Checked and fine

Skeleton loading on list screens, offline queue + sync banner, discard confirm on touched forms, Settings
and Sync center, Houses list, Stock list, Team, Alerts actions, the + sheet grouping, Expo Go cold start.

## Not covered

Real camera scanning, the release APK, dark mode (already passed in October), Dynamic Type.

## Found while fixing

- **P0-4 was bigger than it looked.** The local DB has 9,558 live birds in 115 houses. Home showed 100 or
  200, and Houses showed "20 of 100 running", because the house list itself also stopped at 100 (641 active
  houses locally). The house picker had the same cap (B4 in October). Fixed by fetching every page of houses.
- **Critical alerts were hidden.** With all 254 active alerts loaded, Home's strip turned red ("Needs
  attention"): the first 50 had no critical one.
- **Pull-down on Home didn't send queued records.** It now flushes the queue as well as reloading.

## Fixed (branch `fix/ux-audit-2026-11`)

Every finding above, P0-1 to P2-2. Shared pieces: `focusManager` wiring (`_layout.tsx`), `useNow()`
(`lib/use-now.ts`), `useAllBalances` / `useActiveAlerts` (`lib/queries.ts`), all-pages `useHouseOptions`,
`LoadFailed` (`empty-state.tsx`), the picker `onRetry`, the submit bar `reason`, and the save toast + buzz
in `useQueuedSubmit`. `doneToday()` has a check in `tasks-view.test.ts`.

Verified on the emulator: Home and Houses both read 9,558 birds (matches the DB); worker Home no longer
lists Oct 25 tasks; house detail Stock buttons stay put; Team shows initials for broken photos; the reason
line updates as Weight fills in; "Saved" toast on Weight (online, 201) and Mortality (offline, queued, sent
on the next pull, 201). With the API stopped: Performance says "Couldn't load your points" with "–" instead
of 0; a form for a house in the cached farm list shows its flock; an unknown house says "Couldn't load this
house's flock" with retry. `tsc`, `expo lint` and `bun run test` clean.

Not changed: pickers built on other lists (doctors, disease cases, units) still show their empty label on a
failed load; the Email field still has no "Next" key (TextField doesn't take a ref).
