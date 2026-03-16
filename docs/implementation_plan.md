# Enzyme Reactor Teaching App — Implementation Plan

## Goal

Build a fully client-side, single-page React + TypeScript + Vite web app for teaching enzyme reactor design (Michaelis–Menten kinetics × reactor types). The app targets live lecture demos and student self-study.

Based on the spec in [reactor_teaching_app_implementation.md](../reactor_teaching_app_implementation.md) and the notation in the provided reference slides.

---

## Proposed Changes — Phased Build

### Phase 1: Project Scaffold + Domain Layer (no UI yet)

Set up the Vite + React + TS project and implement all reactor math as pure functions, fully decoupled from UI.

#### [NEW] Project root via `npx create-vite`

- React + TypeScript template
- Add dependencies: `plotly.js` + `react-plotly.js`, `katex` (for equation rendering), `vitest`

#### [NEW] `src/types/index.ts`
- Shared types using slide notation: `KineticParams`, `ReactorInput`, `ReactorOutput`
- Substrate concentration: `a`, `a0`, `a_in`, `a_out`
- Rate: `v(a)`
- Flow rate: `V̇` (represented as `v_dot` in code)
- Conversion: `X`
- Residence time: `τ`

#### [NEW] `src/lib/kinetics/michaelisMenten.ts`
- `rate(a, params)` — computes `v(a) = Vmax·a / (KM + a)`
- `vmax(kcat, e0)` — derives Vmax
- Helpers for rate-curve data generation

#### [NEW] `src/lib/reactors/batch.ts`
- Forward: integrate `da/dt = −v(a)` numerically → `a(t)`, `X(t)` trajectories
- Inverse: find `t` for target `X`
- Compute the `t(X)` design equation: `t(X) = (a0/Vmax)·X + (KM/Vmax)·ln(1/(1-X))`

#### [NEW] `src/lib/reactors/cstr.ts`
- Forward: solve algebraic CSTR equation `a_in − a_out = τ · v(a_out)` for `a_out`
- Inverse: compute `τ` or `V` for target `X` Using `τ(X) = (a_in/Vmax)·X + (KM/Vmax)·(X/(1-X))`
- Generate `a_out` vs `τ` curves

#### [NEW] `src/lib/reactors/pfr.ts`
- Forward: integrate `da/dτ = −v(a)` over `[0, τ]` → `a_out`
- Inverse: find `τ` for target `X` using `τ(X) = (a_in/Vmax)·X + (KM/Vmax)·ln(1/(1-X))`
- Generate curves including exponential and hyperbolic decay limits for teaching

#### [NEW] `src/lib/reactors/cstrSeries.ts`
- Solve N cascaded CSTR stages with arbitrary volumes V₁…Vₙ
- Forward: sequential CSTR solves per stage
- Inverse: bisect on total volume for target X (equal-sized variant)

#### [NEW] `src/lib/solvers/rootFinding.ts`
- Bisection method
- Newton-Raphson with fallback
- RK4 integrator

#### [NEW] `src/lib/units/format.ts`
- Engineering-friendly number formatting (3 sig figs)
- Unit label constants

#### [NEW] `src/lib/presets/defaults.ts`
- 6 presets as defined in spec §14
- Default parameter set

---

### Phase 2: Core UI Shell + Batch & Single Reactor Tabs

Build the app shell (tabs, layout, lecture mode toggle) and implement the first three reactor tabs.

#### [NEW] `src/components/Layout.tsx`
- Two-panel layout: controls (left) / plots (right)
- Lecture-mode class toggling (larger fonts, reduced clutter)

#### [NEW] `src/components/TabNavigation.tsx`
- 6 tabs: Overview, Batch, CSTR, PFR, CSTR Series, Compare

#### [NEW] `src/components/KineticInputPanel.tsx`
- Shared panel: toggle between Direct Vmax / Mechanistic (kcat + e0)
- Read-only display of derived quantity
- KM input
- Sliders + numeric fields with units

#### [NEW] `src/components/SolveModeSelector.tsx`
- Forward / Target Conversion radio group
- Disables/enables appropriate fields

#### [NEW] `src/components/RateLawPanel.tsx`
- Small `v(a)` vs `a` plot using current kinetic params
- Marks `a_in` and/or `a_out` on curve

#### [NEW] `src/components/ResultCard.tsx`
- Compact card showing key outputs (`a_out`, `X`, `τ`, `V`)

#### [NEW] `src/components/DocumentationBlock.tsx`
- Collapsible sections: Assumptions, Equations (KaTeX, matching slides), Interpretation notes

