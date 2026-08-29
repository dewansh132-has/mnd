import { INDIAN_STATES } from '@/lib/constants';

export default function StateSelector({ selectedState, onStateChange }) {
  return (
    <div className="state-selector-wrapper">
      <select
        id="state-selector"
        value={selectedState || 'all'}
        onChange={(e) => onStateChange(e.target.value)}
        aria-label="Select state or region"
      >
        {INDIAN_STATES.map((state) => (
          <option key={state.value} value={state.value}>
            {state.label}
          </option>
        ))}
      </select>
    </div>
  );
}
