# Supermarket Tycoon: Mini Mart - Architecture & Implementation Plan
**Target Platform:** YouTube Playables (Phaser 3 + Vite)  
**Lead Architecture Review:** Flutter / Clean Architecture Alignment Guide  
**Milestones Covered:** Milestone 0 (Environment & SDK Baseline) & Milestone 1 (Responsive Supermarket Scene & HUD)

---

## 1. Architectural Strategy for a Flutter Technical Lead

### The Paradigm Shift: Flutter vs. Phaser 3
In Flutter, architecture naturally revolves around declarative UI, reactive state management (BLoC / Cubit / Riverpod / Signals), and Clean Architecture layer separation. Game engines like Phaser 3, by default, provide an imperative render loop (`create`, `update(time, delta)`). If untamed, game scenes easily become "God objects" containing rendering, collision physics, state mutation, network/SDK calls, and UI in a single file.

To provide a seamless, maintainable, and testable codebase:

| Flutter Concept | Game Architecture Equivalent | Project Implementation |
|---|---|---|
| **StatefulWidget / View** | **Phaser Scene & GameObjects** | `SupermarketScene.js`, `HUD.js` — purely presentation. Renders graphics, captures pointer input, and reacts to state changes. |
| **BLoC / Cubit / Notifier** | **Domain Systems** | `InventorySystem.js`, `EconomySystem.js`, `CustomerSystem.js`, `CheckoutSystem.js` — pure JavaScript/TypeScript classes decoupled from Phaser. |
| **State Emission (`emit(State)`)** | **Event Emitter / Observables** | Systems emit state-change events (e.g. `coins-changed`, `stock-updated`) via Phaser EventEmitter or standard EventTarget. |
| **Entities / Data Classes** | **Domain Models** | `Product.js`, `Customer.js`, `GameState.js` with explicit validation and immutability guards. |
| **Repository / DataSource** | **Save & Platform Adapters** | Abstract `SaveAdapter` with `PlayablesSaveAdapter` (wrapping `window.ytgame`) and `LocalSaveAdapter` (browser fallback). |
| **Unit Testing (flutter_test)** | **Vitest Headless Suite** | Because domain systems have zero Phaser/Canvas dependencies, all economy and inventory rules run in headless Node in milliseconds. |

### Architectural Invariants
1. **Zero Phaser in Domain Logic**: `EconomySystem` and `InventorySystem` never import `Phaser` or touch canvas contexts.
2. **Atomic Financial Transactions**: Restocking deducts coins and increments stock in one atomic operation; checkouts consume stock and credit coins atomically. No negative balances, no non-finite numbers (`NaN`, `Infinity`).
3. **Isolate YouTube Playables SDK**: All calls to `window.ytgame` go through `YouTubePlayables.js` and dedicated adapters, with timeout protection and offline/local fallback.

---

## 2. Milestone 0 & 1 Scope

### Milestone 0: Repository Baseline & Environment Verification
- [x] Adopt official Phaser YouTube Playables template (`https://github.com/phaserjs/template-youtube-playables`).
- [x] Install dependencies (`phaser@^3.86.0`, `vite@^5.4.8`, `terser@^5.34.1`).
- [x] Configure `vitest@^2.1.8` (compatible with Vite 5) for domain unit tests.
- [x] Verify production build (`npm run build`) generates clean `dist/` bundle.
- [x] Initialize Git repository and commit baseline.

### Milestone 1: Responsive Supermarket Scene & HUD
- [x] **Store Models & Data**:
  - `src/data/products.js`: 5 initial products (Apples, Milk, Bread, Rice, Snacks) with pricing, starting stock, and capacities according to spec.
  - `src/models/GameState.js`: baseline state (coins: 500, starting stock: 5 each, milestone: 2,000 coins).
- [x] **Domain Systems (Milestone 1 Core)**:
  - `src/systems/EconomySystem.js`: atomic coin transactions, affordability checks, boundary validation.
  - `src/systems/InventorySystem.js`: shelf stock tracking, restock validations, capacity clamping.
