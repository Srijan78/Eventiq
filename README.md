# Eventiq: GenAI-Powered Event Planning Assistant

Live demo: https://eventiq-inky.vercel.app

A context-aware, practical event planning assistant for weddings, birthdays, community gatherings, and custom events. Eventiq combines a deterministic decision engine with generative AI (Google Gemini) to deliver complete, mathematically sound event plans featuring dynamic budget allocations, milestone timelines, actionable vendor checklists, and personalized event concepts.

---

## 1. Chosen Vertical

**Vertical:** General Event Planning Assistant  
**Coverage:**

- Rich dedicated profiles: Weddings, Birthdays, Community Events
- Dynamic generic profile: Any custom event type (e.g., corporate offsite, baby shower, anniversary, reunion)

**Target Persona:** _"The Practical Organizer"_  
A first-time or occasional event organizer (family member, friend, volunteer, or community lead) operating with a fixed budget and a firm deadline. The organizer needs clear next steps, transparent budget breakdowns, vendor red flags, and honest warnings without hallucinated costs or unfeasible schedules.

---

## 2. Approach and Logic

### 2.1 Profiles and Strategy Pattern

- Event-specific logic is encapsulated in declarative profile modules (`wedding.js`, `birthday.js`, `community.js`, `generic.js`).
- Services and the decision engine **never branch on event type** (`if (eventType === ...)` is eliminated). Instead, they consume the profile contract via `getProfile(type)`.
- Adding a new event type requires authoring only a single profile specification.

### 2.2 Decision Engine and Pure Rule Pipeline

- The decision engine (`src/services/decisionEngine.js`) executes deterministically before any AI call.
- All rules are implemented as pure, side-effect-free functions evaluated in a fixed sequence: profile-specific rules followed by universal shared rules (`S-HEALTH`, `S-CONTINGENCY`, `S-URGENT`, `S-VERY-URGENT`, `S-LARGE`, `S-SMALL`, `S-OUTDOOR-SEASON`).
- Rules produce percentage point shifts (netting to zero), warnings, priority flags, extra tasks, and risk assessments.
- The "Why this plan?" panel surfaces all fired rules and their exact effects directly to the user.

### 2.3 Why Budget Math is Done in Code

- LLMs frequently hallucinate mathematical calculations, fail to guarantee exact sums, and struggle with strict rounding invariants.
- In Eventiq, **Gemini never generates or alters budget amounts**.
- Rupee amounts are computed via `Math.floor(budget * pct / 100)` in `budgetService.js`.
- Any rounding remainder is automatically allocated to the **contingency reserve** (which enforces a strict 5% floor).
- Invariant guaranteed and tested: `sum(categoryAmounts) === totalBudget` across all profiles, rules, and budget ranges.

### 2.4 How Gemini is Constrained

- Gemini provides natural language rationale, actionable tips, specific milestone task details, vendor interview questions, and creative themes/ideas.
- All Gemini calls use structured JSON output with strict Zod schema validation. If the model returns malformed JSON or schema-incompatible output, it is safely rejected.
- Three targeted calls run in parallel via `Promise.all` for optimal efficiency:
  1. Category rationale, tips, and creative ideas
  2. Milestone task descriptions
  3. Vendor guidance, checklist questions, and red flags

### 2.5 Offline Fallback & Resilience

- If no `GEMINI_API_KEY` is configured, or if the upstream API times out (15s limit) or fails after exponential backoff retries, Eventiq immediately falls back to high-quality deterministic profile templates.
- The response returns `mode: "offline"` and displays a clear notification banner in the UI.
- The application is 100% functional out-of-the-box without network connectivity or API credentials.

### 2.6 Prompt-Injection Guard

- User input fields (notes, theme, city, event name) undergo strict sanitization (stripping control characters, capping lengths).
- Content injected into Gemini prompts is enclosed in explicit delimiters (`<<<USER_DATA>>>...<<<END_USER_DATA>>>`).
- System prompts instruct the model to treat all delimited content strictly as plain text data, never as instructions.
- All model output is rendered in the frontend via `textContent`, completely preventing XSS (`innerHTML` is strictly forbidden).

---

## 3. How the Solution Works

### 3.1 Request Flow Diagram

