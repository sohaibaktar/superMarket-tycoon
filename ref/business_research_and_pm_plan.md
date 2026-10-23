# Supermarket Tycoon: Mini Mart
## Business Project Management, Market Research & Economic Systems Design
**Document Version:** 2.0  
**Target Platform:** YouTube Playables (Phaser 3 + Vite)  
**Author:** Business Project Manager & Game Systems Researcher  
**Core Hook:** Real-world retail tycoon simulation (Working capital ₹250, Marketing campaigns, Bank loans & debt leverage) distilled into accessible, bite-sized casual 2D gameplay.

---

## 1. Executive Summary & Product Vision

### 1.1 The Product Concept
*Supermarket Tycoon: Mini Mart* is a casual 2D retail tycoon game developed specifically for **YouTube Playables**. Players take the helm of a neighborhood grocery store starting with a constrained working capital of **₹250**. 

Unlike standard "clicker" idle games that shower the player with endless unearned currency, *Mini Mart* introduces **genuine business tension**:
1. **Capital Allocation:** Every rupee must be budgeted between purchasing inventory, funding marketing, or servicing debt.
2. **Dynamic Footfall & Marketing:** Organic footfall is modest; launching marketing campaigns drives surges of customers with varying basket sizes.
3. **Financial Leverage (Bank Loans):** Players can take bank loans to accelerate store expansion, but must manage recurring interest payments and avoid debt default or bankruptcy.
4. **Instant Casual Accessibility:** Complex business concepts (gross margin, debt service, customer acquisition cost) are communicated through simple, satisfying tactile mechanics: tap-to-restock, register scanning, visual queue pacing, and clear animated feedback.

### 1.2 Platform Fit: YouTube Playables Dynamics
- **Audience Context:** Mobile & desktop YouTube users looking for instant, zero-friction entertainment between videos or during transit.
- **Session Length Profile:**
  - *Micro-session (1–3 min):* Restock shelves, clear a customer rush, collect day's profits.
  - *Macro-session (8–15 min):* Complete a business cycle, take a bank loan, purchase store expansion, unlock high-margin products.
- **Platform Constraints:**
  - Must run 100% client-side with instant first frame (<3 seconds on 4G).
  - Strict compliance with YouTube Playables certification: no external links, no third-party IAP or ads, zero tracking of PII.
  - Seamless persistence across browser reloads via YouTube Playables Cloud Save API (`loadData`/`saveData`).

---

## 2. Market & Competitor Research

### 2.1 Benchmark Analysis

| Benchmark Title | Core Strengths | Weaknesses / Gaps We Exploit |
|---|---|---|
| **My Mini Mart** (Supersonic Studios) | Highly satisfying physical carrying & stocking loop; visual progression. | Extremely repetitive; zero economic depth; artificial ad walls break immersion. |
| **Idle Supermarket Tycoon** (Codigames) | Clear department upgrades; offline progression metrics. | Pure passive spreadsheet clicker; lacks hands-on retail management feeling. |
| **Trader Life Simulator** (DNA Army Gaming) | Deep inventory purchasing, bill payments, bank loans, and financial anxiety. | Heavy 3D PC game; high learning curve; too punishing for casual mobile players. |
| **Shop Titans** (Kabam) | Deep crafting & store personalization; market pricing dynamics. | Complex RPG mechanics; heavy monetization paywalls; slow onboarding. |

### 2.2 The "Sweet Spot" Differentiator for YouTube Playables
Most casual mobile tycoon games suffer from **hyper-inflation** (numbers quickly reach billions and lose meaning) and **ad-fatigue**. 
*Supermarket Tycoon: Mini Mart* fills the gap by offering **meaningful, grounded numbers**:
- Starting at **₹250**, earning **₹10 to ₹50** per basket feels momentous.
- Taking a **₹500 micro-loan** to buy a third shelf tier creates a real dopamine rush of financial empowerment followed by the strategic pressure to make the loan payment.

---

## 3. Game Economy & Mathematical Model

### 3.1 The ₹250 Bootstrapping Dilemma (Day 1 Economics)
Starting with ₹250 requires deliberate inventory procurement:

