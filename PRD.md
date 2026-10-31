# PRD: Eventiq, a GenAI-Powered Event Planning Assistant

| | |
|---|---|
| **Status** | Ready to build |
| **Challenge** | PromptWars: AI Code Submission |
| **Problem statement** | Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas. |
| **Evaluation** | AI-evaluated on 6 weighted criteria (see Section 2) |
| **Build approach** | Prompt-driven development in Cursor / Claude Code, committed to a single branch |

---

## 1. Hard Rules (Non-Negotiable)

A violation of any rule below may cause the submission to **not be evaluated at all**. These override every other requirement in this document.

| # | Rule | How we comply | How we verify |
|---|------|---------------|---------------|
| R1 | Repository size **< 10 MB** | `.gitignore` committed in the very first commit (`node_modules`, `.env`, `logs`, `coverage`, `dist`). No images, videos, or font files. System font stack only. No lockfile bloat from unused deps. | `du -sh .git` and `git count-objects -vH` |
| R2 | **Only one branch** | Work only on `main`. Never create feature branches. Delete any accidental branch locally and on the remote. | `git branch -a` shows only `main` and `origin/main` |
| R3 | Work built **through prompting and coding** in the AI platform, with regular commits and pushes | Small, meaningful commits after each module, pushed regularly. | `git log --oneline` reads as a coherent build history |
| R4 | **README** must contain: chosen vertical, approach and logic, how the solution works, assumptions | README structure is fixed (Section 14), in this exact order. | README checked against Section 14 before each submission |
| R5 | Must pick a vertical and design around that persona and logic | Vertical: **general event planning**, covering weddings, birthdays, community events (the three named in the problem statement) plus any other event type via a generic profile. Persona: a practical, budget-aware planner. | README section 1 states this explicitly |
| R6 | **No secrets in the repo** | `.env.example` only. API key read from environment. Never logged. | `git log -p` search for key patterns before every submission |

### Challenge expectations the solution must demonstrate
1. A smart, dynamic assistant
2. Logical decision making based on user context
3. Practical, real-world usability
4. Clean, maintainable code

---

## 2. Evaluation Criteria and Scoring Strategy

Submissions are reviewed by an AI on six parameters. Impact tiers are fixed by the platform:

| Tier | Criterion | Priority in this project |
|------|-----------|--------------------------|
| **HIGH** | Code Quality | ~35% of effort |
| **HIGH** | Problem Statement Alignment | ~35% of effort |
| **MEDIUM** | Security | ~10% of effort |
| **MEDIUM** | Efficiency | ~10% of effort |
| **LOW** | Testing | ~5% of effort |
| **LOW** | Accessibility | ~5% of effort |

**Rule of thumb:** a miss in a High tier hurts drastically; Medium hurts moderately; Low gives only a small boost but is still required for a perfect score. If time runs short, cut from Low first, then Medium. **Never cut from High.**

### 2.1 Traceability matrix (what the AI grader should be able to find)

An AI grader reads the file tree and README first, so every criterion maps to a specific, easy-to-find artifact.

| Criterion | Evidence file(s) | What the grader sees |
|-----------|------------------|----------------------|
| Code Quality | `src/` layered structure, `.eslintrc`, `.prettierrc`, JSDoc, `src/config/constants.js` | Layers, no duplication, no magic numbers, lint-clean |
| Problem Statement Alignment | `src/profiles/*`, `src/services/decisionEngine.js`, plan response with 4 outputs, "Why this plan?" panel | Budget, timeline, vendors, ideas all present and driven by user context |
| Security | `src/schemas/*`, `src/middleware/*`, `src/utils/sanitize.js`, `src/prompts/*`, CSP config | Validation everywhere, helmet, rate limit, injection guard |
| Efficiency | `src/utils/cache.js`, `Promise.all` in `planService.js`, what-if endpoint, compression | Cache, parallel calls, deterministic recalculation |
| Testing | `tests/*`, `npm test` | Offline, passing, focused on core logic |
| Accessibility | `public/index.html`, `public/css/styles.css`, `public/js/ui.js` | Semantic HTML, labels, focus, aria-live |

### 2.2 Definition of Done per criterion

**Code Quality (HIGH)**
- Layered architecture: `config / profiles / services / prompts / schemas / controllers / routes / middleware / utils`
- Controllers are thin (parse, call service, respond). Business logic lives in services.
- Decision logic is pure functions. No `if (eventType === ...)` branches in services (strategy pattern via profiles).
- Single-responsibility functions, target under ~40 lines each, files under ~250 lines.
- No magic numbers: all thresholds in `constants.js` or profile files.
- ESLint + Prettier configured and passing (`npm run lint` exits 0).
- JSDoc on every exported function.
- No dead code, no commented-out blocks, no TODOs, no `console.log` (use pino).
- One centralized error handler and one consistent error response shape.
- Config validated at startup; the app fails fast with a clear message on invalid config.

