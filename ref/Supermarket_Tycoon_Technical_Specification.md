# Supermarket Tycoon: Mini Mart
## Technical Lead Project Specification and Implementation Guide

**Document version:** 1.0  
**Project type:** 2D browser game / YouTube Playables candidate  
**Working title:** Supermarket Tycoon: Mini Mart  
**Primary audience:** Casual players using mobile YouTube and desktop web  
**Primary implementation:** TypeScript + Phaser 3 + Vite  
**Document status:** Development specification; validate current YouTube Playables requirements before submission

---

## 1. Executive Summary

Build a polished, lightweight 2D supermarket management game. The player starts with a small grocery store, buys inventory, serves customers, earns coins, upgrades shelves and store facilities, and progresses toward larger stores and goals.

The first release should be a compact but complete vertical slice: a game that can be started, played, won or lost, paused, and resumed, with reliable economy rules and saved progress. It should not be a static demo.

The game must first run in a normal browser, then integrate with the official YouTube Playables SDK and pass the available test suite and platform review. YouTube Playables access and public distribution are not guaranteed; submit an interest request early.

### Product vision
“Build a tiny grocery shop into a busy neighborhood supermarket through satisfying stock management, customer service, and upgrades.”

### Product principles
1. Fun within the first 10 seconds.
2. Clear feedback for every action.
3. Touch-first UI, also usable with mouse.
4. Short sessions with visible progress.
5. Lightweight assets and reliable performance.
6. No backend dependency for the first playable version.
7. Platform compliance before release; no unsupported monetization.

---

## 2. Goals and Non-Goals

### Goals
- Deliver a complete 2D supermarket tycoon gameplay loop.
- Support portrait-first responsive play and mouse/touch input.
- Implement inventory, restocking, customers, checkout, revenue, upgrades, and progression.
- Save and restore progress using a platform-supported persistence mechanism where available, with a safe local-development fallback.
- Integrate the official YouTube Playables SDK lifecycle.
- Pass local tests and the YouTube Playables SDK Test Suite before submission.
- Produce a maintainable codebase and clear documentation for AI-assisted development.

### Non-goals for MVP
- Multiplayer or live leaderboards.
- Real-money purchases, subscriptions, external payment links, or virtual-currency sales.
- Third-party ad SDKs or external advertising.
- Online accounts, cloud backend, or cross-device custom sync.
- Large 3D environments.
- Real-world grocery prices or actual commerce.
- User-generated content or chat.
- Complex staff AI, pathfinding, or procedural city simulation.

---

## 3. Target MVP Gameplay

### Core loop
1. Player sees store, current coins, inventory, and goal.
2. Player restocks a product by spending coins.
3. Customers arrive and select products that are in stock.
4. Customer completes checkout and pays the listed sale price.
5. Inventory decreases and the player's coins increase.
6. Player uses profits to restock and purchase upgrades.
7. Player completes a milestone and unlocks the next goal/store feature.

### MVP content
- One supermarket scene.
- Five product types: apples, milk, bread, rice, snacks.
- At least three shelf/stock interactions.
- Customers with visible enter/shop/queue/leave states.
- A checkout queue with a simple maximum capacity.
- Coin balance, stock quantity, sales counter, and progress objective.
- Three upgrade types: shelf capacity, customer speed/throughput, and sale bonus or store expansion.
- Pause/resume and sound toggle.
- Win state, optional challenge failure/low-cash feedback, and restart.
- Persistent save of valid progress.
- Tutorial prompts for the first few actions.

### MVP economy design (initial tunable values)
Values are provisional and must be balanced in playtesting.

| Product | Restock cost per unit | Sale price | Gross margin |
|---|---:|---:|---:|
| Apples | 5 | 10 | 5 |
| Milk | 8 | 15 | 7 |
| Bread | 6 | 12 | 6 |
| Rice | 10 | 18 | 8 |
| Snacks | 4 | 9 | 5 |

Start coins: 500. First milestone: 2,000 coins.  
Starting stock: 5 units per product.  
Customer arrival interval: tune around 2–5 seconds depending on queue state.  
Do not grant money for a sale unless stock is consumed exactly once. Do not allow negative stock or negative currency.

