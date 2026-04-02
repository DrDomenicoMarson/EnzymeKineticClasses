/* Physical constants (SI) */
export const R      = 8.314;          // J/(mol·K)  gas constant
export const kB     = 1.380649e-23;   // J/K        Boltzmann
export const h_P    = 6.62607015e-34; // J·s        Planck

/* Helper: kB/h  (≈ 2.0836e10  s⁻¹·K⁻¹) */
export const kB_over_h = kB / h_P;

/* Convenient temperature helpers */
export const celsiusToKelvin = (c: number) => c + 273.15;
export const kelvinToCelsius = (k: number) => k - 273.15;

/* ---------- pH Presets ---------- */
import type { PhPreset, TemperaturePreset } from '../types';

export const PH_PRESETS: PhPreset[] = [
  {
    name: 'Pepsin',
    activity: { pKa1: 1.0, pKa2: 4.7, vPrime: 100 },
    stability: { pKs1: 1.5, pKs2: 6.5, n1: 1.0, n2: 2.0 },
    description: 'Stomach acid protease, pH opt ≈ 2.9',
  },
  {
    name: 'Trypsin',
    activity: { pKa1: 6.5, pKa2: 9.0, vPrime: 100 },
    stability: { pKs1: 3.0, pKs2: 11.0, n1: 1.5, n2: 1.5 },
    description: 'Pancreatic serine protease, pH opt ≈ 7.8',
  },
  {
    name: 'Lysozyme',
    activity: { pKa1: 3.8, pKa2: 6.6, vPrime: 100 },
    stability: { pKs1: 2.5, pKs2: 10.5, n1: 1.2, n2: 1.3 },
    description: 'Egg white glycosidase, pH opt ≈ 5.2',
  },
  {
    name: 'Papain',
    activity: { pKa1: 4.2, pKa2: 8.2, vPrime: 100 },
    stability: { pKs1: 3.0, pKs2: 10.0, n1: 1.0, n2: 1.5 },
    description: 'Plant cysteine protease, pH opt ≈ 6.2',
  },
  {
    name: 'Alk. Phosphatase',
    activity: { pKa1: 7.5, pKa2: 11.0, vPrime: 100 },
    stability: { pKs1: 5.0, pKs2: 12.0, n1: 1.5, n2: 2.0 },
    description: 'Alkaline phosphatase, pH opt ≈ 9.3',
  },
];

/* ---------- Temperature Presets ---------- */

export const TEMPERATURE_PRESETS: TemperaturePreset[] = [
  {
    name: 'Mesophile',
    params: {
      dH_act: 60, dS_act: -20,
      dH_inact: 200, dS_inact: 450,
      dH_eq: 100, T_eq: 330,
      dCp_act: -4, T_ref: 298.15,
    },
    description: 'Typical enzyme from a 37 °C organism',
  },
  {
    name: 'Thermophile',
    params: {
      dH_act: 80, dS_act: 10,
      dH_inact: 300, dS_inact: 700,
      dH_eq: 200, T_eq: 365,
      dCp_act: -2, T_ref: 298.15,
    },
    description: 'Heat-loving enzyme, e.g. Taq polymerase',
  },
  {
    name: 'Psychrophile',
    params: {
      dH_act: 40, dS_act: -80,
      dH_inact: 150, dS_inact: 350,
      dH_eq: 80, T_eq: 305,
      dCp_act: -6, T_ref: 298.15,
    },
    description: 'Cold-adapted enzyme, T opt < 25 °C',
  },
];
