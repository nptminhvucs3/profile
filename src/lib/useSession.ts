import { useEffect, useState } from 'react';
import { getClient, hasSupabase, maybeSignedIn } from './supabase';

/**
 * Trạng thái đăng nhập của chủ web.
 * `eager = true` (trang Admin): luôn tải thư viện đăng nhập.
 * `eager = false`: chỉ tải khi trình duyệt đã có phiên lưu sẵn → khách bình thường không tốn thêm gì.
 */
export function useSession(eager: boolean) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(hasSupabase && (eager || maybeSignedIn()));

  useEffect(() => {
    if (!hasSupabase || !(eager || maybeSignedIn())) return;
    let off = () => {};
    let alive = true;
    void getClient().then((c) => {
      void c.auth.getSession().then(({ data }) => {
        if (!alive) return;
        setEmail(data.session?.user.email ?? null);
        setLoading(false);
      });
      const { data } = c.auth.onAuthStateChange((_e, s) => alive && setEmail(s?.user.email ?? null));
      off = () => data.subscription.unsubscribe();
    });
    return () => {
      alive = false;
      off();
    };
  }, [eager]);

  return {
    email,
    loading,
    signIn: async (mail: string, password: string): Promise<string | null> => {
      const c = await getClient();
      const { error } = await c.auth.signInWithPassword({ email: mail.trim(), password });
      return error ? error.message : null;
    },
    signOut: async () => {
      const c = await getClient();
      await c.auth.signOut();
    },
  };
}
