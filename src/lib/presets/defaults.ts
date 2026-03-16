import { Preset } from '../../types';

export const defaultPresets: Preset[] = [
  {
    id: 'default',
    name: 'Default Start',
    description: 'Standard classroom parameter baseline.',
    kinetics: { Vmax: 1.0, KM: 0.5, kcat: 100, e0: 0.01, useMechanistic: false },
    a_in: 1.0,
    v_dot: 1.0,
    target_X: 0.8
  },
  {
    id: 'low-s',
    name: 'Low a_in / KM (First Order)',
    description: 'When initial substrate is far below KM, the rate approaches first-order linear decay.',
    kinetics: { Vmax: 1.0, KM: 50.0, kcat: 100, e0: 0.01, useMechanistic: false },
    a_in: 1.0,  // much smaller than KM (50)
    v_dot: 1.0,
    target_X: 0.8
  },
  {
    id: 'high-s',
    name: 'High a_in / KM (Zero Order)',
    description: 'When initial substrate is far above KM, the enzyme saturates and the rate approaches constant Vmax.',
    kinetics: { Vmax: 1.0, KM: 0.01, kcat: 100, e0: 0.01, useMechanistic: false },
    a_in: 1.0, // much larger than KM
    v_dot: 1.0,
    target_X: 0.8
  },
  {
    id: 'cstr-vs-pfr',
    name: 'CSTR vs PFR at High X',
    description: 'At high conversion, PFR significantly outperforms CSTR due to avoiding dilution.',
    kinetics: { Vmax: 1.0, KM: 0.5, kcat: 100, e0: 0.01, useMechanistic: false },
    a_in: 2.0,
    v_dot: 1.0,
    target_X: 0.95
  },
  {
    id: 'cstr-series',
    name: 'CSTR train vs PFR',
    description: 'As N increases, an equal-volume CSTR cascade approximates a plug-flow profile.',
    kinetics: { Vmax: 1.0, KM: 0.5, kcat: 100, e0: 0.01, useMechanistic: false },
    a_in: 2.0,
    v_dot: 1.0,
    target_X: 0.9
  }
];
