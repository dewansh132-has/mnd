export default function ErrorState({ message = 'Something went wrong while fetching news.', onRetry }) {
  return (
    <div className="error-container">
      <div className="error-icon" aria-hidden="true">⚠️</div>
      <p className="error-message">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="error-retry-btn">
          Try Again
        </button>
      )}
    </div>
  );
}