#### [NEW] `src/components/LectureModeToggle.tsx`
- Toggle button; stores state in React context

#### [NEW] `src/features/overview/OverviewTab.tsx`
- Welcome/concepts page with app description and quick-start guide

#### [NEW] `src/features/reactors/BatchTab.tsx`
- Controls: `a0`, kinetics, `t` or `X_target`
- Plots: `a(t)` and `X(t)` with Plotly
- Highlight area under `1/v(a)` vs `a` curve if possible
- Documentation block

#### [NEW] `src/features/reactors/CSTRTab.tsx`
- Controls: `a_in`, kinetics, `τ` (or `V̇`+`V`), or `X_target`
- Plots: `a_out` vs `τ`, `X` vs `τ`, operating point marker
- Documentation block

#### [NEW] `src/features/reactors/PFRTab.tsx`
- Same layout pattern as CSTR
- Documentation block with PFR-specific notes

#### [NEW] `src/App.tsx` / `src/main.tsx`
- Wire up tabs, global state, presets, reset, lecture mode

#### [NEW] `src/index.css`
- Design system: colors, typography, responsive layout, lecture-mode overrides

---

### Phase 3: CSTR Series Tab

#### [NEW] `src/features/reactors/CSTRSeriesTab.tsx`
- Dynamic N selector (add/remove reactors)
- Individual volume inputs per stage
- Stage-by-stage concentration/conversion profile (discrete bar/step chart)
- Overlay comparison: single CSTR and PFR at same total volume
- Documentation block

---

### Phase 4: Comparison Tab + Levenspiel Plot

#### [NEW] `src/features/comparison/CompareTab.tsx`
- Common parameter inputs
- **Required τ/V vs target X plot** (design equation visualization matching slide 11)
- **Levenspiel plot**: `1/v(a)` on y-axis vs `a` on x-axis (from `a_out` to `a_in`). Shows the PFR integral area and the CSTR rectangle area (matching slide 10)
- **CSTR vs PFR Normalized Outlet Concentration Decay**: `a_out/a_in` vs `τ` plot, showing the hyperbolic decay (CSTR) vs exponential decay (PFR)

#### [NEW] `src/lib/comparison/levenspiel.ts`
- Compute `1/v(a)` curve
- Compute CSTR rectangle area and PFR integral area for visual comparison

---

### Phase 5: Polish, Presets, Lecture Mode, Validation

#### [MODIFY] Various files
- Wire up all 6 presets with one-click loading
- Global reset button
- Lecture mode: auto-collapse docs, enlarge fonts/axes, simplify spacing
- Input validation: non-negative guards, impossible-target messages
- Cross-check numerical results against analytic limits
- Final UI/CSS polish

---

## Verification Plan

### Automated Tests

Run with: `npm test` or `npx vitest run` from the project root.

#### Domain layer unit tests (Vitest)

| Test file | What it covers |
|---|---|
| `src/lib/kinetics/__tests__/michaelisMenten.test.ts` | rate function, Vmax derivation, edge cases (a=0, a→∞) |
| `src/lib/reactors/__tests__/batch.test.ts` | Forward trajectory, inverse solve, first-order limit (a≪KM), zero-order limit (a≫KM) |
| `src/lib/reactors/__tests__/cstr.test.ts` | Forward solve, inverse solve, known analytic solution for simple cases |
| `src/lib/reactors/__tests__/pfr.test.ts` | Forward solve, inverse solve, PFR ≤ CSTR τ for same X (decreasing-rate check) |
| `src/lib/reactors/__tests__/cstrSeries.test.ts` | Cascade stages, N→large approaches PFR, unequal volumes |
| `src/lib/solvers/__tests__/rootFinding.test.ts` | Bisection convergence, RK4 accuracy on known ODE |

### Browser-Based Verification (after each phase)

I'll use the browser tool to:
1. **Phase 2**: Navigate to each reactor tab, enter values, verify plots render and update reactively
2. **Phase 3**: Add/remove CSTR stages, verify cascade calculation and comparison overlay
3. **Phase 4**: Check Levenspiel plot geometry, verify τ-vs-X and normalized decay comparison curves
4. **Phase 5**: Test all presets load correctly, lecture mode toggles visual changes, invalid inputs show messages

### Manual Verification (for you)

After Phase 5, I'll ask you to:
1. Open the app locally (`npm run dev`)
2. Try each preset and verify the numbers match your lecture expectations
3. Verify the Levenspiel plot style matches your slides
4. Toggle lecture mode on a projector or large display and confirm readability
5. Spot-check a few forward/inverse calculations against hand calculations or your slides
