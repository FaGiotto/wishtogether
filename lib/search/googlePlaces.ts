import { Alert } from 'react-native';
import { SearchResult } from './tmdb';

export async function searchGooglePlaces(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;
  if (!apiKey) {
    Alert.alert('Configurazione mancante', 'API key Google Places non configurata. Aggiungila in .env come EXPO_PUBLIC_GOOGLE_PLACES_KEY.');
    return [];
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();

    return (json.results ?? [])
      .slice(0, 10)
      .map((r: any) => {
        const photoRef = r.photos?.[0]?.photo_reference;
        const imageUrl = photoRef
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${photoRef}&key=${apiKey}`
          : undefined;
        return {
          title: r.name ?? '',
          subtitle: r.formatted_address ?? '',
          imageUrl,
          sourceUrl: r.url ?? undefined,
        };
      });
  } catch {
    return [];
  }
}
