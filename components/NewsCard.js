export default function NewsCard({ article }) {
  const { title, link, imageUrl, snippet, source, pubDate } = article;

  const handleImageError = (e) => {
    e.target.src = '/fallback-news.svg';
  };

  const getRelativeDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="news-card-link">
      <article className="news-card">
        <img 
          src={imageUrl || '/fallback-news.svg'} 
          alt={title} 
          className="news-card-image"
          onError={handleImageError}
        />
        <div className="news-card-body">
          <h3 className="news-card-title">{title}</h3>
          <p className="news-card-summary">{snippet}</p>
          <div className="news-card-footer">
            <div className="news-card-meta">
              <span className="news-card-source">{source || 'Unknown Source'}</span>
              <span className="news-card-date">{getRelativeDate(pubDate)}</span>
            </div>
            <span className="news-card-readmore">Read more &rarr;</span>
          </div>
        </div>
      </article>
    </a>
  );
}