| Product | Wholesale Cost | Retail Price | Gross Margin | Margin % | Min Restock Batch | Batch Cost |
|---|---:|---:|---:|---:|---:|---:|
| **Apples** | ₹5 | ₹10 | ₹5 | 50.0% | 5 units | ₹25 |
| **Bread** | ₹6 | ₹12 | ₹6 | 50.0% | 5 units | ₹30 |
| **Milk** | ₹8 | ₹15 | ₹7 | 46.7% | 5 units | ₹40 |
| **Snacks** | ₹4 | ₹9 | ₹5 | 55.6% | 5 units | ₹20 |
| **Rice (Locked)** | ₹10 | ₹18 | ₹8 | 44.4% | 5 units | ₹50 |

**Day 1 Allocation Strategy:**
- Initial inventory: 5 units of Apples (₹25), Bread (₹30), Milk (₹40), Snacks (₹20) = ₹115 total inventory value.
- Remaining cash in register: ₹135 cash buffer.
- Potential Day 1 Gross Revenue: 5×10 + 5×12 + 5×15 + 5×9 = ₹230.
- Resulting Cash Balance after Day 1 sell-out: ₹135 + ₹230 = **₹365** (Net profit of ₹115).

### 3.2 Marketing Engine & Customer Acquisition
Marketing campaigns directly control customer footfall ($F$) and customer basket size ($B$):

$$\text{Customer Arrival Interval } (T) = \frac{T_{\text{base}}}{1 + \text{MarketingMultiplier}}$$

| Campaign Tier | Cost | Duration | Footfall Boost | Target Demographics |
|---|---:|---|---:|---|
| **Street Pamphlets** | ₹50 | 60s (1 Day) | +40% faster arrivals | Students & budget shoppers (1–2 items/basket) |
| **Loudspeaker Promo** | ₹150 | 90s (1.5 Days) | +80% faster arrivals | Neighborhood families (2–3 items/basket) |
| **Digital Hyperlocal Ads** | ₹400 | 120s (2 Days) | +150% faster arrivals + VIP rush | Premium shoppers (3–4 items, tip bonus) |

### 3.3 The Commercial Bank & Debt Leverage System
Borrowing allows players to unlock higher-tier assets (extra shelves, checkout conveyor upgrade, hiring assistant) ahead of schedule.

#### Loan Structure
1. **Micro Working Capital Loan:**
   - Principal: **₹500**
   - Daily Interest Rate: **8%** (₹40/day)
   - Amortization: Deducted automatically at the end of each business day cycle (or split into 4 equal installments of ₹135 = ₹540 total repayment).
2. **Store Expansion Loan:**
   - Principal: **₹1,500** (Unlocks after Day 3)
   - Daily Interest Rate: **6%** (₹90/day)
   - Term: 5 business days (₹340/day payment).
3. **Commercial Tycoon Loan:**
   - Principal: **₹5,000** (Unlocks after Store Rating 3★)
   - Daily Interest Rate: **4%** (₹200/day)
   - Term: 8 business days.

#### Debt Default & Bankruptcy Guardrail
- If cash on hand at daily settlement is insufficient to cover debt service:
  - Bank initiates a **Grace Period Warning**.
  - A friendly "Emergency Bailout Grant" (₹150 from family/community) is triggered once per save file.
  - Non-punitive casual recovery: Bank repositions non-essential inventory instead of hard game-over lockouts, keeping YouTube casual players engaged.

---

## 4. Customer Behavior & Checkout Simulation Model

### 4.1 Finite State Machine (FSM)
Customers cycle through 5 distinct states:
```text
[SPAWN / ENTER] ➔ [SHOPPING / BROWSING] ➔ [QUEUEING AT CHECKOUT] ➔ [PAYING / SCANNING] ➔ [EXITING]
```
- **Shopping State:** Customer selects 1 to 3 items from currently stocked shelves. If a desired item is out of stock, customer shows an animated disappointed thought bubble ("💔 Apples") and either picks a substitute or proceeds to checkout with smaller basket.
- **Queueing State:** Maximum 4 customers in queue. If queue is full, arriving customers become impatient and walk away, signaling to the player: *Upgrade Checkout Speed or Hire a Cashier!*
- **Paying State:** Visual register scanning with audio "Beep!" and coin pop effect.

