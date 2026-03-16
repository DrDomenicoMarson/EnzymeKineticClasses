/**
 * Renders the overview and quick-start content for the simulator.
 *
 * @returns The overview tab content.
 */
export function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Enzyme Reactor Simulator</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Welcome to the interactive simulator for teaching enzyme reactor design. 
          This application explores the interaction between <strong>Michaelis–Menten kinetics</strong> and 
          classic ideal reactor models (Batch, CSTR, PFR) without product inhibition or enzyme deactivation.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Notation</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li><strong>a</strong> — Substrate concentration (mol/L)</li>
          <li><strong>v(a)</strong> — Reaction rate (mol/L·min)</li>
          <li><strong>X</strong> — Conversion (-)</li>
          <li><strong>Q</strong> — Volumetric flow rate (L/min)</li>
          <li><strong>τ</strong> — Residence time (min)</li>
          <li><strong>KM, Vmax</strong> — Michaelis-Menten kinetic parameters</li>
        </ul>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-3">Desktop-First Layout</h3>
          <p className="text-sm text-gray-700 mb-4">
            The interface is optimized for wide desktop and projector screens, with room for control panels,
            plots, and engineering notes to coexist without hiding key information.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-3">Presets / Scenarios</h3>
          <p className="text-sm text-gray-700 mb-4">
            Use the preset scenarios menu above to load specific academic teaching cases, such as 
            the zero-order or first-order limits of Michaelis-Menten kinetics, or CSTR vs PFR comparisons.
          </p>
        </div>
      </div>
    </div>
  );
}
