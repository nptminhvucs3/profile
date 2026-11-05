import type { SupabaseClient } from '@supabase/supabase-js';

const URL_ = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/** Đã cấu hình Supabase chưa (có .env). Chưa → web chạy hoàn toàn bằng file trong src/config như cũ. */
export const hasSupabase = Boolean(URL_ && KEY);

/** ĐỌC công khai bằng fetch thuần (không kéo thư viện supabase-js vào bundle chính → trang vẫn nhẹ) */
export async function restGet<T>(path: string, timeoutMs = 5000): Promise<T | null> {
  if (!hasSupabase) return null;
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${URL_}/rest/v1/${path}`, {
      headers: KEY.startsWith('sb_') ? { apikey: KEY } : { apikey: KEY, Authorization: `Bearer ${KEY}` },
      signal: ctrl.signal,
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(t);
  }
}

let clientPromise: Promise<SupabaseClient> | null = null;
/** GHI + đăng nhập: chỉ tải supabase-js khi thật sự cần (trang Admin hoặc khi đã đăng nhập từ trước) */
export function getClient(): Promise<SupabaseClient> {
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL_, KEY, {
      // Web dùng hash-routing (#/projects) → không để thư viện đọc token từ phần # của địa chỉ
      auth: { detectSessionInUrl: false, persistSession: true, autoRefreshToken: true },
    }),
  );
  return clientPromise;
}

/** Có phiên đăng nhập đã lưu trong trình duyệt không (kiểm tra rẻ, chưa cần tải thư viện) */
export function maybeSignedIn(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? '';
      if (k.startsWith('sb-') && k.endsWith('-auth-token')) return true;
    }
  } catch {
    /* bỏ qua */
  }
  return false;
}