---

## 4. Technical Stack and Rationale

- **TypeScript:** typed game state, economy models, and maintainability.
- **Phaser 3:** 2D scene, input, sprite rendering, animation, timers, audio, scaling.
- **Vite:** local dev server and production bundling.
- **HTML/CSS:** host page and canvas container.
- **Official YouTube Playables SDK:** lifecycle, pause/resume, audio state, persistence and other supported integrations.
- **Vitest (recommended):** unit tests for economy and inventory logic.
- **ESLint + Prettier (recommended):** linting and consistent formatting.
- **Git:** version control and reviewable incremental changes.

Start from the official Phaser YouTube Playables template rather than an empty Phaser project:
https://github.com/phaserjs/template-youtube-playables

Official documentation:
- https://developers.google.com/youtube/gaming/playables
- https://developers.google.com/youtube/gaming/playables/reference/sdk
- https://developers.google.com/youtube/gaming/playables/test_suite
- https://developers.google.com/youtube/gaming/playables/certification/requirements
- https://developers.google.com/youtube/gaming/playables/certification/requirements_monetization

Use the template's compatible versions and SDK wrapper. Do not arbitrarily upgrade Phaser, Vite, or SDK integration without testing.

---

## 5. Architecture Overview

### Logical architecture

```text
Browser / YouTube Host
        |
        v
HTML Entry + Official Playables SDK
        |
        v
SDK Bootstrap / Boot Scene
        |
        v
Preloader -> Main Menu -> Supermarket Scene -> Results/Upgrade UI
                                  |
            +---------------------+---------------------+
            |                     |                     |
            v                     v                     v
      Inventory System      Customer System       Economy System
            |                     |                     |
            +---------------------+---------------------+
                                  |
                                  v
                            Game State Store
                                  |
                                  v
                         Save / Load Adapter
                         /                 \
             Playables SDK adapter     Local dev adapter
```

### Design rules
- Scenes render and coordinate gameplay; they must not become giant files containing every system.
- Economy and inventory rules should be plain TypeScript modules without Phaser dependencies wherever possible.
- UI reads game state and calls controlled actions; it should not directly mutate arbitrary state.
- All currency and inventory mutations must pass through domain systems.
- Save data must be versioned, validated, and resilient to missing/corrupt data.
- YouTube integration must be isolated behind an adapter to make local browser development possible.
- Do not introduce a backend for the MVP unless a specific requirement proves it necessary.

---

## 6. Recommended Folder Structure

Adapt the official template structure rather than deleting or replacing its SDK wrapper and boot lifecycle.

```text
supermarket-tycoon/
├── index.html
├── package.json
├── vite.config.js                 # if supplied by template
├── public/
│   ├── style.css
│   └── assets/
│       ├── tiles/
│       ├── shelves/
│       ├── products/
│       ├── customers/
│       ├── ui/
│       └── audio/
├── src/
│   ├── main.js                    # preserve template entry conventions
│   ├── YouTubePlayables.js        # preserve/use official template wrapper
│   ├── config/
│   │   ├── gameConfig.ts
│   │   └── constants.ts
│   ├── scenes/
│   │   ├── Boot.ts
│   │   ├── Preloader.ts
│   │   ├── MainMenu.ts
│   │   ├── SupermarketScene.ts
│   │   ├── UpgradeScene.ts        # optional overlay/scene
│   │   └── ResultsScene.ts
│   ├── systems/
│   │   ├── InventorySystem.ts
│   │   ├── CustomerSystem.ts
│   │   ├── CheckoutSystem.ts
│   │   ├── EconomySystem.ts
│   │   └── ProgressionSystem.ts
│   ├── models/
│   │   ├── Product.ts
│   │   ├── Customer.ts
│   │   └── GameState.ts
│   ├── data/
│   │   ├── products.ts
│   │   ├── upgrades.ts
│   │   └── balance.ts
│   ├── ui/
│   │   ├── HUD.ts
│   │   ├── ProductShelfUI.ts
│   │   ├── UpgradePanel.ts
│   │   └── TutorialOverlay.ts
│   ├── persistence/
│   │   ├── SaveManager.ts
│   │   ├── SaveSchema.ts
│   │   └── adapters/
│   │       ├── PlayablesSaveAdapter.ts
│   │       └── LocalSaveAdapter.ts
│   └── utils/
│       ├── math.ts
│       └── validation.ts
├── tests/
│   ├── InventorySystem.test.ts
│   ├── EconomySystem.test.ts
│   ├── CheckoutSystem.test.ts
│   └── SaveManager.test.ts
├── README.md
├── GAME_DESIGN.md
├── ARCHITECTURE.md
├── TEST_PLAN.md
└── RELEASE_CHECKLIST.md
```

