import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { Wish } from '../../types';
import { CategoryKey } from '../../constants/categories';

export function useWishes(
  coupleId: string | null | undefined,
  category: CategoryKey | 'all',
  onlyDone: boolean = false,
) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!coupleId) {
      setWishes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from('wishes')
      .select('*, creator:users!created_by(id, display_name)')
      .eq('couple_id', coupleId)
      .eq('is_done', onlyDone)
      .order('created_at', { ascending: false });

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error: err } = await query;

    if (err) {
      setError(err.message);
    } else {
      setWishes((data as Wish[]) ?? []);
    }
    setLoading(false);
  }, [coupleId, category, onlyDone]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!coupleId) return;

    const channel = supabase
      .channel(`wishes:${coupleId}:${category}:${onlyDone}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wishes',
          filter: `couple_id=eq.${coupleId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch il record completo con il join creator
            const { data } = await supabase
              .from('wishes')
              .select('*, creator:users!created_by(id, display_name)')
              .eq('id', payload.new.id)
              .single();

            if (data) {
              const wish = data as Wish;
              const matchesCategory = category === 'all' || wish.category === category;
              const matchesDone = wish.is_done === onlyDone;
              if (matchesCategory && matchesDone) {
                setWishes((prev) => {
                  if (prev.some((w) => w.id === wish.id)) return prev;
                  return [wish, ...prev];
                });
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Wish;
            const matchesCategory = category === 'all' || updated.category === category;
            const matchesDone = updated.is_done === onlyDone;

            setWishes((prev) => {
              if (matchesCategory && matchesDone) {
                // Aggiorna in-place preservando i campi joined
                return prev.map((w) =>
                  w.id === updated.id ? { ...w, ...updated } : w
                );
              } else {
                // Non appartiene più a questa vista → rimuovi
                return prev.filter((w) => w.id !== updated.id);
              }
            });
          } else if (payload.eventType === 'DELETE') {
            setWishes((prev) => prev.filter((w) => w.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, category, onlyDone]);

  return { wishes, loading, error, refresh: fetch };
}
