/**
 * MND — Client-side news fetching utility.
 * Provides functions to call the /api/news endpoint.
 */

import { CATEGORIES } from './constants';

/**
 * Fetch news articles for a single category and state.
 * @param {string} category - Category id (sports, education, technology, politics)
 * @param {string} state - State value ('all' for national, or state name)
 * @returns {Promise<Array>} Array of article objects
 */
export async function fetchNewsByCategory(category, state = 'all') {
  const params = new URLSearchParams({ category, state });
  const response = await fetch(`/api/news?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${category} news: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Unknown error');
  }

  return data.articles || [];
}

/**
 * Fetch news for all categories in parallel.
 * Returns an object keyed by category id.
 *
 * @param {string} state - State value ('all' or state name)
 * @returns {Promise<Object>} { sports: [...], education: [...], ... }
 */
export async function fetchAllCategories(state = 'all') {
  const results = await Promise.allSettled(
    CATEGORIES.map(async (cat) => {
      const articles = await fetchNewsByCategory(cat.id, state);
      return { categoryId: cat.id, articles };
    })
  );

  const newsData = {};

  results.forEach((result, index) => {
    const categoryId = CATEGORIES[index].id;
    if (result.status === 'fulfilled') {
      newsData[categoryId] = result.value.articles;
    } else {
      console.warn(`Failed to fetch ${categoryId}:`, result.reason);
      newsData[categoryId] = [];
    }
  });

  return newsData;
}