**Problem Statement Alignment (HIGH)**
- Every generated plan contains all four outputs: **budget breakdown, timeline, vendor checklist, personalized ideas**.
- Supports weddings, birthdays, community events, and any other event.
- Output visibly changes with context: event type, budget per guest, guest count, date proximity, season, cost level, dietary/cultural notes, theme.
- Logic is visible: "Why this plan?" panel lists rules that fired and what each changed.
- Practical: exportable (`.ics`, printable), checklist is tickable, what-if recalculation, works without an API key (offline mode).

**Security (MEDIUM)**
- All request bodies validated with zod (types, ranges, string length caps).
- Gemini output validated against a zod schema before use. Invalid output is never trusted.
- `helmet` with a strict CSP (`default-src 'self'`, no inline scripts).
- `express-rate-limit` on all `/api` routes (stricter on LLM-backed routes).
- Prompt-injection guard (Section 9.4).
- Model output rendered with `textContent`, never `innerHTML`.
- No secrets in repo or logs. CORS locked to same origin by default.
- Request body size limit (e.g. 20 KB).

**Efficiency (MEDIUM)**
- In-memory LRU cache with TTL for identical plan requests.
- Independent Gemini calls run in parallel (`Promise.all`).
- Timeouts and bounded retry with backoff on Gemini calls.
- What-if recalculation is deterministic (no LLM call).
- gzip compression; frontend payload under 100 KB uncompressed.
- No unnecessary dependencies; repo under 10 MB.

**Testing (LOW)**
- `npm test` passes offline with no API key (Gemini mocked).
- Unit tests: decision engine, budget reconciliation, timeline date math, schemas, ICS generation, prompt builders.
- One parametrized suite run across every profile, including generic.
- One API integration test with Gemini mocked.
- Do not chase coverage numbers; test the core logic well.

**Accessibility (LOW)**
- Semantic landmarks (`header`, `main`, `nav`, `section`, `footer`).
- Every input has a visible, associated `<label>`; errors tied via `aria-describedby`.
- Fully keyboard operable with visible focus states.
- `aria-live` regions for loading, results, and errors; focus moves to results after generation.
- WCAG AA colour contrast; information never conveyed by colour alone (health meter has text labels).
- `prefers-reduced-motion` respected; usable at 360 px width and 200% zoom.

---

## 3. Problem and Goals

### 3.1 Problem
Organizing an event means juggling a budget, a deadline, many vendors, and a pile of ideas. People overspend on the wrong things, start too late, and forget critical vendors or permissions. Generic chatbots give generic advice and cannot guarantee that budget numbers add up.

### 3.2 Goals
1. Produce a complete, **context-aware** event plan in one step: budget, timeline, vendor checklist, ideas.
2. Make decisions **logically and transparently**: the user can see why the plan looks the way it does.
3. Guarantee **numerically correct budgets** (always reconcile exactly).
4. Stay **usable offline** and under API failure.
5. Ship **clean, maintainable, secure** code that an AI reviewer can understand quickly.

### 3.3 Non-goals (v1)
- User accounts, authentication, or a database
- Real vendor booking, payments, or live vendor data
- Multi-currency conversion (INR default; symbol configurable in constants)
- Multi-user collaboration
- Native mobile apps

---

## 4. Personas and User Stories

**Persona: "The Practical Organizer"**: a first-time or occasional event organizer (family member, friend, volunteer, community lead) with a fixed budget and a date, who wants clear next steps and honest warnings.

| ID | Story | Priority |
|----|-------|----------|
| US1 | As an organizer, I enter event type, date, guests, budget, city and preferences, and get a full plan. | Must |
| US2 | I see exactly how my budget is split and whether it is realistic for my guest count. | Must |
| US3 | I get a timeline that adapts to how much time I actually have. | Must |
| US4 | I get a vendor checklist with questions to ask and red flags. | Must |
| US5 | I get personalized ideas matching my theme, audience and constraints. | Must |
| US6 | I can see why the plan was shaped this way. | Must |
| US7 | I can change guests or budget and instantly see the effect. | Should |
| US8 | I can ask for changes in plain language ("make it cheaper"). | Should |
| US9 | I can export the timeline to my calendar and print the plan. | Should |
| US10 | I can tick off checklist items and have them remembered. | Should |
| US11 | The tool still works if the AI service is unavailable. | Must |
| US12 | I can plan an event type that is not wedding/birthday/community. | Must |

---

## 5. Scope: Event Types and Profiles