The exact extensions and filenames must match the starter template's configured TypeScript/JavaScript setup. Do not blindly convert a JavaScript template to TypeScript without configuring Vite and the compiler.

---

## 7. Domain Models and Contracts

Use typed models, or equivalent JSDoc types if the template stays JavaScript.

### Product definition
- `id: string`
- `displayName: string`
- `restockCost: number`
- `sellPrice: number`
- `startingStock: number`
- `maxShelfStock: number`
- `assetKey: string`

### Product inventory
- `productId: string`
- `quantity: number`
- `capacity: number`

### Customer state
- `id: string`
- `state: "entering" | "shopping" | "queueing" | "paying" | "leaving"`
- `desiredProductIds: string[]`
- `currentTargetId?: string`
- `shoppingBasket: Array<{ productId: string; quantity: number }>`
- `waitTime: number`

### Game state
- `schemaVersion: number`
- `coins: number`
- `totalSales: number`
- `totalRevenue: number`
- `inventory: Record<string, number>`
- `upgrades: Record<string, number>`
- `completedMilestones: string[]`
- `sessionStats: { customersServed: number; productsSold: number }`
- `lastSavedAt?: number`

Never treat the client save payload as trusted input. Validate types, allowed product IDs, non-negative quantities, sensible caps, schema version, and maximum payload size before applying it.

---

## 8. System Responsibilities

### InventorySystem
Responsibilities:
- Read stock and capacity.
- Restock a valid product only when the player can afford it.
- Enforce stock limits and valid quantities.
- Deduct restock cost atomically with adding stock.
- Consume stock for a sale exactly once.
- Emit state changes for UI refresh.

Must not:
- Render sprites.
- Directly call YouTube SDK.
- Grant sale revenue itself if Checkout/Economy owns transaction settlement.

### CustomerSystem
Responsibilities:
- Spawn customers at a controlled interval.
- Limit concurrent customers.
- Drive customers through explicit states.
- Select only products that are available.
- Respect queue capacity and timeouts.
- Remove customers safely when leaving.

Must not:
- Change coins directly.
- Bypass CheckoutSystem to consume inventory.

### CheckoutSystem
Responsibilities:
- Validate basket and stock availability.
- Complete a transaction exactly once.
- Consume inventory and calculate sale total.
- Call EconomySystem for crediting revenue.
- Update sales/customer counters.
- Handle empty baskets and invalid transactions.

### EconomySystem
Responsibilities:
- Own coin balance changes.
- Validate costs and rewards.
- Reject negative costs, NaN, Infinity, and invalid transactions.
- Provide affordability checks.
- Apply upgrade costs and rewards atomically.
- Emit balance-change events.

### ProgressionSystem
Responsibilities:
- Track milestones and unlock requirements.
- Evaluate win state and upgrade unlocks.
- Avoid duplicate milestone rewards.
- Keep balance values configurable rather than scattered in scene code.

### SaveManager
Responsibilities:
- Serialize only durable game state.
- Add a schema version.
- Validate data on load.
- Migrate known older schema versions when feasible.
- Debounce or schedule saves to avoid writing on every frame.
- Recover gracefully when save is unavailable.
- Never store secrets or personal information.

---

## 9. Game Loop and UX

### Session flow
1. Boot and wait for document/platform readiness.
2. Render a lightweight loading screen.
3. Signal first-frame readiness at the appropriate point in the official lifecycle.
4. Load and validate saved game data.
5. Load assets and configure audio state.
6. Show main menu or continue screen.
7. Signal game-ready when it is actually waiting for player interaction.
8. Start the supermarket session.
9. Respond to platform pause/resume and audio changes.
10. Save state at safe milestones and on important state changes.
11. Show progress/reward state when a milestone completes.

