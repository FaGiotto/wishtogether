import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { Comment } from '../../types';

export function useComments(wishId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select('*, author:users!user_id(id, display_name)')
      .eq('wish_id', wishId)
      .order('created_at', { ascending: true });
    setComments((data as Comment[]) ?? []);
    setLoading(false);
  }, [wishId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`comments:${wishId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `wish_id=eq.${wishId}`,
        },
        async (payload) => {
          // Fetch with join to get author info
          const { data } = await supabase
            .from('comments')
            .select('*, author:users!user_id(id, display_name)')
            .eq('id', payload.new.id)
            .single();
          if (data) {
            setComments((prev) => {
              if (prev.some((c) => c.id === data.id)) return prev;
              return [...prev, data as Comment];
            });
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `wish_id=eq.${wishId}`,
        },
        (payload) => {
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wishId]);

  const addComment = useCallback(async (text: string, userId: string) => {
    const { error } = await supabase
      .from('comments')
      .insert({ wish_id: wishId, user_id: userId, text: text.trim() });
    return !error;
  }, [wishId]);

  return { comments, loading, addComment };
}
