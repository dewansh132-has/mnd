import NewsCard from './NewsCard';

export default function CategorySection({ category, articles, loading }) {
  return (
    <section className="category-section" id={`category-${category.id}`}>
      <h2 className="category-heading">
        {category.icon && <span aria-hidden="true">{category.icon}</span>}
        {category.label}
      </h2>
      
      {loading ? (
        <div className="news-grid">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      ) : articles && articles.length > 0 ? (
        <div className="news-grid">
          {articles.map((article, index) => (
            <NewsCard key={`${article.link || index}`} article={article} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          No articles found for this category at the moment.
        </div>
      )}
    </section>
  );
}