---

## 5. Work Breakdown Structure (WBS) & Sprint Roadmap

```mermaid
gantt
    title Supermarket Tycoon: Mini Mart WBS
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation
    Milestone 0: Template & Build Env       :done, m0, 2026-10-23, 1d
    Milestone 1: 2D Scene, Shelves, HUD     :done, m1, 2026-10-23, 1d
    section Phase 2: Operations
    Milestone 2: Customer FSM & Checkout    :active, m2, 2026-10-24, 2d
    Milestone 3: Daily Cycles & Marketing   :m3, 2026-10-26, 2d
    section Phase 3: Financial Engine
    Milestone 4: Bank Loan & Debt Amortization :m4, 2026-10-28, 2d
    Milestone 5: Store Expansion & Staff Hiring:m5, 2026-10-30, 2d
    section Phase 4: Certification
    Milestone 6: Cloud Save & Audio Sync    :m6, 2026-11-01, 2d
    Milestone 7: QA, Test Suite & Submission:m7, 2026-11-03, 2d
```

### Milestone Breakdown
- **Milestone 0 (Complete):** Playables template, Vite 5, Vitest, Git baseline.
- **Milestone 1 (Complete):** Responsive supermarket scene, HUD (Coins, Goal, Audio), interactive shelves, procedural textures, 18 automated unit tests.
- **Milestone 2 (Next):**
  - Customer GameObject & Sprite animation.
  - Customer AI pathfinding from Entrance ➔ Shelves ➔ Queue Spot ➔ Register ➔ Exit.
  - Basket accumulation and atomic checkout settlement.
- **Milestone 3 (Marketing & Daily Cycles):**
  - Business Day clock (e.g. 90-second day timer).
  - Marketing modal dialog (Pamphlets, Loudspeaker, Digital).
  - Dynamic customer arrival rate linked to active campaigns.
- **Milestone 4 (Bank & Debt System):**
  - Bank UI overlay (Apply for loan, see amortization table).
  - End-of-day P&L summary screen (Revenue, COGS, Marketing, Loan Interest, Net Profit).
- **Milestone 5 (Upgrades & Automation):**
  - Cashier assistant (automates checkout so player can focus on restocking).
  - Additional shelves (Rice, Dairy cooler, Bakery display).
- **Milestone 6 (Persistence & Platform Certification):**
  - SaveManager with versioned schema, serialization of bank loans and upgrades.
  - YouTube Playables SDK Test Suite verification (firstFrameReady, gameReady, onPause, onResume, loadData, saveData).

---

## 6. Risk Register & Mitigation Strategy

| Identified Risk | Severity | Probability | Mitigation Strategy |
|---|---|---|---|
| **Financial Complexity Fatigue:** Casual players getting confused by loan interest or debt math. | High | Medium | Keep numbers intuitive (₹10, ₹50, ₹500); present loans with clear daily deduction pills rather than compound interest jargon; provide 1-click simple repayment. |
| **Early Game Bankruptcy:** Player spending all ₹250 on marketing or expensive stock and getting stuck. | High | Medium | Enforce minimum inventory buffer; show contextual warnings ("Leave at least ₹50 in the register for restocks!"); trigger family bailout if cash reaches ₹0 with 0 stock. |
| **YouTube Playables Policy Violation:** Inadvertent use of unsupported monetization. | Critical | Low | Zero third-party ad networks or external links. Strictly adhere to YouTube Playables Certification Requirements. |
| **Mobile Aspect Ratio Distortion:** Game canvas clipping on ultra-tall (20:9) or tablet (4:3) screens. | Medium | Low | Unified `Phaser.Scale.EXPAND` + container scale fitting with dynamic vertical safe margins. |

---

## 7. Key Performance Indicators (KPIs)
1. **First 10-Second Engagement:** Time-to-first-sale < 8 seconds from entering store.
2. **Session Length:** Average session between 4 to 9 minutes.
3. **Core Loop Retention:** >70% of players taking their first bank loan or launching their first marketing campaign within Session 1.
4. **Performance:** Solid 60 FPS on mid-tier mobile browsers; bundle size < 2.5MB.