The problem statement lists weddings, birthdays, and community events as examples of what the assistant should handle. The system supports **any event** via a profile registry:

| Profile | Depth | Used when |
|---------|-------|-----------|
| `wedding` | Rich | Event type = Wedding |
| `birthday` | Rich | Event type = Birthday |
| `community` | Rich | Event type = Community |
| `generic` | Standard | Event type = Other (free-text name, e.g. baby shower, corporate offsite, farewell) |

`getProfile(type)` returns the matching profile, otherwise `generic`. **Services and the decision engine never branch on event type**; they only consume the profile object. Adding a new event type means adding one profile file.

### 5.1 Profile contract

```js
{
  id: 'wedding',
  label: 'Wedding',
  budgetAllocation: { venue: 20, catering: 30, /* ... sums to 100 */ },
  timelineMilestones: [{ id, label, weeksBefore }],
  vendorCategories: [{ id, label, bookWeeksBefore, questionsHint }],
  perGuestBands: { comfortable, tight },     // INR per guest at the "average" cost level
  rules: [{ id, description, applies(ctx), apply(ctx) }],
  promptContext: 'string used in prompts'
}
```

A rule's `apply(ctx)` returns `{ allocationShifts?, warnings?, priorityFlags?, extraTasks?, risks? }`. Shifts are expressed in percentage points and must net to zero.

---

## 6. Functional Requirements

### 6.1 Intake form (FR-1x)

| ID | Requirement |
|----|-------------|
| FR-10 | Event type selector: Wedding, Birthday, Community, Other. "Other" reveals a name field (max 60 chars). |
| FR-11 | Common fields: event date, guest count, total budget (INR), city, cost level (low / average / high, default average), theme/style, notes. |
| FR-12 | Dynamic fields per type. Wedding: functions to include (haldi, mehendi, sangeet, wedding, reception), indoor/outdoor, dietary/regional notes. Birthday: age of guest of honour, surprise (yes/no), indoor/outdoor. Community: expected crowd, sponsorship target, indoor/outdoor, public/private. |
| FR-13 | Client-side validation mirrors server rules and shows inline, accessible errors. |
| FR-14 | Server validates everything again (client is never trusted). |

**Validation limits (constants):**

| Field | Rule |
|-------|------|
| Event date | Valid, today or later, at most 3 years ahead |
| Guest count | Integer 1 to 5,000 |
| Budget | Integer INR 1,000 to 100,000,000 |
| City | String, max 80 (used only for prompts and ideas, never for pricing) |
| Cost level | Enum: `low`, `average`, `high` (default `average`) |
| Theme | String, max 80 |
| Notes | String, max 500 |
| Event name (Other) | String, max 60 |
| Refine instruction | String, max 300 |

### 6.2 Plan generation (FR-2x)

| ID | Requirement |
|----|-------------|
| FR-20 | `POST /api/plan` returns a plan with: summary, budget breakdown, budget health, timeline, vendor checklist, ideas, warnings, risks, fired rules, and `mode` (`ai` or `offline`). |
| FR-21 | Budget numbers are computed only in code. Gemini never produces final numbers. |
| FR-22 | Gemini generates descriptive content only: category rationale and tips, task details, vendor questions and red flags, ideas. |
| FR-23 | If Gemini fails, times out, or returns schema-invalid output after retry, return a deterministic plan from profile templates with `mode: "offline"` and a visible banner. |
| FR-24 | Identical requests are served from cache (AI-mode results only). "Identical" is defined by the cache key in Section 9.7. |

### 6.3 Results display (FR-3x)

| ID | Requirement |
|----|-------------|
| FR-30 | Four stacked sections, each under its own heading: **Budget**, **Timeline**, **Vendors**, **Ideas**, with a jump-link nav (anchor links) at the top of the results. No tab widget. |
| FR-31 | **Budget health meter**: Comfortable / Tight / Unrealistic with text label and reason. |
| FR-32 | **"Why this plan?" panel** lists every fired rule with its description and effect. |
| FR-33 | **Risk radar**: top 3 risks, each with a mitigation. |
| FR-34 | Vendor checklist items are tickable; state is saved in `localStorage` (wrapped in try/catch). |
| FR-35 | Offline-mode banner when the plan is template-based. |
| FR-36 | The last request and plan are saved in `localStorage` (try/catch, with a saved-at timestamp) and restored on page load with a "Restored from <date>" notice and a Regenerate button, so a refresh does not lose the plan. Checklist state is keyed by plan id. |

### 6.4 Interaction features (FR-4x)

