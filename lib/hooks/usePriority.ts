import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';

export interface PriorityEntry {
  value: number;
  user_id: string;
  user: { id: string; display_name: string };
}

export function usePriority(wishId: string) {
  const [priorities, setPriorities] = useState<PriorityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('wish_priorities')
      .select('value, user_id, user:users!user_id(id, display_name)')
      .eq('wish_id', wishId);
    if (data) setPriorities(data as PriorityEntry[]);
    setLoading(false);
  }, [wishId]);

  useEffect(() => { load(); }, [load]);

  // Realtime: aggiorna in tempo reale quando il partner vota
  useEffect(() => {
    const channel = supabase
      .channel(`wish_priorities:${wishId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'wish_priorities',
        filter: `wish_id=eq.${wishId}`,
      }, () => { load(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [wishId, load]);

  async function setPriority(userId: string, value: number): Promise<boolean> {
    const { error } = await supabase
      .from('wish_priorities')
      .insert({ wish_id: wishId, user_id: userId, value });
    if (!error) await load();
    return !error;
  }

  const average =
    priorities.length === 2
      ? (priorities[0].value + priorities[1].value) / 2
      : null;

  return { priorities, loading, setPriority, average };
}
