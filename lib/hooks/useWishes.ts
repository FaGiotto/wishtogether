import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { Wish } from '../../types';
import { CategoryKey } from '../../constants/categories';

const SELECT = '*, creator:users!created_by(id, display_name), comments!wish_id(count), wish_priorities!wish_id(value, user_id)';

function sortByPriority(data: Wish[]): Wish[] {
  return [...data].sort((a, b) => {
    const pa = a.wish_priorities ?? [];
    const pb = b.wish_priorities ?? [];
    const bothA = pa.length >= 2;
    const bothB = pb.length >= 2;
    if (bothA && bothB) {
      const avgA = pa.reduce((s, p) => s + p.value, 0) / pa.length;
      const avgB = pb.reduce((s, p) => s + p.value, 0) / pb.length;
      if (avgA !== avgB) return avgB - avgA;
      return 0;
    }
    if (bothA) return -1;
    if (bothB) return 1;
    return 0;
  });
}

export function useWishes(
  coupleId: string | null | undefined,
  category: CategoryKey | 'all',
  onlyDone: boolean = false,
) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingDeletes = useRef<Set<string>>(new Set());

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
      .select(SELECT)
      .eq('couple_id', coupleId)
      .eq('is_done', onlyDone)
      .order('created_at', { ascending: false });

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    let { data, error: err } = await query;

    // Fallback se wish_priorities non esiste ancora nel DB
    if (err) {
      let fallbackQuery = supabase
        .from('wishes')
        .select('*, creator:users!created_by(id, display_name), comments!wish_id(count)')
        .eq('couple_id', coupleId)
        .eq('is_done', onlyDone)
        .order('created_at', { ascending: false });
      if (category !== 'all') fallbackQuery = fallbackQuery.eq('category', category);
      const { data: fallbackData, error: fallbackErr } = await fallbackQuery;
      if (!fallbackErr) {
        data = fallbackData;
        err = null;
      }
    }

    if (err) {
      setError(err.message);
    } else {
      const filtered = ((data as Wish[]) ?? []).filter((w) => !pendingDeletes.current.has(w.id));
      setWishes(sortByPriority(filtered));
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
            let { data } = await supabase.from('wishes').select(SELECT).eq('id', payload.new.id).single();
            if (!data) {
              const { data: fb } = await supabase
                .from('wishes')
                .select('*, creator:users!created_by(id, display_name), comments!wish_id(count)')
                .eq('id', payload.new.id)
                .single();
              data = fb;
            }

            if (data) {
              const wish = data as Wish;
              const matchesCategory = category === 'all' || wish.category === category;
              const matchesDone = wish.is_done === onlyDone;
              if (matchesCategory && matchesDone) {
                setWishes((prev) => {
                  if (prev.some((w) => w.id === wish.id)) return prev;
                  return sortByPriority([wish, ...prev]);
                });
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Wish;
            const matchesCategory = category === 'all' || updated.category === category;
            const matchesDone = updated.is_done === onlyDone;

            setWishes((prev) => {
              if (matchesCategory && matchesDone) {
                return sortByPriority(
                  prev.map((w) => (w.id === updated.id ? { ...w, ...updated } : w))
                );
              } else {
                return prev.filter((w) => w.id !== updated.id);
              }
            });
          } else if (payload.eventType === 'DELETE') {
            pendingDeletes.current.delete(payload.old.id);
            setWishes((prev) => prev.filter((w) => w.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, category, onlyDone]);

  const removeWish = useCallback((id: string) => {
    pendingDeletes.current.add(id);
    setWishes((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return { wishes, loading, error, refresh: fetch, removeWish };
}