| ID | Requirement |
|----|-------------|
| FR-40 | **What-if**: changing guests or budget calls `POST /api/plan/whatif`, which re-runs the decision engine and budget math only (no LLM) and updates numbers, health, warnings. |
| FR-41 | **Refine**: plain-language instruction updates the current plan (Section 9.5). |
| FR-42 | **Export**: `.ics` file of timeline milestones; "Add to Google Calendar" link per milestone; print stylesheet for a clean printable plan. |

---

## 7. Decision Engine Specification

File: `src/services/decisionEngine.js`. **Pure and deterministic.** Runs before any Gemini call. This is the heart of "logical decision making based on user context" and must be easy for a grader to find and read.

### 7.1 Pipeline

```
validated request
  → getProfile(eventType)
  → context = { request, weeksToEvent, perGuest, costLevel, season, bands }
  → baseAllocation = profile.budgetAllocation (variant-adjusted)
  → run profile rules, then shared rules (in fixed order)
  → apply allocation shifts (net zero), enforce floors, normalize to 100
  → compute rupee amounts (budgetService)
  → return { allocations, budgetHealth, warnings, priorityFlags, extraTasks, risks, firedRules, constraints }
```

### 7.2 Budget math (`budgetService`)

1. Percentages must sum to exactly 100 after shifts. Normalize if needed.
2. Rupee amount = `floor(budget × pct / 100)` per category.
3. The rounding remainder goes to the **contingency** category so the total equals the budget **exactly**.
4. Contingency floor: **5%**. No rule may push it below the floor.
5. No category may go below 0 after shifts.
6. Invariant (tested): `sum(allocations) === budget` for every profile and every rule combination.

### 7.3 Base allocations (percent, per profile; assumptions, configurable)

| Category | Wedding | Birthday (adult) | Birthday (child) | Community | Generic |
|----------|---------|------------------|------------------|-----------|---------|
| Venue | 20 | 25 | 15 | 15 | 25 |
| Catering / food | 30 | 35 | 30 | 25 | 30 |
| Decor | 12 | 10 | 12 | 8 | 12 |
| Photography | 8 | 3 | 3 | n/a | n/a |
| Attire & jewellery | 10 | n/a | n/a | n/a | n/a |
| Entertainment / activities | 5 | 12 | 18 | n/a | 13 |
| Stage, sound, lighting | n/a | n/a | n/a | 20 | n/a |
| Makeup & beauty | 3 | n/a | n/a | n/a | n/a |
| Cake | n/a | 6 | 7 | n/a | n/a |
| Return gifts / misc | n/a | 3 | 8 | n/a | 4 |
| Safety & first aid | n/a | n/a | n/a | 7 | n/a |
| Volunteers & logistics | 4 | n/a | n/a | 10 | 8 |
| Publicity | n/a | n/a | n/a | 5 | n/a |
| Contingency | 8 | 6 | 7 | 10 | 8 |
| **Total** | **100** | **100** | **100** | **100** | **100** |

### 7.4 Budget health

`perGuest = budget / guests`. The user picks a **cost level** (how expensive their area is), which maps to a multiplier: `low` = 0.8, `average` = 1.0, `high` = 1.3 (assumption, configurable). `effectivePerGuest = perGuest / multiplier` is compared against the profile bands below. There is no city lookup table; the city string never affects pricing.

| Profile | Comfortable at or above | Tight at or above | Unrealistic below |
|---------|------------------------|-------------------|-------------------|
| Wedding | INR 3,000 | INR 1,500 | INR 1,500 |
| Birthday | INR 800 | INR 400 | INR 400 |
| Community | INR 300 | INR 150 | INR 150 |
| Generic | INR 1,000 | INR 500 | INR 500 |

(Thresholds are stated as assumptions in the README and live in the profile files.)

### 7.5 Shared rules (apply to every profile)

| Rule ID | Trigger | Effect |
|---------|---------|--------|
| `S-HEALTH` | Always | Computes budget health and a plain-language reason. Tight: protect catering (+4 pts), trim decor (-4 pts). Unrealistic: adds a warning recommending fewer guests or a higher budget, with the concrete minimum budget for the current guest count. |
| `S-CONTINGENCY` | Always | Enforces the 5% contingency floor. |
| `S-URGENT` | Fewer than 4 weeks to event | Compresses timeline, marks long-lead vendors "book immediately", adds a warning. |
| `S-VERY-URGENT` | Fewer than 1 week | Switches to a last-minute checklist; drops long-lead tasks; warns about limited availability. |
| `S-LARGE` | Guests > 400 | Adds crowd-flow, parking, and staffing tasks; suggests larger venue category. |
| `S-SMALL` | Guests < 30 | Suggests home or small-venue options; reduces venue share (-5 pts to food). |
| `S-OUTDOOR-SEASON` | Outdoor and event in monsoon months (Jun to Sep) | Adds a backup-venue/tent task and a weather risk. |