- [x] **Responsive 2D Supermarket Scene (`SupermarketScene.js`)**:
  - Portrait-first responsive layout (optimized for 820x1180 base, scaling cleanly across mobile portrait & desktop aspect ratios).
  - Tiled supermarket floor with customer entrance mat, shopping aisles, checkout counter with register, and customer queue line.
  - 3+ Interactive Product Shelves (Apples, Milk, Bread) with visual stock indicators, capacity bars, restock buttons, and tap feedback.
  - Checkout station with register and 4 customer queue positions (ready for customer AI in Milestone 3).
  - Touch-friendly tap targets (> 48x48px) with hover, pointerdown, and pointerup visual micro-feedback.
- [x] **HUD & UI System (`src/scenes/UI.js`)**:
  - Coin balance counter (reactive to `EconomySystem`).
  - Store Objective / Milestone banner (e.g., "Goal: 2,000 Coins").
  - YouTube Playables Audio toggle button (synced with platform `isAudioEnabled` and `onAudioEnabledChange`).
  - Interactive status banner / toast feedback when restocking or tapping objects.
- [x] **Lifecycle & SDK Preservation**:
  - Keep `YouTubePlayables.boot()` in `main.js`.
  - Preserve `loadData()` and `onPause`/`onResume` in `Boot.js`.
  - Preserve `firstFrameReady()` in `Preloader.js`.
  - Trigger `gameReady()` when supermarket scene starts and is interactive.
- [x] **Unit Testing & Build Verification**:
  - Unit tests for `EconomySystem` and `InventorySystem` using Vitest.
  - Run full test suite (`npm test`).
  - Run production build (`npm run build`).

---

## 3. Milestones 0 to 6 Implementation Status

| Milestone | Status | Key Deliverables & Systems |
|---|---|---|
| **M0: Baseline & SDK Setup** | [x] Completed | Template setup, Vite 5, Vitest 2.1.8, YouTube Playables SDK wrapper with offline timeout guard. |
| **M1: Supermarket Scene & HUD** | [x] Completed | Responsive 2D store, procedural texture atlas, touch-friendly shelves, HUD coin badge, audio toggle. |
| **M2: Customer AI & Pathing** | [x] Completed | Customer AI state machine, approach pathing, browsing, shelf item consumption, queue management, cashier scan. |
| **M3: Day Cycles & Marketing** | [x] Completed | 60s business day timer, Daily P&L report, Marketing campaigns (Pamphlets, Loudspeaker, Digital). |
| **M4: Commercial Bank Debt** | [x] Completed | 3 credit facilities (Micro ₹500, Expansion ₹1,500, Tycoon ₹5,000), amortization, early payoff, emergency bailout (+₹150). |
| **M5: Upgrades & Automation** | [x] Completed | Cashier scan speed (Laser, Dual-Belt, AI Express), shelf capacity expansions, Jasmine Rice department permit, Milestone tracker. |
| **M6: Cloud Persistence** | [x] Completed | Dual-adapter `SaveManager` (YouTube Playables Cloud Save + LocalStorage fallback), debounce scheduler, schema v1 validation. |

---

## 4. Test Suite & Build Verification
- **Unit Test Coverage:** 52 passing tests across 9 test suites (`EconomySystem`, `InventorySystem`, `CheckoutSystem`, `CustomerSystem`, `DayCycleSystem`, `MarketingSystem`, `BankLoanSystem`, `ProgressionSystem`, `SaveManager`).
- **Production Build:** Passes cleanly with zero warnings or external bundle dependencies (`dist/` asset build verified).
- **Platform Compliance:** Fully compliant with YouTube Playables SDK (`firstFrameReady`, `gameReady`, `loadData`, `saveData`, `onPause`, `onResume`, `isAudioEnabled`). Zero real-money IAPs, zero external ads.