```
User Input (Form Submission / Local Restore)
   │
   ▼
Client-Side Validation & Sanitization
   │
   ▼ POST /api/plan
Server Middleware: Helmet (CSP) + Rate Limiter + Body Size Cap (20KB) + Zod Request Validation
   │
   ▼
planController.create
   │
   ▼
decisionEngine.runEngine(validatedRequest)
   ├── Profile Selection: getProfile(eventType)
   ├── Context Evaluation: weeksToEvent, perGuest, costLevel, season
   ├── Rule Execution: Profile Rules + Shared Rules (pure functions)
   ├── Budget Math: budgetService.reconcile (Invariant: sum === budget, contingency >= 5%)
   └── Timeline Calculation: timelineService.buildTimeline (date math & past-due collapsing)
   │
   ▼
planService.generatePlan
   ├── Cache Lookup (SHA-256 of Canonical Request + Date + Model + Profile/Prompt Versions)
   │     ├── Cache HIT ──► Return Cached Plan
   │     └── Cache MISS
   ├── Check GEMINI_API_KEY Available?
   │     ├── YES ──► Promise.all([3 Structured Gemini Calls])
   │     │             ├── Success ──► Validate Zod ──► Merge with Engine ──► Cache ──► Return
   │     │             └── Failure/Timeout ──► Fallback to Offline Templates
   │     └── NO  ──► Assemble Offline Deterministic Plan
   │
   ▼
Response JSON (Plan Object)
   │
   ▼
Frontend Render (Vanilla ES Modules)
   ├── Jump-Link Navigation (Sticky Anchors)
   ├── Summary Bar (Health Meter with Text Label + Reason, Warnings, Offline Banner)
   ├── Stacked Sections: #budget, #timeline, #vendors, #ideas
   ├── "Why this plan?" Accordion & Risk Radar
   └── LocalStorage Save (Request + Plan + Checklist State)
```

### 3.2 Module Map

```
/
├── .github/
│   └── workflows/ci.yml  # Automated GitHub Actions CI pipeline (Node 20, lint, format, test:coverage)
├── src/
│   ├── config/           # env.js (Zod-validated), constants.js (frozen parameters)
│   ├── profiles/         # Modular strategy folders: wedding/, birthday/, community/, generic/, index.js
│   │   ├── wedding/      # allocation.js, milestones.js, vendors.js, rules.js, templates.js, index.js
│   │   ├── birthday/     # allocation.js, milestones.js, vendors.js, rules.js, templates.js, index.js
│   │   ├── community/    # allocation.js, milestones.js, vendors.js, rules.js, templates.js, index.js
│   │   └── generic/      # allocation.js, milestones.js, vendors.js, rules.js, templates.js, index.js
│   ├── rules/            # sharedRules.js (universal pure business logic rules)
│   ├── services/         # Core business services
│   │   ├── engine/       # contextBuilder.js, ruleRunner.js, allocationApplier.js, outputAssembler.js
│   │   ├── decisionEngine.js # Pipeline orchestrator (under 40 lines)
│   │   ├── budgetService.js, timelineService.js, planService.js, geminiService.js
│   ├── prompts/          # budgetIdeasPrompt.js, timelinePrompt.js, vendorPrompt.js
│   ├── schemas/          # requestSchema.js, planSchema.js, index.js (Zod validation)
│   ├── controllers/      # planController.js, whatifController.js, exportController.js
│   ├── routes/           # index.js (Express route definitions)
│   ├── middleware/       # validate.js, errorHandler.js, rateLimiter.js, requestId.js
│   ├── utils/            # AppError.js, logger.js (Pino), ics.js, cache.js (LRU), sanitize.js
│   ├── app.js            # Express app assembly, security configuration, serverless root fallback
│   ├── server.js         # HTTP server boot & graceful shutdown handlers
│   └── types.js          # Central JSDoc domain type definitions
├── public/
│   ├── index.html        # Accessible semantic HTML5 layout
│   ├── css/              # Modular stylesheets: base.css, layout.css, components.css, print.css
│   └── js/               # Modular vanilla client
│       ├── shared/       # limits.js (single shared source of truth for limits and enums)
│       ├── form.js       # Form facade orchestrator
│       ├── formBuilder.js, formProfileFields.js, formValidation.js
│       ├── budgetView.js, timelineView.js, vendorsView.js, ideasView.js
│       └── api.js, app.js, checklist.js, domUtils.js, state.js, ui.js, whatif.js
├── tests/
│   ├── helpers/          # request.js (fixtures and request factory helpers)
│   ├── unit/             # Unit tests (budget, timeline, engine, schemas, cache, sanitize, profiles, rules)
│   └── integration/      # Offline integration tests (API endpoints with mocked Gemini)
├── .editorconfig         # Universal editor whitespace and line-ending rules
├── .env.example          # Reference environment variables
├── .gitattributes        # Git line-ending normalization (LF)
├── .gitignore            # Clean git exclusion rules
├── .prettierrc           # Prettier configuration (LF, 2 spaces, singleQuote)
├── Dockerfile            # Multi-stage unprivileged Alpine container
├── eslint.config.js      # Strict ESLint flat config (complexity <= 10, max lines <= 40, max file lines <= 300)
├── jsconfig.json         # Static type checking configuration (ES2024)
├── LICENSE               # MIT open-source license
├── package.json          # Dependencies, engines, and npm scripts
├── PRD.md                # System specification & requirements
└── README.md             # Master documentation
```

