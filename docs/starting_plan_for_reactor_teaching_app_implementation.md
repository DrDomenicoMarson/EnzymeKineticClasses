# Enzyme Reactor Teaching App — Implementation Specification (v1)

## 1. Purpose

Build a **client-side interactive web app** for teaching **enzyme reactor design** in a master's-level Chemical Engineering course.

The app is intended primarily for:
- **live lecture demonstration** by the instructor
- **student self-exploration** outside class

The app is **not** intended for grading, formal assessment, or backend data storage.

The pedagogical goal is to help students understand how **Michaelis–Menten kinetics** interacts with **reactor type**, **residence time / volume**, and **conversion**, through immediate visual feedback and explicit engineering documentation.

The UX should feel like a **compact engineering simulator** with **intuitive visuals** and **academic rigor**.

---

## 2. Core Design Principles

1. **Fast for lecture use**
   - Controls should update outputs immediately.
   - The interface must be easy to use on a projector.
   - Avoid clutter and long blocks of text in the main interaction area.

2. **Explicit but compact documentation**
   - Governing equations, assumptions, and short interpretation notes should be visible or easy to open.
   - The app should not require spoken explanation to be usable.

3. **Engineering-oriented interaction**
   - Users should work through explicit solve modes rather than freely editing every variable at once.
   - Inputs must be constrained to avoid contradictory states.

4. **Multiple equivalent representations**
   - The app must support both **substrate concentration** and **conversion** views.
   - Where one representation is primary, the other should still be displayed automatically.

5. **Expandable architecture**
   - v1 covers only ideal reactors with Michaelis–Menten kinetics.
   - The code structure should make it straightforward to extend later into a companion app or v2 with inhibition, deactivation, diffusion limitations, immobilization, etc.

---

## 3. Scope of v1

### Included in v1
- **Michaelis–Menten kinetics only**
- **Batch reactor**
- **Single CSTR**
- **Single PFR**
- **CSTRs in series** with **individually assigned reactor volumes**
- **Concentration-based** and **conversion-based** views
- Multiple **solve modes**
- Documentation blocks with assumptions, equations, and short notes
- Comparison visualizations, including a dedicated **Levenspiel / comparison tab**
- Lecture mode
- Presets / example scenarios
- Reset functionality

### Excluded from v1
- Temperature effects
- pH effects
- Inhibition
- Enzyme deactivation
- Diffusion limitations
- Immobilized enzyme models
- Multiple substrates
- Recycle networks
- PFR segmentation as a user-facing feature
- Batch reactors in sequence
- Any backend, login, grading, or data persistence service

---

## 4. Recommended Technical Stack

Use:
- **React**
- **TypeScript**
- **Vite**

Architecture should be fully **client-side** and deployable as a **static site**.

Recommended implementation choices:
- Use a plotting library suitable for reactive scientific plots (e.g. Plotly, Recharts, or similar). Choose whichever is simplest and robust.
- Use lightweight numerical solving where needed (root-finding, numeric integration if necessary).
- Keep domain logic separated from UI components.

Suggested source structure:
- `src/components/` — reusable UI blocks
- `src/features/reactors/` — reactor-specific UI
- `src/features/comparison/` — comparison tab logic
- `src/lib/kinetics/` — Michaelis–Menten equations and helpers
- `src/lib/reactors/` — batch/CSTR/PFR/CSTR-series models
- `src/lib/solvers/` — root-finding and numeric utilities
- `src/lib/units/` — formatting and unit helpers
- `src/lib/presets/` — default scenarios
- `src/types/` — shared TypeScript types

---

## 5. Domain Model and Notation

Use **English UI text**.

Use the instructor's preferred notation **where possible**. In particular:
- `S` for substrate concentration
- `X` for conversion
- `e0` for total enzyme concentration
- `Vmax` where relevant
- `KM` for the Michaelis constant
- `kcat` where relevant

Do not aggressively replace lecture notation with more generic textbook alternatives unless necessary for clarity.

### Kinetic law
Use Michaelis–Menten kinetics in volumetric form:

\[
r(S) = \frac{V_{\max} S}{K_M + S}
\]

with optional explicit enzyme formulation:

\[
V_{\max} = k_{cat} e_0
\]

The UI should support **two input modes**:
1. **Direct Vmax mode**
2. **Mechanistic mode** using `kcat` and `e0`

