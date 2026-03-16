# Enzyme Reactor Simulator

An interactive, client-side web application for teaching enzyme reactor design, featuring Michaelis–Menten kinetics and ideal reactor models (Batch, CSTR, PFR).

## 🚀 Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run development server:**
    ```bash
    npm run dev
    ```

3.  **Run tests:**
    ```bash
    npm test
    ```

4.  **Build the distributable outputs:**
    ```bash
    npm run build
    ```
    This writes both the standard web bundle and the self-contained student handout
    at `dist/enzyme-reactor-simulator-standalone.html`.

## Standalone Distribution

The main distributable is the generated
`dist/enzyme-reactor-simulator-standalone.html` file.
Students can open it locally in a modern browser without running a server.

If you only want to regenerate the standalone handout, you can still run:

```bash
npm run build:standalone
```

## 📚 Documentation

The following internal artifacts have been persisted for project tracking and development history:

- **[Implementation Plan](./docs/implementation_plan.md)**: Detailed technical blueprint and phased build strategy.
- **[Task Log](./docs/task_log.md)**: Progress tracker for implemented and planned features.
- **[Phase 2 Walkthrough](./docs/walkthrough.md)**: Verification of core UI features, screenshots, and major bug fixes (e.g., Plotly factory interop).

## 🧪 Core Features

- **Kinetics**: Integrated Michaelis–Menten rate law calculation.
- **Batch Reactor**: Trajectory plots for substrate and conversion.
- **CSTR/PFR**: Steady-state design curves and residence time optimization.
- **CSTR Series + Compare**: Staged-reactor analysis, Levenspiel-style comparison, and normalized decay plots.
- **Presets + Reset**: Classroom scenarios that quickly repopulate the simulator state.
- **Desktop-First Layout**: A wide 16:9-friendly interface for lecture use and self-study.

---
Built with React + TypeScript + Vite + Tailwind CSS + Plotly.js.
