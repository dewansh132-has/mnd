'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import CategorySection from '@/components/CategorySection';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import Footer from '@/components/Footer';
import { CATEGORIES, INDIAN_STATES } from '@/lib/constants';
import { fetchAllCategories } from '@/lib/fetchNews';

export default function HomePage() {
  const [selectedState, setSelectedState] = useState('all');
  const [newsData, setNewsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNews = useCallback(async (state) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAllCategories(state);
      setNewsData(data);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError('Something went wrong while fetching the latest news. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch news on mount and when state changes
  useEffect(() => {
    loadNews(selectedState);
  }, [selectedState, loadNews]);

  const handleStateChange = (newState) => {
    setSelectedState(newState);
  };

  const handleRetry = () => {
    loadNews(selectedState);
  };

  // Get display name for selected state
  const selectedStateLabel =
    selectedState === 'all'
      ? 'across India'
      : `from ${INDIAN_STATES.find((s) => s.value === selectedState)?.label || selectedState}`;

  return (
    <>
      <Header selectedState={selectedState} onStateChange={handleStateChange} />

      <main>
        {/* Page Title */}
        <div className="page-title-section">
          <h1 className="page-title">Latest News</h1>
          <p className="page-subtitle">Latest news {selectedStateLabel}</p>
        </div>

        {/* Loading State */}
        {loading && <LoadingState />}

        {/* Error State */}
        {error && !loading && <ErrorState message={error} onRetry={handleRetry} />}

        {/* News Categories */}
        {!loading && !error && (
          <>
            {CATEGORIES.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                articles={newsData[category.id] || []}
                loading={false}
              />
            ))}
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