### 3.3 How to Run

```bash
# 1. Clone repository and install dependencies
git clone <repo-url>
cd Eventiq
npm install

# 2. Configure environment (Optional for AI mode, runs offline without key)
cp .env.example .env
# Edit .env to add GEMINI_API_KEY if desired

# 3. Start the server
npm start

# 4. Open in browser
# http://localhost:3000
```

### 3.4 How to Test

```bash
# Run all unit and integration tests (passes 100% offline, zero API keys required)
npm test

# Run linter
npm run lint
```

---

## 4. Assumptions Made

1. **Currency & Precision:** All monetary figures are in Indian Rupees (INR) represented as whole integers.
2. **Cost Level Multiplier:** User selects regional cost level (`low` = 0.8x, `average` = 1.0x, `high` = 1.3x). This scales effective per-guest budget thresholds deterministically without brittle city lookups. The city field is used strictly for localized context in AI prompts.
3. **Per-Guest Budget Bands (at average cost level):**
   - _Wedding:_ Comfortable >= ₹3,000 | Tight >= ₹1,500 | Unrealistic < ₹1,500
   - _Birthday:_ Comfortable >= ₹800 | Tight >= ₹400 | Unrealistic < ₹400
   - _Community:_ Comfortable >= ₹300 | Tight >= ₹150 | Unrealistic < ₹150
   - _Generic:_ Comfortable >= ₹1,000 | Tight >= ₹500 | Unrealistic < ₹500
4. **Base Budget Allocations:** Configurable percentages per profile summing to 100% with a non-negotiable 5% contingency floor.
5. **Seasons & Timelines:**
   - Monsoon season: June through September (triggers outdoor rain contingencies).
   - Wedding peak season: October through February (triggers vendor urgency warnings).
   - Urgency windows: < 4 weeks triggers immediate booking rules; < 1 week collapses to last-minute checklists.
6. **Rate Limits & Sizing:** 60 requests/minute per IP general; 10 requests/minute per IP for generative endpoints. Request body capped at 20 KB.
7. **Privacy & Storage:** Zero server-side persistence. Plan restoration and tickable vendor checklist progress persist strictly in the user's browser via `localStorage` (FR-36).
8. **Refine Scope:** Natural-language refine is not implemented (what-if scenario recalculation is provided deterministically).

---

## 5. Setup & Environment Variables

| Variable             | Type   | Default                 | Purpose                                                         |
| -------------------- | ------ | ----------------------- | --------------------------------------------------------------- |
| `PORT`               | Number | `3000`                  | HTTP port for the web server                                    |
| `NODE_ENV`           | String | `development`           | Node runtime environment                                        |
| `GEMINI_API_KEY`     | String | `""`                    | Optional Google Gemini API key. If absent, offline mode is used |
| `GEMINI_MODEL`       | String | `gemini-3.5-flash-lite` | Gemini model name                                               |
| `CACHE_TTL_SECONDS`  | Number | `3600`                  | In-memory plan cache TTL (1 hour)                               |
| `CACHE_MAX_ENTRIES`  | Number | `100`                   | Maximum cached plans in LRU cache                               |
| `RATE_LIMIT_PER_MIN` | Number | `60`                    | Max API requests per IP per minute                              |
| `TRUST_PROXY`        | Number | `0`                     | Express trust proxy hop count for reverse proxies               |
| `LOG_LEVEL`          | String | `info`                  | Pino logging level (`fatal`, `error`, `warn`, `info`, `debug`)  |

### 5.2 Host-Agnostic Deployment

Eventiq is strictly host-agnostic and runtime-neutral:

