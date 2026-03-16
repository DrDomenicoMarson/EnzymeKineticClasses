# Enzyme Reactor Teaching App - Task Breakdown

## Phase 1: Project Scaffold + Domain Layer
- [x] Scaffold Vite React+TS project
- [x] Install dependencies (`plotly.js`, `react-plotly.js`, `katex`, `vitest`)
- [x] Create shared types (`src/types/index.ts`)
- [x] Implement kinetics math (`src/lib/kinetics/michaelisMenten.ts`)
- [x] Implement numerical solvers (`src/lib/solvers/rootFinding.ts`)
- [x] Implement batch reactor math (`src/lib/reactors/batch.ts`)
- [x] Implement CSTR reactor math (`src/lib/reactors/cstr.ts`)
- [x] Implement PFR reactor math (`src/lib/reactors/pfr.ts`)
- [x] Implement CSTR Series math (`src/lib/reactors/cstrSeries.ts`)
- [x] Implement engineering format utilities (`src/lib/units/format.ts`)
- [x] Implement default presets (`src/lib/presets/defaults.ts`)
- [x] Write Unit Tests (`src/lib/**/*.test.ts`) and run them

## Phase 2: Core UI Shell + Batch & Single Reactor Tabs
- [x] Create Layout and Tab Navigation
- [x] Create Kinetic Input Panel and Solve Mode Selector
- [x] Create Rate Law Panel and Result Card
- [x] Create Documentation Block component
- [x] Create Lecture Mode Toggle and Context
- [x] Build Overview Tab
- [x] Build Batch Tab
- [x] Build CSTR Tab
- [x] Build PFR Tab
- [x] Update App.tsx and index.css (styling)

## Phase 3: CSTR Series Tab
- [ ] Build CSTR Series Tab (Dynamic N, volume inputs, profile chart, comparison overlay)

## Phase 4: Comparison Tab + Levenspiel Plot
- [ ] Implement Levenspiel area math (`src/lib/comparison/levenspiel.ts`)
- [ ] Build Compare Tab (tau/V vs X plot, Levenspiel plot, CSTR vs PFR decay plot)

## Phase 5: Polish, Presets, Lecture Mode, Validation
- [ ] Wire up all 6 presets
- [ ] Implement global reset
- [ ] Verify input validation (non-negative, impossible targets)
- [ ] Polish UI/CSS
- [ ] Final Browser verification