### 7.6 Profile rules (examples; each is a small pure function with a unit test)

**Wedding**
| Rule | Trigger | Effect |
|------|---------|--------|
| `W-FUNCTIONS` | Multiple functions selected | Splits budget and guest share across functions; adds per-function tasks. |
| `W-PEAK-SEASON` | Event in Oct to Feb | Warns about peak-season venue and photographer demand; moves venue booking earlier. |
| `W-DIETARY` | Dietary/regional notes present | Adds catering checklist items (e.g. Jain, vegetarian, regional menu tasters). |
| `W-SHORT-NOTICE` | Under 60 days | Compresses timeline; flags venue, photographer, caterer as book-immediately. |

**Birthday**
| Rule | Trigger | Effect |
|------|---------|--------|
| `B-CHILD` | Age under 13 | Uses child allocation; adds supervisor-to-guest ratio (1 adult per 8 children), allergy checks, short run-of-show. |
| `B-TEEN` | Age 13 to 19 | Shifts toward entertainment and food; adds supervision and curfew notes. |
| `B-MILESTONE` | Age 18, 21, 30, 40, 50, 60+ | Adds a tribute/slideshow idea and a photography upgrade suggestion. |
| `B-HOME-VS-HALL` | Guests ≤ 25 vs > 25 | Suggests home setup vs hall; adjusts venue share. |
| `B-SURPRISE` | Surprise = yes | Adds coordination tasks (decoy plan, guest arrival window, confidentiality). |

**Community**
| Rule | Trigger | Effect |
|------|---------|--------|
| `C-PERMISSIONS` | Always | Adds permissions checklist (venue approval, noise limits, local authority intimation). |
| `C-NOC` | Expected crowd above 500 or public event | Adds police NOC and fire safety tasks. |
| `C-SAFETY-TIER` | Crowd tiers: <100, 100 to 500, 500+ | Scales first aid, exits, crowd control, volunteers. |
| `C-SPONSOR` | Sponsorship target provided | Shows funding gap (budget minus sponsorship) and a sponsor outreach task list. |
| `C-VOLUNTEERS` | Always | Generates volunteer roles scaled to crowd size. |

**Generic**
| Rule | Trigger | Effect |
|------|---------|--------|
| `G-DEFAULT` | Always | Uses default allocation and a standard milestone ladder (12, 8, 4, 2, 1 weeks, day-of). Allocation is the fixed default split (see 9.3). |

### 7.7 Timeline logic (`timelineService`)

1. `weeksToEvent = ceil((eventDate - today) / 7 days)`.
2. Each milestone due date = `eventDate - weeksBefore × 7 days`.
3. Milestones whose due date is already in the past collapse into a single **"Do now"** group dated today, and `S-URGENT` is flagged.
4. Duplicate-date milestones are merged.
5. Output is sorted ascending by date and includes a `weeksLeft` field for display.

### 7.8 Risk radar

Risks come from fired rules, each carrying `{ id, title, severity (1-3), mitigation }`. The top 3 by severity (ties broken by rule order) are shown.

---

## 8. Plan Data Model

Zod schemas live in `src/schemas/`; the same schema validates both server output and Gemini output.

```js
Plan = {
  id: string,
  mode: 'ai' | 'offline',
  request: NormalizedRequest,
  summary: string,
  budget: {
    total: number,
    perGuest: number,
    health: { level: 'comfortable'|'tight'|'unrealistic', reason: string },
    categories: [{ id, label, percent, amount, rationale, tips: string[] }]
  },
  timeline: [{ id, label, dueDate: 'YYYY-MM-DD', weeksLeft: number, urgent: boolean, tasks: [{ title, detail }] }],
  vendors: [{ categoryId, label, bookByDate, priority: 'immediate'|'normal',
              checklist: string[], questions: string[], redFlags: string[] }],
  ideas: { themes: string[], activities: string[], menu: string[], decor: string[], extras: string[] },
  warnings: string[],
  risks: [{ id, title, severity, mitigation }],
  firedRules: [{ id, description, effect }]
}
```

---

## 9. GenAI Integration

### 9.1 Division of responsibility

| Component | Owns |
|-----------|------|
| Decision engine + services (code) | All numbers, dates, allocations, which rules fire, which tasks/vendors exist |
| Gemini | Natural-language content: rationale, tips, task details, vendor questions/red flags, ideas, refine-instruction parsing |

### 9.2 Gemini calls

Three independent calls run in parallel via `Promise.all`:

1. **Budget notes + ideas** (rationale and tips per category, personalized ideas)
2. **Timeline details** (task descriptions per milestone)
3. **Vendor guidance** (questions and red flags per vendor category)

