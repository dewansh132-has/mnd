/**
 * MND — Multilingual News Digest
 * Central configuration: categories, Indian states, and app constants.
 */

export const CATEGORIES = [
  { id: 'sports', label: 'Sports', icon: '🏏' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'technology', label: 'Technology', icon: '💻' },
  { id: 'politics', label: 'Politics & Foreign Affairs', icon: '🏛️' },
];

export const INDIAN_STATES = [
  { value: 'all', label: 'All India' },
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
  { value: 'Assam', label: 'Assam' },
  { value: 'Bihar', label: 'Bihar' },
  { value: 'Chhattisgarh', label: 'Chhattisgarh' },
  { value: 'Goa', label: 'Goa' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
  { value: 'Jharkhand', label: 'Jharkhand' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Kerala', label: 'Kerala' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Manipur', label: 'Manipur' },
  { value: 'Meghalaya', label: 'Meghalaya' },
  { value: 'Mizoram', label: 'Mizoram' },
  { value: 'Nagaland', label: 'Nagaland' },
  { value: 'Odisha', label: 'Odisha' },
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Sikkim', label: 'Sikkim' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Tripura', label: 'Tripura' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Uttarakhand', label: 'Uttarakhand' },
  { value: 'West Bengal', label: 'West Bengal' },
  // Union Territories
  { value: 'Andaman and Nicobar Islands', label: 'Andaman & Nicobar Islands' },
  { value: 'Chandigarh', label: 'Chandigarh' },
  { value: 'Dadra and Nagar Haveli and Daman and Diu', label: 'Dadra & Nagar Haveli and Daman & Diu' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Jammu and Kashmir', label: 'Jammu & Kashmir' },
  { value: 'Ladakh', label: 'Ladakh' },
  { value: 'Lakshadweep', label: 'Lakshadweep' },
  { value: 'Puducherry', label: 'Puducherry' },
];

/** Google News RSS search query keywords per category */
export const CATEGORY_KEYWORDS = {
  sports: 'Sports cricket IPL',
  education: 'Education university exam',
  technology: 'Technology startup IT',
  politics: 'Politics government foreign affairs',
};

/** Fallback image path when article has no image */
export const FALLBACK_IMAGE = '/fallback-news.svg';

/** Server-side cache TTL in seconds */
export const CACHE_TTL = 300; // 5 minutes

/** Maximum articles per category */
export const MAX_ARTICLES_PER_CATEGORY = 3;