- **Runtime Requirements:** Requires Node.js >= 20.0.0.
- **Environment Variables:** Configured via `PORT`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `TRUST_PROXY`, and `NODE_ENV`.
- **Container Ready:** The included multi-stage `Dockerfile` (Alpine Linux) executes as an unprivileged non-root `node` user and dynamically binds to the environment `PORT`.
- **Serverless Ready:** The architecture cleanly isolates Express app assembly in `src/app.js` (no `app.listen()`) while `src/server.js` manages process lifecycle, enabling execution behind standard container runners or serverless adapters.
- **Serverless Caveat:** _If deployed serverless, the in-memory cache and rate limiter are per instance and best-effort; shared state across instances would need an external store such as Redis._

---

## 6. API Reference

### `POST /api/plan`

Generates a complete event plan.

- **Request Body:** JSON conforming to `requestSchema` (`eventType`, `eventDate`, `guests`, `budget`, `city`, `costLevel`, `theme`, `notes`, profile-specific fields).
- **Response (200):** Full `Plan` object including `budget`, `timeline`, `vendors`, `ideas`, `warnings`, `risks`, `firedRules`, and `mode` (`ai` or `offline`).

### `POST /api/plan/whatif`

Recalculates budget, health, and rules deterministically without calling LLM.

- **Request Body:** `{ ...originalRequest, guests?: number, budget?: number }`
- **Response (200):** Updated budget allocations, health rating, warnings, risks, and fired rules.

### `POST /api/export/ics`

Exports timeline milestones as an iCalendar (`.ics`) file.

- **Request Body:** `{ eventName: string, timeline: TimelineMilestone[] }`
- **Response (200):** Downloadable `.ics` calendar file attachment.

### `GET /health`

Liveness probe.

- **Response (200):** `{ "status": "ok", "uptime": number, "timestamp": string }`

---

## 7. Security Notes

- **Input Validation:** Every incoming payload is validated against strict Zod schemas with bounded string lengths and numeric ranges.
- **AI Output Sanitization:** LLM JSON output is strictly validated against `planSchema` before being processed. Unexpected shapes trigger safe offline fallback.
- **HTTP Hardening:** `helmet` sets strict Content Security Policy (`default-src 'self'`), disables X-Powered-By, and enforces HSTS.
- **Prompt Injection Defense:** Strict separation of system instructions and user parameters using delimiters and prompt guards.
- **Safe DOM Rendering:** Client uses `textContent` and native element construction exclusively. Zero usage of `innerHTML`.
- **Zero Secrets Leakage:** API keys are injected via environment variables and never logged or serialized to the client.

---

## 8. Accessibility Notes