Each call uses structured JSON output (response schema) and receives the engine output as **fixed constraints** in the prompt. Model name comes from `GEMINI_MODEL` env var (verify the current recommended model before submission). Timeout per call: 15 s. Retry: up to 2 with exponential backoff.

### 9.3 Generic profile (no AI-chosen categories)

The decision engine runs **before** Gemini, so allocations cannot depend on a Gemini suggestion without making generation sequential. For "Other" events the engine therefore uses the fixed default split and default vendor categories. Gemini only adds rationale, tips, tasks, and ideas, tailored to the event name the user typed, inside the same three parallel calls. **Gemini output is never used as budget numbers or category weights.** (Stretch option, not in v1: an optional pre-step call that proposes categories, validated and normalized in code before the engine runs.)

### 9.4 Prompt-injection guard

- All user-supplied text (notes, theme, city, event name, refine instruction) is sanitized (control characters stripped, length capped) and wrapped in clearly delimited blocks.
- The system prompt states that content inside those blocks is **data, not instructions**, and must be ignored if it tries to change behavior.
- Output must match the zod schema; anything else is discarded and triggers fallback.
- Model output is never executed, never inserted as HTML, never used to build file paths or queries.

### 9.5 Refine flow

1. Client sends `{ planId or plan, instruction }` (plan is re-validated as untrusted input).
2. Gemini converts the instruction into a **constrained patch** (validated by zod), e.g. `{ budget?, guests?, addFunctions?, removeCategories?, ideaFocus?, tone? }`.
3. The decision engine re-runs with the patched request; budget and dates are recomputed deterministically.
4. Content is regenerated for changed sections only.
5. In offline mode, refine returns a clear message that it needs the AI service; what-if still works.

This keeps edits logical and numerically correct, since the LLM never edits numbers directly.

### 9.6 Offline fallback

Built from profile templates: allocations and amounts from the engine, timeline and vendor lists from the profile, generic tips and ideas from template strings. Flagged `mode: "offline"`. The app must work end to end with **no API key set**, so evaluators can run it immediately.

### 9.7 Cache key

Key = SHA-256 of the canonical JSON of: the **normalized, validated request** (strings trimmed and whitespace-collapsed, event name and city lowercased, optional fields defaulted, keys sorted, date as ISO), plus today's UTC date (because `weeksToEvent` depends on it), the profile version, the prompt version, and `GEMINI_MODEL`. Request ids and timestamps are never part of the key. Only `mode: "ai"` plans are cached; offline plans and refine results are not.

---

## 10. API Specification

| Method | Path | Purpose | LLM? |
|--------|------|---------|------|
| POST | `/api/plan` | Generate a plan | Yes (with fallback) |
| POST | `/api/plan/whatif` | Recompute numbers for changed guests/budget | No |
| POST | `/api/plan/refine` | Apply a natural-language change | Yes |
| POST | `/api/export/ics` | Return `.ics` for timeline | No |
| GET | `/health` | Liveness check | No |