Follow the current SDK reference for exact event/API requirements. Do not call lifecycle methods based on assumptions or duplicate them unnecessarily.

### UI principles
- Portrait-first layout; support varying aspect ratios and desktop viewport.
- Keep coins, goal, and key controls visible.
- Use large tap targets and clear visual feedback.
- Don't rely on color alone for stock warnings or success.
- Avoid tiny text and cluttered controls.
- Provide audio mute and respect the platform's audio setting.
- Make pause/resume safe: no duplicate timers, sales, or customer movement after resuming.
- Use original or properly licensed graphics/audio only.

### Suggested visual direction
- Cheerful, polished 2D cartoon supermarket.
- Warm floor, contrasting shelf colors, readable product icons.
- Distinct customer silhouettes and visible queue positions.
- Simple idle/walk/shop/pay animations.
- Original sprite atlas with consistent outline, scale, and lighting.
- Emoji may be used for a throwaway prototype, but must not be the final art direction.

---

## 10. Persistence Strategy

Define a small interface such as:

```ts
export interface SaveAdapter {
  load(): Promise<unknown | null>;
  save(data: string): Promise<void>;
}
```

Implement:
- `PlayablesSaveAdapter`: wraps the official platform's supported save/load methods.
- `LocalSaveAdapter`: for local browser development only, if permitted by the development environment.

Rules:
- Follow the official template's `YouTubePlayables` wrapper and exact SDK method signatures.
- Do not assume local browser storage is available, durable, or the production persistence mechanism.
- Handle timeout/rejection and continue with a fresh valid save where safe.
- Validate and cap save data before loading.
- Save after purchases, upgrades, milestone completion, and at safe periodic checkpoints.
- Avoid saving every render frame.
- Clearly document whether progress is local-only or platform-persisted in each environment.

---

## 11. YouTube Playables Integration

Use the official starter template:
https://github.com/phaserjs/template-youtube-playables

Required workflow:
1. Preserve the SDK script loading order specified by the official template.
2. Start Phaser through the template's SDK boot wrapper.
3. Handle first-frame-ready and game-ready at correct lifecycle points.
4. Query and respond to audio state and audio-change events.
5. Handle pause and resume without duplicating timers or transactions.
6. Use supported save/load APIs where available.
7. Send scores only if appropriate for the game's design and supported platform requirements.
8. Use the official SDK Test Suite and follow all current certification requirements.
9. Remove debug-only behavior, excessive logs, test controls, and development-only dependencies from release builds.

Official references:
- SDK: https://developers.google.com/youtube/gaming/playables/reference/sdk
- Test suite: https://developers.google.com/youtube/gaming/playables/test_suite
- Certification: https://developers.google.com/youtube/gaming/playables/certification/requirements
- Monetization: https://developers.google.com/youtube/gaming/playables/certification/requirements_monetization
- Developer portal: https://developers.google.com/youtube/gaming/playables/developer_portal

Do not invent unsupported SDK methods or assume that a successful local browser build guarantees YouTube acceptance.

---

## 12. Performance, Quality, and Accessibility

Targets for development (validate on representative devices):
- Fast first meaningful frame.
- Stable 30–60 FPS on target mid-range mobile devices.
- Small initial asset bundle; compress images and audio.
- Avoid unnecessary particle systems and expensive full-screen effects.
- Reuse customer sprites/game objects where appropriate.
- Avoid creating new timers or listeners repeatedly during gameplay.
- Clean up event listeners, timers, and scene resources on shutdown.
- No uncaught errors or rejected promises in the normal gameplay flow.
- Test on mobile portrait, landscape if supported, desktop, slow network, and constrained memory.

Accessibility/usability:
- Readable text and sufficient contrast.
- Large interactive controls.
- Clear feedback for disabled actions and insufficient funds.
- Audio is optional and can be muted.
- No essential information conveyed only through audio.
- Localize visible text later if supported and worthwhile.

---

## 13. Testing Strategy

