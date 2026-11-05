/** Tiện ích dùng chung cho trang Projects */

/** Chuẩn hóa để tìm kiếm không phân biệt hoa/thường và DẤU tiếng Việt ("du an" khớp "Dự án") */
export const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');

export const isHttpUrl = (url: string): boolean => /^https?:\/\//i.test(url.trim());

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Link chạy trên máy của chính bạn (localhost, mạng LAN) — người khác mở sẽ không vào được */
export function isLocalUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return (
      h === 'localhost' ||
      h.endsWith('.local') ||
      /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0)/.test(h)
    );
  } catch {
    return false;
  }
}

export const slugify = (s: string): string =>
  normalize(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Sao chép vào clipboard (có cách dự phòng cho trang không phải HTTPS) */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* thử cách dự phòng */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-100px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// --- Nhớ dự án nào được mở gần đây (chỉ lưu trong trình duyệt của người xem) ---
const OPENED_KEY = 'sc.projects.opened';

export function readOpened(): Record<string, number> {
  try {
    const v = JSON.parse(localStorage.getItem(OPENED_KEY) || '{}');
    return v && typeof v === 'object' ? (v as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function markOpened(id: string): Record<string, number> {
  const next = { ...readOpened(), [id]: Date.now() };
  try {
    localStorage.setItem(OPENED_KEY, JSON.stringify(next));
  } catch {
    /* bỏ qua: trình duyệt chặn lưu trữ */
  }
  return next;
}

export type PingResult = { state: 'online'; ms: number } | { state: 'offline' } | { state: 'blocked' };

/**
 * Kiểm tra một trang có đang trả lời không. Dùng fetch `no-cors` nên KHÔNG đọc được mã trạng thái:
 * "online" nghĩa là máy chủ có phản hồi (kể cả trang lỗi 404/500), "offline" là không kết nối được/quá hạn.
 */
export async function pingUrl(url: string, timeoutMs = 6000): Promise<PingResult> {
  // Trang HTTPS không được gọi tới http:// (trừ localhost) → không kiểm tra được
  if (window.location.protocol === 'https:' && /^http:\/\//i.test(url) && !isLocalUrl(url)) {
    return { state: 'blocked' };
  }
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  const started = performance.now();
  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal });
    return { state: 'online', ms: Math.round(performance.now() - started) };
  } catch {
    return { state: 'offline' };
  } finally {
    window.clearTimeout(timer);
  }
}

/** Chạy tối đa `limit` việc song song */
export async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const lanes = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  });
  await Promise.all(lanes);
}