**Error shape (all errors):**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Guest count must be between 1 and 5000", "details": [], "requestId": "..." } }
```
Codes: `VALIDATION_ERROR`, `RATE_LIMITED`, `UPSTREAM_UNAVAILABLE`, `NOT_FOUND`, `INTERNAL_ERROR`. Stack traces are never returned to the client.

**Rate limits (assumption, configurable):** 60 requests/min/IP on general API; 10/min/IP on `/api/plan` and `/api/plan/refine`.

---

## 11. Architecture and File Structure

```
/
├── src/
│   ├── config/         env.js (zod-validated), constants.js
│   ├── profiles/       wedding.js, birthday.js, community.js, generic.js, index.js
│   ├── services/       decisionEngine.js, budgetService.js, timelineService.js,
│   │                   planService.js, geminiService.js, refineService.js
│   ├── prompts/        budgetIdeasPrompt.js, timelinePrompt.js, vendorPrompt.js, refinePrompt.js
│   ├── schemas/        requestSchema.js, planSchema.js, refineSchema.js
│   ├── controllers/    planController.js, refineController.js, exportController.js
│   ├── routes/         index.js
│   ├── middleware/     validate.js, errorHandler.js, rateLimiter.js, requestId.js
│   ├── utils/          logger.js, ics.js, cache.js, sanitize.js
│   ├── app.js          Express app assembly (no listen)
│   └── server.js       Starts server, graceful shutdown
├── public/
│   ├── index.html
│   ├── css/styles.css  (includes print + reduced-motion styles)
│   └── js/             api.js, state.js, ui.js, checklist.js, whatif.js
├── tests/              unit/, integration/
├── .env.example
├── .gitignore
├── .eslintrc.json, .prettierrc
├── Dockerfile
├── package.json
└── README.md
```

**Tech stack:** Node.js 20, Express, `@google/genai`, zod, helmet, express-rate-limit, pino, compression, ESLint, Prettier, `node:test`. Vanilla ES-module frontend, no build step.

**Design patterns:** Strategy/registry (profiles), pure-function rules, dependency injection for `geminiService` (so tests can mock it), centralized error handling.

---

## 12. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| Performance | What-if response under 100 ms. Plan generation target under 10 s with Gemini; under 500 ms offline. |
| Reliability | Graceful degradation to offline mode. `/health` endpoint. Graceful shutdown on SIGTERM. |
| Security | See Section 2.2 |
| Accessibility | See Section 2.2 |
| Maintainability | See Section 2.2 |
| Portability | Runs with `npm install && npm start`; Dockerfile for Cloud Run; all config via env vars. |
| Privacy | No persistence of user data server-side. Logs exclude request bodies. Checklist state stays in the browser. |

**Environment variables (`.env.example`):** `PORT`, `NODE_ENV`, `GEMINI_API_KEY` (optional, enables AI mode), `GEMINI_MODEL`, `CACHE_TTL_SECONDS`, `CACHE_MAX_ENTRIES`, `RATE_LIMIT_PER_MIN`, `LOG_LEVEL`.

---

## 13. Frontend and UX Specification

- Single page with intake form on top (or left on wide screens) and results below (or right).
- Event type selector drives dynamic fields.
- Results as stacked sections (Budget, Timeline, Vendors, Ideas), each a `<section>` with its own heading, plus a jump-link `<nav>` of anchor links and a summary bar with health meter and warnings. Chosen over tabs for simpler, fully accessible keyboard behaviour and a cleaner print layout.
- "Why this plan?" as an expandable section listing fired rules.
- What-if: two numeric controls (guests, budget) with debounced updates.
- Refine: single text input with submit button and clear loading/error states.
- Export bar: Download `.ics`, Print, per-milestone "Add to Google Calendar" link.
- Loading state announced via `aria-live="polite"`; errors via `role="alert"`.
- Clean visual design using system fonts, a restrained palette meeting AA contrast, and responsive layout from 360 px up.

---

## 14. README Requirements (Required by Rules)

The README **must** contain these sections **in this order**:

1. **Chosen Vertical**: General event planning assistant for weddings, birthdays, community events, and any other event via a profile-based engine. Persona: practical, budget-aware planner.
2. **Approach and Logic**: profiles and strategy pattern, decision engine and rule pipeline, why budget math is done in code, how Gemini is constrained, offline fallback, prompt-injection guard.
3. **How the Solution Works**: request flow diagram (text), module map, how to run, how to test.
4. **Assumptions Made**: budget bands, cost-level multipliers, base allocations, INR currency, season definitions, rate limits, no persistence.

Then: setup and env vars, API reference, security notes, accessibility notes, testing notes, and **four sample scenarios** (wedding, birthday, community, other) showing how plans change with inputs, including one pair at two different budgets.

---

## 15. Build Plan and Priorities

### 15.1 Build order (time-boxed; each step is a commit on `main`)

| Step | Work | Tier served |
|------|------|-------------|
| 1 | Repo init: `.gitignore`, `package.json`, ESLint/Prettier, `.env.example`, folder skeleton | R1, R2, Code Quality |
| 2 | `config/`, `schemas/`, constants | Code Quality, Security |
| 3 | `profiles/` (wedding first, then birthday, community, generic) | Alignment |
| 4 | `budgetService`, `timelineService`, `decisionEngine` + unit tests | Alignment, Code Quality, Testing |
| 5 | Offline plan assembly (`planService` without Gemini) | Alignment, reliability |
| 6 | Express app, middleware, routes, controllers, error handler | Code Quality, Security |
| 7 | Frontend: form, results, why-panel, health meter, risk radar | Alignment, Accessibility |
| 8 | `geminiService` + prompts + parallel calls + cache + fallback | Efficiency, Security |
| 9 | What-if, refine, `.ics`, print | Alignment |
| 10 | Remaining tests, accessibility pass, README, Dockerfile | Testing, Accessibility, R4 |
| 11 | Final verification (Section 16) | R1 to R6 |

### 15.2 Cut order if time is short
Cut in this order: refine chat, `.ics` export, print stylesheet, Dockerfile, extra tests. **Never cut:** decision engine, four plan outputs, "Why this plan?" panel, README, validation, offline fallback.

---

## 16. Pre-Submission Checklist (run before every submission)

**Rules**
- [ ] `git branch -a` shows only `main`
- [ ] Repo size under 10 MB (`du -sh .git` and working tree excluding ignored files)
- [ ] No secrets in files or history (`git log -p | grep -i "api"` style scan); key rotated if ever committed
- [ ] README has the four required sections in order

**Clean-clone test**
- [ ] `git clone` into a fresh folder
- [ ] `npm install` succeeds
- [ ] `npm run lint` exits 0
- [ ] `npm test` passes with no API key and no network
- [ ] `npm start` works with no API key (offline mode) and with a key (AI mode)

**Quality gates (by tier)**
- [ ] HIGH: controllers thin, no event-type branches in services, no magic numbers, JSDoc present, all four outputs in every plan, "Why this plan?" visible, plans visibly differ across inputs
- [ ] MEDIUM: every route validated, CSP set, rate limit active, injection guard in prompts, `textContent` used for model output, cache works, Gemini calls parallel
- [ ] LOW: tests cover engine/budget/timeline/schemas/ICS and API with mock, keyboard-only walkthrough passes, aria-live announces results, contrast checked

---

## 17. Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-1 | Submitting a valid wedding, birthday, community, and "other" request each returns a plan containing budget, timeline, vendors, and ideas. |
| AC-2 | For every profile and every rule combination, the sum of category amounts equals the budget exactly. |
| AC-3 | Same event at two budgets (e.g. INR 5L and INR 15L, 100 guests) produces different health ratings, allocations, and warnings. |
| AC-4 | An event under 4 weeks away produces a compressed timeline and urgent vendor flags. |
| AC-5 | A child's birthday plan includes supervisor ratio and allergy tasks; an adult's does not. |
| AC-6 | A community event above the crowd threshold includes NOC and safety tasks. |
| AC-7 | With no API key or with Gemini failing, the app returns an offline plan with a visible banner. |
| AC-8 | Invalid input (negative budget, past date, oversized string, script tags) is rejected with a clear error and never reaches Gemini. |
| AC-9 | Prompt-injection text in notes does not change plan structure or leak instructions. |
| AC-10 | What-if updates numbers without a network call to Gemini. |
| AC-11 | The full flow is operable by keyboard only, and results are announced to screen readers. |
| AC-12 | `npm test` and `npm run lint` pass from a fresh clone, offline. |

---

## 18. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Rule violation (extra branch, large repo) | Submission not evaluated | Section 16 checklist before each submission |
| Gemini returns malformed JSON | Broken plan | Response schema + zod validation + retry + offline fallback |
| Gemini unavailable or no key during evaluation | Evaluator sees errors | Offline mode works end to end |
| Scope creep eats time from High-tier work | Lower score | Fixed build order and cut order (Section 15) |
| Model name or SDK changes | Runtime failure | Model in env var; verify before submission; fallback path |
| Prompt injection via free-text fields | Security score | Delimiting, sanitization, schema-validated output |
| AI grader misses the decision logic | Alignment score | Named files, README "Approach and Logic", visible "Why this plan?" panel |
| Budget numbers wrong | Credibility | Math in code, invariant tests |

---

## 19. Assumptions (also restated in the README)

1. Currency is INR; amounts are whole rupees.
2. Base allocations, per-guest bands, and cost-level multipliers are reasonable planning defaults, not market data, and are configurable.
3. Monsoon months are June to September; wedding peak season is October to February (India).
4. Guest-to-supervisor ratio of 1:8 for children's parties is a planning guideline.
5. No vendor data is live; vendor categories and questions are guidance only.
6. No user data is stored server-side; checklist state lives in the browser.
7. The app serves one user at a time per browser session; no accounts.

---

## 20. Appendix: Sample Scenarios (to include in README)

| # | Input | Expected behaviour |
|---|-------|--------------------|
| 1 | Wedding, 150 guests, INR 5,00,000, 45 days away, Chennai, cost level high, vegetarian | Per guest INR 3,333, adjusted ≈ 2,564: Tight. Catering protected, decor trimmed, short-notice rule fires, venue/photographer/caterer flagged "book immediately", dietary tasks added. |
| 2 | Same wedding at INR 15,00,000, 150 days away | Comfortable. Standard allocation, full timeline, no urgency flags. |
| 3 | Birthday, age 7, 20 guests, INR 20,000, home | Child allocation, 1:8 supervision (3 adults), allergy checks, home setup, short run-of-show. |
| 4 | Community festival, 800 expected, INR 3,00,000, sponsorship target INR 1,00,000, outdoor in July | NOC and safety tier 3 tasks, volunteer roles scaled, funding gap shown, monsoon backup-venue risk. |
| 5 | Other: "Corporate offsite", 40 guests, INR 1,20,000, 3 weeks away | Generic profile, urgent compression, default generic split, Gemini adds ideas and tasks tailored to the event name. |