### Unit tests
- Restock deducts correct cost.
- Restock rejects insufficient funds.
- Restock rejects invalid IDs and quantities.
- Shelf capacity is enforced.
- Sale consumes stock once.
- Sale credits the correct amount.
- Duplicate checkout cannot duplicate revenue.
- Negative or non-finite balances/rewards are rejected.
- Upgrade is charged once and applies once.
- Save payload validates, corrupt data recovers, schema version is handled.

### Integration tests
- Customer can complete the full enter → shop → queue → pay → leave loop.
- Sold-out product is not selected.
- Full checkout queue is handled without spawning unlimited customers.
- Pausing stops gameplay progression and resuming restarts it exactly once.
- Audio changes are reflected correctly.
- Save/load restores inventory, coins, upgrades, and milestones.
- A completed goal is not repeatedly rewarded.

### Manual device/browser tests
- Chrome desktop and mobile emulation.
- Actual Android browser/device when available.
- Tap, mouse, resize, orientation, background/foreground.
- No controls clipped on short/tall displays.
- Reload during play does not corrupt the save.
- SDK Test Suite lifecycle, pause/resume, audio and persistence tests.
- Production build starts from its built bundle without relying on dev-server behavior.

### Acceptance criteria for MVP
- A new player can start and understand the first action without external instructions.
- The player can restock, sell, earn, and upgrade.
- Currency and stock never become negative through normal gameplay.
- Every transaction is applied once.
- The first milestone can be completed and produces a clear success state.
- Save/load restores a valid state or safely starts fresh.
- Pause/resume and audio integration work with the official test suite.
- `npm run build` completes without errors.
- No known blocker bugs remain.
- Required Playables certification checks are passed before submission.

---

## 14. Development Workflow

Use small, reviewable steps and commit after each stable milestone.

### Milestone 0 — Repository and environment
- Create a repository from the official Phaser Playables template.
- Install dependencies and run the unmodified template.
- Run it through the SDK Test Suite.
- Record the template versions and current commands.
- Commit: `chore: initialize Playables template`.

### Milestone 1 — Static supermarket scene
- Build responsive floor, shelves, checkout and HUD.
- Use temporary graphics.
- Verify scaling and touch targets.
- Commit: `feat: add supermarket scene and HUD`.

### Milestone 2 — Inventory and economy
- Implement products, stock, restocking and coin accounting.
- Add unit tests.
- Commit: `feat: implement inventory and economy`.

### Milestone 3 — Customer and checkout loop
- Add customer states, shopping, queue, checkout and departure.
- Add transaction tests.
- Commit: `feat: add customer shopping and checkout`.

### Milestone 4 — Upgrades and progression
- Add upgrades, milestone, win state, tutorial and restart.
- Balance the economy.
- Commit: `feat: add upgrades and progression`.

### Milestone 5 — Persistence and SDK behavior
- Add versioned SaveManager and platform adapter.
- Verify pause/resume/audio/readiness.
- Test with the SDK Test Suite.
- Commit: `feat: integrate Playables lifecycle and save data`.

### Milestone 6 — Art, audio and polish
- Replace prototype shapes/emoji with original or licensed assets.
- Add animation, sound and clear feedback.
- Optimize load size.
- Commit: `polish: add final art and game feedback`.

### Milestone 7 — Release readiness
- Test all acceptance criteria.
- Build production output and verify the ZIP/bundle requirements.
- Complete metadata, thumbnails, privacy and certification requirements.
- Submit only when developer access is granted and requirements are met.
- Commit: `release: prepare Playables submission`.

---

## 15. Risk Register

| Risk | Mitigation |
|---|---|
| Developer access not granted | Submit interest request early; maintain a browser-playable demo and do not promise a YouTube launch date. |
| Monetization assumptions wrong | Follow the current official monetization rules and verify available portal options before forecasting revenue. |
| Game feels like a static demo | Prioritize visible customer movement, meaningful decisions, upgrades and short-term goals. |
| Economy can be exploited | Centralize transactions and validate all currency/stock mutations. |
| Save data becomes invalid | Version, validate, cap and recover safely. |
| SDK lifecycle fails certification | Preserve official template and test regularly with the SDK Test Suite. |
| Large asset bundle/slow start | Use optimized sprite atlases, compressed audio and a small initial scene. |
| AI agent changes too much at once | Require small milestones, tests, diffs and approval before broad refactoring. |
| Art licensing issue | Use original or commercially licensed assets; keep a record of asset sources and licenses. |

