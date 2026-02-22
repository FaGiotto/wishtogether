export type CategoryKey = 'places' | 'restaurants' | 'movies' | 'games' | 'events';

export interface Category {
  key: CategoryKey;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { key: 'places', label: 'Posti', icon: 'map-outline', color: '#6C63FF' },
  { key: 'restaurants', label: 'Ristoranti', icon: 'restaurant-outline', color: '#F59E0B' },
  { key: 'movies', label: 'Film/Serie', icon: 'film-outline', color: '#EF4444' },
  { key: 'games', label: 'Videogiochi', icon: 'game-controller-outline', color: '#10B981' },
  { key: 'events', label: 'Eventi', icon: 'calendar-outline', color: '#3B82F6' },
];

export const ALL_CATEGORIES_KEY = 'all';