When one mode is active, the derived quantity from the other mode should still be shown read-only.

Assume:
- constant density / constant volumetric flow
- ideal reactors
- no side reactions
- no enzyme loss or decay in v1

---

## 6. Default Units

Use these defaults unless changed later:
- `S`, `KM`, `e0`: **mol/L**
- time: **min**
- flow rate `Q`: **L/min**
- reactor volume `V`: **L**
- `Vmax`: **mol/(L·min)**
- `kcat`: **1/min**

Use engineering-friendly numeric formatting, typically about **3 significant figures**.

Implicit/fixed variables should still be displayed with units even when not editable in the current solve mode.

---

## 7. Main Information Architecture

Build the app as a **single-page application** with top-level tabs or a similarly clear navigation model.

Recommended top-level tabs:

1. **Overview / Concepts**
2. **Batch**
3. **CSTR**
4. **PFR**
5. **CSTR Series**
6. **Compare Reactors**

Each reactor tab should share a common layout pattern:
- **control panel**
- **main plots**
- **compact numeric outputs** (nice to have, not mandatory if layout becomes crowded)
- **assumptions / equations / notes** block

### Layout recommendation
- left: controls/documentation
- right: plots/results
- use generous horizontal space on wide desktop / projector screens
- prioritize the main plots and key numbers without adding multiple presentation modes

---

## 8. Solve Modes

Do **not** allow arbitrary free editing of every variable simultaneously.

Instead, implement explicit solve modes with a selected editable subset. Variables that are fixed or derived should remain visible but not editable.

### Required solve modes

#### A. Forward simulation
Given kinetic parameters and design variables, compute the outlet state or trajectory.

Examples:
- Batch: given `S0` and `t`, compute `S(t)` and `X(t)`
- CSTR/PFR: given `Sin` and `tau` (or `Q` and `V`), compute `Sout` and `X`
- CSTR series: given `Sin`, number of reactors, and each reactor volume, compute final outlet state and intermediate stage states

#### B. Target conversion mode
Given target conversion `X_target`, compute required time / residence time / total volume.

Examples:
- Batch: solve required `t`
- CSTR/PFR: solve required `tau` or `V`
- CSTR series: solve required total size for a chosen train configuration if feasible

#### C. Compare at fixed design basis
Compare reactor types at fixed total residence time and/or fixed total volume.

Examples:
- Compare batch, CSTR, PFR, and a CSTR train under identical kinetic and feed conditions
- Compare a chosen CSTR train against a single CSTR and single PFR at the same total volume or residence time

UI requirement:
- Solve mode selection must be obvious and reactor-specific where needed.
- Hidden variables must not disappear entirely; show them in disabled/read-only form.

---

## 9. Reactor Models

## 9.1 Batch reactor

### Inputs
Depending on solve mode, include:
- `S0`
- kinetic input mode (`Vmax` or `kcat + e0`)
- `KM`
- time `t` or target conversion `X_target`

### Outputs
- `S(t)`
- `X(t)`
- optional instantaneous rate at current state
- required time for target conversion where applicable

### Visualization
Required:
- `S` vs `t`
- `X` vs `t`

### Notes block
Include:
- assumptions
- governing balance
- compact statement that batch evolves in time rather than along reactor volume
- short interpretation notes

---

## 9.2 Single CSTR

### Inputs
Depending on solve mode, include:
- `Sin`
- kinetic input mode
- `KM`
- either `tau` or (`Q`, `V`)
- target conversion where applicable

### Outputs
- `Sout`
- `X`
- required `tau` and/or `V` in inverse mode

### Visualization
Required:
- `Sout` vs `tau`
- `X` vs `tau`
- clearly indicate the operating point corresponding to current inputs

### Notes block
Include:
- perfect mixing assumption
- algebraic design equation
- short interpretation note about the exit concentration governing the whole reactor rate

---

## 9.3 Single PFR

### Inputs
Depending on solve mode, include:
- `Sin`
- kinetic input mode
- `KM`
- either `tau` or (`Q`, `V`)
- target conversion where applicable

### Outputs
- `Sout`
- `X`
- required `tau` and/or `V` in inverse mode

### Visualization
Required:
- `Sout` vs `tau`
- `X` vs `tau`
- current operating point marker