- **Landmarks & Structure:** Logical semantic layout (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`) with a single `<h1>` and hierarchical headings.
- **Stacked Layout:** Replaced tab panels with continuous stacked `<section>` blocks linked by a sticky jump-link `<nav>`. This guarantees native keyboard tab flow, zero focus trap vulnerabilities, and seamless printing.
- **Form Association:** Every input, select, and textarea has an explicitly associated `<label>`. Errors are tied using `aria-describedby` and flagged with `aria-invalid="true"`.
- **Screen Reader Announcements:** Dynamic state changes (loading, plan generated) use `aria-live="polite"`. Error notifications trigger `role="alert"`. Focus is programmatically shifted to the plan heading upon generation.
- **Visual Contrast & Independence:** WCAG 2.1 AA compliant palette (minimum 4.5:1 text contrast). The budget health meter pairs color indicators with descriptive text and explanations.
- **Responsive & Motion:** Fully operable at 360px viewport width and 200% zoom without horizontal clipping. `prefers-reduced-motion` media queries disable non-essential animations.

---

## 9. Testing Notes

- Eventiq uses the native Node.js test runner (`node:test`) executing **80 automated tests** in **~1.2 seconds** with **95.6% line coverage**.
- Tests run **100% offline**, requiring zero external network calls and zero mock libraries or runtime dependencies.
- **Seeded Property Invariant Testing (`tests/unit/propertyBudget.test.js`):** 550 seeded pseudo-random test cases across all four profiles proving mathematical invariants: `sum(categoryAmounts) === totalBudget` strictly holds, zero negative allocations, and contingency reserve floor is always >= 5%.
- **Table-Driven Boundary Tests (`tests/unit/ruleContracts.test.js`):** Boundary tests for every shared and profile rule (guests 29/30/400/401, exactly 4 weeks, exactly 1 week, monsoon month boundaries, child age 12/13), verifying that all allocation shifts net strictly to zero.
- **Timeline Date Math Tests (`tests/unit/timelineMath.test.js`):** Injected clock verification covering same-day events, 1 day away, 3 years away, and past dates, with chronological sorting and zero duplicate dates.
- **Mocked Resilience & Budget Immutability (`tests/unit/geminiMock.test.js`):** Fake client testing covering Gemini success, malformed JSON, schema violation fallback, timeout, exponential retry, offline mode exclusion from cache, and ensuring AI output never overrides code-calculated budget numbers.
- **Prompt Injection Defense (`tests/unit/securityInjection.test.js`):** Verifies delimiter escaping, control character stripping, and length truncation bounds.
- **Cache Lifecycle (`tests/unit/cacheAdvanced.test.js`):** Verifies TTL expiration (50ms), LRU capacity eviction, and property-order key invariance.
- **Environment & Rate Limiting (`tests/unit/configEnv.test.js` & `tests/integration/api.test.js`):** Verifies Zod parsing branches, stricter rate limiting on `/api/plan` (limit 10) vs other routes (limit 60), static fallback, and 413 `PAYLOAD_TOO_LARGE` with `requestId`.

```bash
# Run all unit and integration tests
npm test

# Run tests with native experimental code coverage report
npm run test:coverage
```

---

---

## 9.1 Code Quality & Architecture Standards

Eventiq enforces strict production code standards validated automatically in CI:

- **Cyclomatic Complexity:** Every function across the server and client is restricted to a maximum cyclomatic complexity of **10** and a maximum length of **40 statements/lines** (enforced via permanent ESLint rules).
- **Single Source of Truth:** Data boundaries, string length caps, guest count limits, budget bounds, and event enums are defined once in `public/js/shared/limits.js` and imported by both backend schemas and frontend input validators.
- **Robust Error Handling:** Centralized through `AppError` (`message`, `status`, `code`, `details`). Swallowed errors and empty catch blocks are strictly prohibited.
- **Static Type Layer:** Comprehensive domain type definitions in `src/types.js` with JSDoc annotations and `jsconfig.json` verification (`tsc`).
- **Modular Presentation:** CSS is partitioned into decoupled layers (`base.css`, `layout.css`, `components.css`, `print.css`) without `@import` overhead, respecting strict Content Security Policy.
- **Automated CI:** GitHub Actions executes dependency verification, linter checks, Prettier formatting validation, and native test suites on every push and PR.

## 10. Sample Scenarios

### Scenario 1: Wedding with Tight Budget & Short Notice

- **Input:** Wedding, 150 guests, ₹5,00,000, 45 days away, Chennai, cost level `high`, vegetarian
- **Behavior:** Per guest ₹3,333 adjusted by high cost multiplier (1.3x) yields ~₹2,564 (Tight). Rule `S-HEALTH` protects catering (+4%) and trims decor (-4%). `W-SHORT-NOTICE` compresses timeline and flags venue/caterer/photographer "book immediately". `W-DIETARY` injects vegetarian tasting and caterer checklists.

### Scenario 2: Comfortable Wedding with Long Horizon

- **Input:** Wedding, 150 guests, ₹15,00,000, 150 days away, Jaipur, cost level `average`
- **Behavior:** Per guest ₹10,000 (Comfortable). Standard balanced allocations. Full 12-milestone timeline with no urgency flags. Full creative vendor questions and premium themes.

### Scenario 3: Child's 7th Birthday Party at Home

- **Input:** Birthday, Age 7, 20 guests, ₹20,000, 30 days away, Pune, cost level `average`, home setup
- **Behavior:** `B-CHILD` triggers child allocation variant (higher cake, entertainment, gifts). Adds 1:8 adult supervision requirement (3 adults required), allergy checks, short run-of-show timeline, and child-safe entertainment ideas.

### Scenario 4: Large Outdoor Community Festival in Monsoon

- **Input:** Community Festival, 800 expected, ₹3,00,000, ₹1,00,000 sponsorship target, July date (Monsoon), outdoor
- **Behavior:** `C-NOC` and `C-SAFETY-TIER` trigger police NOC, fire safety, and emergency exit tasks. `C-SPONSOR` highlights ₹2,00,000 funding gap and adds sponsor deliverables checklist. `S-OUTDOOR-SEASON` flags monsoon weather risk and adds backup venue contingency.

### Scenario 5: Corporate Offsite ("Other" Event Type)

- **Input:** Other: "Corporate offsite", 40 guests, ₹1,20,000, 3 weeks away, cost level `average`
- **Behavior:** Selects `generic` profile with fixed default split. `S-URGENT` triggers milestone compression into "Do now". Gemini produces corporate-specific team-building tasks, venue AV requirements, and professional agenda suggestions tailored to the event name.