---

## 16. Monetization and Business Plan

### Important platform constraint
YouTube's current Playables monetization requirements state that:
- Third-party/off-platform in-game advertising is not permitted.
- Off-platform monetization is not supported.
- In-game purchases are not allowed under the documented requirements.
- YouTube-provided ad functionality may be allowed, subject to current SDK support and platform configuration.

These rules can change. Check the current official page before implementing any monetization:
https://developers.google.com/youtube/gaming/playables/certification/requirements_monetization

Do not add AdMob, third-party ad SDKs, payment links, external checkout, subscriptions, or other monetization workarounds inside the Playable unless the current official rules explicitly permit the use case.

### Revenue scenarios
1. **YouTube-provided ads:** investigate eligibility, available ad formats, developer access, and actual reporting/terms. Do not assume ads are enabled or that every player impression earns money.
2. **Publishing to other platforms:** make a separate web/mobile build only after reviewing that platform's policies. Other platforms may allow different monetization, but their SDKs and ad integrations must remain separate from the Playables build.
3. **Licensing or work-for-hire:** once the game is polished, offer the game or development service to publishers/clients under a written agreement. This is a business deal, not guaranteed passive income.
4. **Portfolio and studio growth:** use the project to demonstrate game development ability and build a reusable pipeline for future games.

### Financial reality
- Revenue is not guaranteed by acceptance or downloads.
- Do not estimate income without actual player, session, ad-availability, retention, and payout data.
- Start with a limited budget, use free/appropriately licensed tools, and avoid hiring or paid advertising until the prototype shows retention.
- Measure day-1 retention, session length, level completion, upgrade engagement, crash rate and load time only through analytics methods permitted by the platform and privacy rules.
- Never collect unnecessary personal data.

---

## 17. Instructions for Antigravity Developer

You are the senior game developer implementing this specification. Follow these rules:

1. First inspect the repository, `package.json`, official template, and existing SDK integration. Report what exists before changing files.
2. Preserve the official Playables boot, SDK wrapper, and lifecycle unless a documented technical reason requires a change.
3. Implement only one milestone at a time.
4. Before modifying files, provide a short plan and identify affected files.
5. Do not create an entirely new project or replace the template without explicit approval.
6. Use TypeScript if the starter setup supports it cleanly; otherwise keep the template's JavaScript convention and add JSDoc types. Do not mix conventions carelessly.
7. Keep inventory/economy logic separate from Phaser scenes.
8. Add tests for transaction-critical code.
9. Do not invent SDK methods. Verify API names against the official documentation and existing wrapper.
10. Do not add backend, accounts, third-party ads, payment flows, or in-app purchases to the MVP.
11. Use original or licensed assets and document their sources.
12. Make all UI responsive and test mouse plus touch controls.
13. After each milestone, run tests, lint if configured, and `npm run build`; report actual results and unresolved issues.
14. Do not claim tests passed unless they were actually executed.
15. Do not publish, upload secrets, alter account settings, or incur costs without explicit approval.
16. Update README and relevant documentation whenever behavior or setup changes.
17. Keep a `CHANGELOG.md` or milestone notes describing completed work.
18. If a requirement conflicts with current YouTube documentation, stop and report the conflict rather than silently implementing an unsupported feature.

### First task for the agent
Inspect the official template and repository, run the existing project, and report:
- Framework and dependency versions.
- Entry point and scene lifecycle.
- Existing Playables SDK integration.
- Commands for development, tests, and production build.
- Any setup/build failures.

Then propose a minimal file-by-file plan for Milestone 1. Do not start Milestone 2 until the static scene is running and verified.

---

## 18. Definition of Done

The project is not “finished” just because it compiles. The MVP is done when the core game loop is fun and understandable, economy rules are tested, save/load is resilient, UI works on mobile and desktop, the official Playables lifecycle is handled correctly, production builds succeed, and platform certification requirements have been verified. Public YouTube availability and monetization remain subject to platform access, approval, and current policies.