### Notes block
Include:
- plug-flow assumption / no back-mixing
- integral design equation
- short interpretation note about gradual concentration change through the reactor and why this generally benefits decreasing-rate kinetics

---

## 9.4 CSTRs in series

### Included behavior
- User selects number of reactors `N`
- User enters each reactor volume directly
- Reactor volumes are **not constrained to be equal**
- Show stage-by-stage outputs and final outlet state

### Inputs
Depending on mode:
- `Sin`
- kinetic input mode
- `KM`
- `Q` or equivalent design basis
- `N`
- `V1, V2, ..., VN`

### Outputs
- outlet concentration after each stage
- conversion after each stage
- final `Sout`
- final `X`
- total volume
- total residence time

### Visualization
Required:
- stagewise concentration profile (discrete)
- final performance compared with single CSTR and single PFR at the same total volume/residence time
- optional per-stage conversion bars if easy to implement cleanly

### Notes block
Include:
- each stage behaves as an ideal CSTR
- train approaches PFR behavior as staging increases in many cases
- unequal sizing is permitted to support design exploration

Batch reactors in sequence should **not** be implemented.

---

## 10. Comparison Tab

This must be a **separate dedicated tab**, not buried inside an individual reactor tab.

Purpose:
- compare reactor types under common assumptions
- make the PFR vs CSTR tradeoff visible
- support lecture discussion of design efficiency

### Required comparisons
- Batch vs CSTR vs PFR where meaningful on a common basis
- Single CSTR vs PFR at fixed total volume / residence time
- Selected CSTR train vs single CSTR and single PFR at the same total volume / residence time

### Required plots
1. **Required residence time / volume vs target conversion**
   - Show batch, CSTR, PFR, and CSTR series where appropriate
2. **Levenspiel-style comparison view**
   - Must be included in v1
   - Represent the relevant geometric design comparison clearly
3. Optional but recommended:
   - overlay of `X` vs `tau` curves for multiple reactor types

### Levenspiel view requirements
- This should visually explain why CSTR and PFR differ under Michaelis–Menten kinetics.
- Use a representation consistent with the instructor's lecture notation where possible.
- It is acceptable to use a classical conversion-based Levenspiel formulation if that is the cleanest option, but label it clearly.
- The plot should visually indicate the current operating point and the corresponding geometric interpretation.

---

## 11. Rate Law Panel

Include a **small separate panel** showing the Michaelis–Menten rate law shape.

Required plot:
- `r(S)` versus `S`

Requirements:
- This panel should be visible in a compact form on relevant tabs.
- Mark the current inlet and/or outlet substrate concentration if helpful.
- It should reinforce saturation behavior without taking over the main layout.

---

## 12. Concentration and Conversion Views

The app must support both:
- concentration-based interpretation
- conversion-based interpretation

Recommended behavior:
- keep one representation primary depending on the plot or solve mode
- always display the converted counterpart nearby
- avoid letting users enter inconsistent values in both forms simultaneously

Examples:
- If user edits `Sin` and `Sout`, compute and display `X`
- If user edits target `X`, compute and display `Sout`

---

## 13. Documentation Blocks

Each reactor tab should include:

### A. Assumptions block
Short, always-visible or easily accessible summary.

### B. Governing equations block
Compact but explicit equations, with notation matching the course where possible.

### C. Short interpretation notes
Very brief explanatory comments such as:
- what variable controls performance most strongly in this regime
- why saturation changes the effective order
- why PFR typically outperforms CSTR for decreasing-rate kinetics

### D. Collapsible derivation / documentation block
A longer optional section is encouraged if it does not clutter the interface.

This section should be readable but not essay-like.

---

## 14. Presets and Examples

Implement a preset/example system.

### Required presets
1. **Low `S0/KM`**
2. **Intermediate `S0/KM`**
3. **High `S0/KM`**
4. **Single CSTR vs PFR at high conversion**
5. **CSTR train approaching PFR**
6. **Unequal CSTR train example**

Requirements:
- preset selection should immediately populate controls
- include a short one-line explanation for each preset if practical
- include a global **Reset to default** button

---

## 15. Desktop Presentation Readability

Use a single default presentation mode that is already readable on projector and 16:9 desktop screens.

