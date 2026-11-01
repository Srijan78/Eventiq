# Eventiq: GenAI-Powered Event Planning Assistant

[![CI](https://github.com/Srijan78/Eventiq/actions/workflows/ci.yml/badge.svg)](https://github.com/Srijan78/Eventiq/actions/workflows/ci.yml)
Live demo: https://eventiq-inky.vercel.app

Eventiq generates complete, mathematically sound event plans for weddings, birthdays, community gatherings, or any custom event, delivering deterministic budget allocations, milestone timelines, vendor checklists, and creative ideas.
A deterministic decision engine owns all numbers and rules; Gemini only writes content, schema-validated, with an offline fallback.
Built with Node 20 and 22, Express, Gemini via @google/genai, zod, and vanilla ES modules.

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

- Event-specific logic is encapsulated in declarative profile modules (`wedding/`, `birthday/`, `community/`, `generic/`).
- Services and the decision engine **never branch on event type** (`if (eventType === ...)` is eliminated). Instead, they consume the profile contract via `getProfile(type)`.
- Adding a new event type requires authoring only a single profile folder implementing the standard Profile contract.

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

The following module tree directly matches all repository files tracked in git (`git ls-files`):

```
/
├── .dockerignore
├── .editorconfig         # Universal editor whitespace and line-ending rules
├── .env.example          # Reference environment variables
├── .gitattributes        # Git line-ending normalization (LF)
├── .github/
│   └── workflows/ci.yml  # Automated GitHub Actions CI pipeline (Node 20 & 22 matrix, lint, format, test, coverage on 22)
├── .gitignore            # Git exclusion rules
├── .prettierrc           # Prettier configuration (LF, 2 spaces, singleQuote)
├── Dockerfile            # Multi-stage unprivileged Alpine container
├── LICENSE               # MIT open-source license
├── PRD.md                # System specification & requirements
├── README.md             # Master documentation
├── eslint.config.js      # Strict ESLint flat config (complexity <= 10, max lines <= 40, max file lines <= 300)
├── jsconfig.json         # Static type checking configuration (ES2024)
├── package-lock.json
├── package.json          # Dependencies, engines, and npm scripts
├── public/
│   ├── index.html        # Accessible semantic HTML5 layout
│   ├── css/              # Modular stylesheets (separate <link> tags, strict CSP)
│   │   ├── base.css      # CSS resets, variables, typography
│   │   ├── components.css# Buttons, forms, badges, cards, radar
│   │   ├── layout.css    # Header, container, grid, stacked sections
│   │   └── print.css     # Clean print stylesheet for hard copies
│   └── js/               # Modular vanilla client ES modules
│       ├── api.js        # Backend fetch client and error parser
│       ├── app.js        # Main frontend bootstrap & submit state management
│       ├── budgetView.js # Budget table & health visualization
│       ├── checklist.js  # Interactive vendor checklist state
│       ├── domUtils.js   # XSS-safe DOM helpers (textContent only)
│       ├── form.js       # Form facade orchestrator
│       ├── formBuilder.js# Dynamic form field generator
│       ├── formProfileFields.js # Profile-specific form definitions
│       ├── formValidation.js    # Client validation rules
│       ├── ideasView.js  # Creative concept and theme rendering
│       ├── shared/
│       │   └── limits.js # Single source of truth for limits and enums
│       ├── state.js      # LocalStorage persistence manager
│       ├── timelineView.js # Chronological milestone rendering
│       ├── ui.js         # Status banner and live region alerts
│       ├── vendorsView.js# Vendor recommendations and questions
│       └── whatif.js     # Instant deterministic slider recalculations
├── src/
│   ├── app.js            # Express app assembly, security configuration, static fallback
│   ├── server.js         # HTTP server boot & graceful shutdown handlers
│   ├── types.js          # Central JSDoc domain type definitions
│   ├── config/
│   │   ├── constants.js  # Frozen operational constants and limits
│   │   └── env.js        # Zod-validated environment configuration
│   ├── controllers/
│   │   ├── exportController.js  # ICS calendar export handler
│   │   ├── planController.js    # Plan creation handler
│   │   └── whatifController.js  # Deterministic scenario recalculation handler
│   ├── middleware/
│   │   ├── errorHandler.js      # Central AppError handler (PAYLOAD_TOO_LARGE, etc.)
│   │   ├── rateLimiter.js       # Tiered IP rate limiting (llmLimiter: 10, general: 60)
│   │   ├── requestId.js         # UUID request tracking before body parsing
│   │   └── validate.js          # Zod schema validation middleware
│   ├── profiles/         # Modular strategy folders by event vertical
│   │   ├── index.js      # Profile registry and getProfile lookup
│   │   ├── birthday/     # allocation.js, index.js, milestones.js, rules.js, templates.js, vendors.js
│   │   ├── community/    # allocation.js, index.js, milestones.js, rules.js, templates.js, vendors.js
│   │   ├── generic/      # allocation.js, index.js, milestones.js, rules.js, templates.js, vendors.js
│   │   └── wedding/      # allocation.js, index.js, milestones.js, rules.js, templates.js, vendors.js
│   ├── prompts/          # Structured Gemini prompt builders with injection protection
│   │   ├── budgetIdeasPrompt.js
│   │   ├── timelinePrompt.js
│   │   └── vendorPrompt.js
│   ├── routes/
│   │   └── index.js      # Central Express API route definitions
│   ├── rules/
│   │   └── sharedRules.js# Universal pure business logic rules (S-HEALTH, S-URGENT, etc.)
│   ├── schemas/          # Zod domain schemas
│   │   ├── index.js      # Schema re-exports
│   │   ├── planSchema.js # AI output validation schema
│   │   └── requestSchema.js # Input request validation schema
│   ├── services/
│   │   ├── budgetService.js    # Exact rupee math and contingency floor reconciliation
│   │   ├── decisionEngine.js   # Pipeline orchestrator
│   │   ├── engine/             # Decision engine decoupled modules
│   │   │   ├── allocationApplier.js
│   │   │   ├── contextBuilder.js
│   │   │   ├── outputAssembler.js
│   │   │   └── ruleRunner.js
│   │   ├── geminiService.js    # @google/genai client with retry, timeout & validation
│   │   ├── planService.js      # Parallel AI coordinator with cache & offline fallback
│   │   └── timelineService.js  # Date math, past-due milestone collapsing & deduplication
│   └── utils/
│       ├── AppError.js   # Standardized operational error class
│       ├── cache.js      # In-memory LRU cache with TTL and deterministic hashing
│       ├── ics.js        # iCalendar RFC 5545 generator
│       ├── logger.js     # Pino structured logger
│       └── sanitize.js   # Text sanitization, control character stripping, bounds capping
└── tests/
    ├── helpers/
    │   └── request.js    # Test fixtures and request helper factories
    ├── integration/
    │   └── api.test.js   # HTTP integration tests (live Express, mocked Gemini, security)
    └── unit/
        ├── budgetService.test.js     # Exact budget reconciliation tests
        ├── cache.test.js             # Basic cache operations
        ├── cacheAdvanced.test.js     # TTL expiration & LRU capacity eviction
        ├── configEnv.test.js         # Zod env parsing and error branches
        ├── decisionEngine.test.js    # Context building and rule execution
        ├── geminiMock.test.js        # Fake LLM error resilience & budget immutability
        ├── ics.test.js               # ICS formatting and sanitization
        ├── planService.test.js       # Offline plan generation
        ├── profiles.test.js          # Profile registry contracts
        ├── promptBuilders.test.js    # Delimiter and prompt construction
        ├── propertyBudget.test.js    # 550 seeded invariant runs across all profiles
        ├── ruleContracts.test.js     # Table-driven boundary tests (net zero shifts)
        ├── sanitize.test.js          # Control character stripping & truncation
        ├── schemas.test.js           # Request and plan Zod schema validation
        ├── securityInjection.test.js # Prompt injection defense verification
        ├── timelineMath.test.js      # Date math & milestone collapsing tests
        └── timelineService.test.js   # Milestone formatting & merging
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
# Run all unit and integration tests (passes 100% offline across Node 20 and 22, zero API keys required)
npm test

# Run tests with native experimental code coverage report (requires Node 22+)
npm run test:coverage

# Run linter and formatting checks
npm run lint
npx prettier --check .
```

### 3.5 API Reference

| Endpoint           | Method | Rate Limit | Request Body                                   | Success Response                                          | Purpose                                                                 |
| ------------------ | ------ | ---------- | ---------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `/`                | `GET`  | None       | None                                           | `200 text/html`                                           | Serves static frontend (`public/index.html`) with strict CSP headers    |
| `/health`          | `GET`  | None       | None                                           | `200 JSON` `{ status, uptime, timestamp }`                | Liveness and uptime probe                                               |
| `/api/plan`        | `POST` | 10 / min   | Validated `requestSchema` JSON (max 20 KB)     | `200 JSON` Full `Plan` object (`mode: "ai" \| "offline"`) | Generates complete event plan with budget, timeline, vendors, and ideas |
| `/api/plan/whatif` | `POST` | 60 / min   | Validated `requestSchema` JSON (max 20 KB)     | `200 JSON` Partial plan (budget, health, warnings)        | Recalculates budget and rules deterministically without calling LLM     |
| `/api/export/ics`  | `POST` | 60 / min   | `{ eventName: string, timeline: Milestone[] }` | `200 text/calendar` (.ics download)                       | Exports milestone schedule as iCalendar calendar file                   |

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
6. **Rate Limits & Sizing:** Tiered rate limiting: 60 requests/minute per IP general; 10 requests/minute per IP for generative `/api/plan`. Request body capped at 20 KB. Exceeding returns 413 `PAYLOAD_TOO_LARGE` with `requestId`.
7. **Privacy & Storage:** Zero server-side persistence. Plan restoration and tickable vendor checklist progress persist strictly in the user's browser via `localStorage`.
8. **Refine Scope:** Natural-language refine is not implemented; interactive deterministic "What-If" slider analysis is provided for instant recalculation without LLM latency or cost.
9. **Serverless Concurrency:** On serverless hosts (such as Vercel), the in-memory LRU cache and rate limiter are per instance and best-effort; shared state across instances would require an external store such as Redis.

---

## 5. Evaluation Map

| Criterion                       | Where to look                                                                                                                                     | One-line evidence                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Code Quality**                | `src/`, `src/profiles/`, `src/rules/sharedRules.js`, `eslint.config.js`, `src/types.js`, `.github/workflows/ci.yml`                               | Layered architecture, strategy profiles without `if/else`, permanent ESLint complexity &le; 10 and max-lines &le; 40, JSDoc types, and automated CI.                |
| **Problem Statement Alignment** | `src/services/decisionEngine.js`, `src/controllers/planController.js`, `public/js/whatif.js`, `src/utils/ics.js`, `src/services/geminiService.js` | Pure rule-based engine driving four outputs (budget, timeline, vendors, ideas), "Why this plan?" panel, instant slider what-if, .ics export, and full offline mode. |
| **Security**                    | `src/schemas/requestSchema.js`, `src/app.js`, `src/middleware/rateLimiter.js`, `src/prompts/`, `public/js/domUtils.js`                            | Strict Zod request parsing, Helmet CSP, IP rate limiting, `<<<USER_DATA>>>` delimiters against injection, and zero `innerHTML` rendering.                           |
| **Efficiency**                  | `src/utils/cache.js`, `src/services/planService.js`, `src/app.js`, `src/controllers/whatifController.js`                                          | SHA-256 LRU cache, 3 parallel Gemini calls via `Promise.all`, gzip compression, and zero-LLM what-if recalculation.                                                 |
| **Testing**                     | `tests/`, `tests/unit/propertyBudget.test.js`, `tests/unit/geminiMock.test.js`, `tests/integration/api.test.js`                                   | 80 automated tests (95.75% line, 87.79% branch coverage) running 100% offline in ~1.2s with seeded property invariants and mocked Gemini resilience.                |
| **Accessibility**               | `public/index.html`, `public/css/components.css`, `public/js/ui.js`                                                                               | Semantic landmarks, explicit `<label>` associations, `aria-live="polite"` loading & generation announcements, 4.5:1 WCAG AA contrast, and `prefers-reduced-motion`. |

---

## 6. Environment Variables

The table below corresponds strictly to `.env.example`:

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

---

## 7. Sample Scenarios

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

---

## 8. Security & Accessibility Notes

### 8.1 Security Architecture

- **Input Validation:** Every incoming payload is validated against strict Zod schemas with bounded string lengths and numeric ranges.
- **AI Output Sanitization:** LLM JSON output is strictly validated against `planSchema` before being processed. Unexpected shapes trigger safe offline fallback.
- **HTTP Hardening:** `helmet` sets strict Content Security Policy (`default-src 'self'`), disables X-Powered-By, and enforces HSTS.
- **Prompt Injection Defense:** Strict separation of system instructions and user parameters using delimiters (`<<<USER_DATA>>>`) and prompt guards.
- **Safe DOM Rendering:** Client uses `textContent` and native element construction exclusively. Zero usage of `innerHTML`.
- **Zero Secrets Leakage:** API keys are injected via environment variables and never logged or serialized to the client.

### 8.2 Accessibility Architecture

- **Landmarks & Structure:** Logical semantic layout (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`) with a single `<h1>` and hierarchical headings.
- **Stacked Layout:** Continuous stacked `<section>` blocks linked by a sticky jump-link `<nav>`. Guarantees native keyboard tab flow, zero focus trap vulnerabilities, and seamless printing.
- **Form Association:** Every input, select, and textarea has an explicitly associated `<label>`. Errors are tied using `aria-describedby` and flagged with `aria-invalid="true"`.
- **Screen Reader Announcements:** Dynamic state changes (loading status with 15s timing note, plan generated) use `aria-live="polite"`. Error notifications trigger `role="alert"`. Focus shifts programmatically to the plan heading upon generation.
- **Visual Contrast & Independence:** WCAG 2.1 AA compliant palette (minimum 4.5:1 text contrast). The budget health meter pairs color indicators with descriptive text and explanations.
- **Responsive & Motion:** Fully operable at 360px viewport width and 200% zoom without horizontal clipping. `prefers-reduced-motion` media queries disable non-essential animations.

---

## 9. Testing & Code Quality

### 9.1 Test Suite & Native Code Coverage

- Eventiq uses the native Node.js test runner (`node:test`) executing **80 automated tests** in **~1.2 seconds** with zero runtime test dependencies across **Node.js 20 and Node.js 22**.
- Tests run **100% offline**, requiring zero external network calls and zero mock libraries or API keys.
- **Measured Native Code Coverage (`npm run test:coverage`, requires Node 22+):**
  - **Lines:** 95.75%
  - **Branches:** 87.79%
  - **Functions:** 95.19%
- **Seeded Property Invariant Testing (`tests/unit/propertyBudget.test.js`):** 550 seeded pseudo-random test cases across all four profiles proving mathematical invariants: `sum(categoryAmounts) === totalBudget` strictly holds, zero negative allocations, and contingency reserve floor is always &ge; 5%.
- **Table-Driven Boundary Tests (`tests/unit/ruleContracts.test.js`):** Boundary tests for every shared and profile rule (guests 29/30/400/401, exactly 4 weeks, exactly 1 week, monsoon month boundaries, child age 12/13), verifying that all allocation shifts net strictly to zero.
- **Timeline Date Math Tests (`tests/unit/timelineMath.test.js`):** Injected clock verification covering same-day events, 1 day away, 3 years away, and past dates, with chronological sorting and zero duplicate dates.
- **Mocked Resilience & Budget Immutability (`tests/unit/geminiMock.test.js`):** Fake client testing covering Gemini success, malformed JSON, schema violation fallback, timeout, exponential retry, offline mode exclusion from cache, and ensuring AI output never overrides code-calculated budget numbers.
- **Prompt Injection Defense (`tests/unit/securityInjection.test.js`):** Verifies delimiter escaping, control character stripping, and length truncation bounds.
- **Cache Lifecycle (`tests/unit/cacheAdvanced.test.js`):** Verifies TTL expiration (50ms), LRU capacity eviction, and property-order key invariance.
- **Environment & Rate Limiting (`tests/unit/configEnv.test.js` & `tests/integration/api.test.js`):** Verifies Zod parsing branches, rate limit headers (`/api/plan` limit 10 vs other routes limit 60), static fallback, and 413 `PAYLOAD_TOO_LARGE` with `requestId`.

### 9.2 Code Quality Standards

Eventiq enforces strict production code standards validated automatically in CI:

- **Cyclomatic Complexity:** Every function across the server and client is restricted to a maximum cyclomatic complexity of **10** and a maximum length of **40 statements/lines** (enforced via permanent ESLint rules).
- **File Length Caps:** Maximum lines per JS file capped at 300 (excluding blanks and comments) with zero violations.
- **Single Source of Truth:** Data boundaries, string length caps, guest count limits, budget bounds, and event enums are defined once in `public/js/shared/limits.js` and imported by both backend schemas and frontend input validators.
- **Robust Error Handling:** Centralized through `AppError` (`message`, `status`, `code`, `details`). Swallowed errors and empty catch blocks are strictly prohibited.
- **Static Type Layer:** Comprehensive domain type definitions in `src/types.js` with JSDoc annotations and `jsconfig.json` verification (`tsc`).
- **Modular Presentation:** CSS is partitioned into decoupled layers (`base.css`, `layout.css`, `components.css`, `print.css`) without `@import` overhead, respecting strict Content Security Policy.
- **Automated CI:** GitHub Actions executes dependency verification, linter checks, Prettier formatting validation, and native test suites on every push and PR.
