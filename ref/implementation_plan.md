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

## 3. Detailed File-by-File Changes for Milestone 1

| File | Status | Description |
|---|---|---|
| `src/data/products.js` | New | Defines the 5 core grocery products, restock costs, sale prices, and shelf capacities. |
| `src/systems/EconomySystem.js` | New | Pure domain logic for coin balance, credits, debits, affordability checks, and validation. |
| `src/systems/InventorySystem.js` | New | Pure domain logic for stock tracking, shelf capacity, and atomic restocking. |
| `src/scenes/SupermarketScene.js` | New | Responsive 2D Phaser scene: floor, shelves, checkout counter, touch interactions. |
| `src/scenes/UI.js` | Modified | Updates HUD with store currency, objective banner, and platform audio controls. |
| `src/scenes/Preloader.js` | Modified | Generates/loads procedural supermarket texture assets for crisp rendering without external bloat. |
| `src/scenes/MainMenu.js` | Modified | Smooth transition into the Supermarket Scene with proper `gameReady()` signaling. |
| `src/main.js` | Modified | Replaces basketball demo scenes with Supermarket scenes while keeping template boot. |
| `tests/EconomySystem.test.js` | New | Unit tests verifying transactions, non-negative bounds, invalid inputs, and events. |
| `tests/InventorySystem.test.js` | New | Unit tests verifying stock limits, restock deductions, and invalid transactions. |

---

## 4. Platform Compliance Checklist
- [x] No unauthorized ad SDKs or payment APIs.
- [x] No backend dependency.
- [x] All lifecycle hooks (`firstFrameReady`, `gameReady`, `onPause`, `onResume`, `isAudioEnabled`) strictly follow official SDK specifications.
