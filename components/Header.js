import StateSelector from './StateSelector';

export default function Header({ selectedState, onStateChange }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-logo">MND</div>
          <div className="brand-tagline">Multilingual News Digest</div>
        </div>
        <div className="header-controls">
          <StateSelector selectedState={selectedState} onStateChange={onStateChange} />
          <div className="lang-placeholder" title="Coming soon">
            <span className="lang-icon">🌐</span>
            <span className="lang-label">EN</span>
          </div>
        </div>
      </div>
    </header>
  );
}
