import { Alert } from 'react-native';

export interface SearchResult {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  sourceUrl?: string;
}

export async function searchTMDB(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.EXPO_PUBLIC_TMDB_API_KEY;
  if (!apiKey) {
    Alert.alert('Configurazione mancante', 'API key TMDB non configurata. Aggiungila in .env come EXPO_PUBLIC_TMDB_API_KEY.');
    return [];
  }

  try {
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=it-IT`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();

    return (json.results ?? [])
      .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 10)
      .map((r: any) => ({
        title: r.title ?? r.name ?? '',
        subtitle: r.release_date?.slice(0, 4) ?? r.first_air_date?.slice(0, 4) ?? r.media_type === 'tv' ? 'Serie TV' : 'Film',
        imageUrl: r.poster_path ? `https://image.tmdb.org/t/p/w200${r.poster_path}` : undefined,
        sourceUrl: `https://www.themoviedb.org/${r.media_type}/${r.id}`,
      }));
  } catch {
    return [];
  }
}