Requirements:
- larger plots should be prioritized in the default layout
- controls and documentation should remain visible without feeling cramped
- the app should take advantage of wide screens rather than centering everything in a narrow column
- preserve full simulator correctness; readability is achieved through the base layout, not a separate mode

---

## 16. UI/UX Requirements

### General
- Clean scientific UI
- Responsive for desktop at minimum
- Primary optimization target is **desktop/laptop**, especially classroom projection
- Tablet compatibility is welcome if not costly
- Phone support is not a priority for v1

### Controls
- Use sliders where intuitive, but always provide exact numeric entry fields for engineering precision
- Units must be shown next to inputs
- Disable invalid controls cleanly rather than hiding too much logic

### Validation
- Prevent negative concentrations, negative volumes, negative times, etc.
- Guard against divide-by-zero and impossible target states
- For impossible or asymptotic targets, show informative messages rather than crashing

### Results
Compact result cards are desirable but optional if they crowd the layout.
If included, cards should prioritize:
- `Sout`
- `X`
- `tau`
- `V`
- total volume for CSTR trains
- derived `Vmax` if using mechanistic input mode

---

## 17. Numerical Requirements

The implementation must prioritize **correctness and robustness** over visual polish.

### Expectations
- Use analytic formulas where straightforward and reliable.
- Use numeric solving where inversion is cleaner than hard-coding complicated algebra.
- Numerical methods must be stable over normal classroom parameter ranges.
- When multiple roots or pathological inputs are possible, handle them explicitly.

### Recommended validation strategy
Create internal validation checks for representative scenarios:
- low-substrate regime should approach first-order-like behavior
- high-substrate regime should approach zero-order-like saturation behavior
- increasing number of CSTRs in series should trend toward PFR-like performance in typical cases
- fixed total volume comparison should show expected PFR advantage over single CSTR for decreasing-rate kinetics

---

## 18. Suggested Parameter Defaults

Use sensible classroom-friendly default values. Exact values may be adjusted during implementation, but the defaults should create informative, non-pathological plots.

Suggested example defaults:
- `Sin = 1.0 mol/L`
- `KM = 0.5 mol/L`
- `e0 = 0.01 mol/L`
- `kcat = 100 1/min`
- derived `Vmax = 1.0 mol/(L·min)`
- `Q = 1.0 L/min`
- single-reactor `V = 1.0 L`
- batch end time default around `5 min`

These are placeholders; tune them for visually useful behavior.

---

## 19. Expandability Requirements

Even though v1 excludes more advanced phenomena, structure the code so that future additions are realistic.

Design the domain layer so future extensions can add:
- inhibition models
- deactivation
- temperature dependence
- diffusion-limited / immobilized systems
- additional kinetic laws
- non-ideal reactor models

Recommendation:
- define a generic kinetic model interface
- define reactor solvers independently of UI components
- avoid hard-coding Michaelis–Menten assumptions deep inside components

---

## 20. Deliverables

The coding agent should produce:
1. a working React + TypeScript + Vite app
2. clear source organization
3. readable desktop-first UI
4. presets and reset button
5. all required plots and tabs
6. robust input validation
7. concise inline documentation / notes

Optional but welcome:
- lightweight help/tooltips
- URL state sharing for current configuration
- export of plots as images

These are not required for v1.

---

## 21. Acceptance Criteria

The implementation is successful if all of the following are true:

1. A user can simulate **batch, CSTR, PFR, and CSTR series** under Michaelis–Menten kinetics.
2. The app supports both **direct Vmax input** and **mechanistic kcat + e0 input**.
3. The app supports both **concentration** and **conversion** perspectives.
4. The app offers explicit **solve modes** and avoids contradictory input states.
5. The app includes a dedicated **comparison tab** with a **Levenspiel-style view**.
6. The app includes a small **rate-law panel** showing `r(S)`.
7. Each reactor tab includes **assumptions**, **governing equations**, and **short interpretation notes**.
8. The app includes **presets** and **reset**.
9. The UI is readable and practical for **live lecture demo**.
10. The implementation is **numerically stable** for normal classroom parameter ranges.

---

## 22. Priority Guidance

When tradeoffs arise, prioritize in this order:

1. mathematical correctness
2. clarity for teaching
3. responsiveness in lecture use
4. clean architecture for later expansion
5. visual polish

Do not sacrifice correctness or conceptual clarity for decorative UI.
