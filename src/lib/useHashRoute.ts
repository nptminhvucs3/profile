import { useEffect, useState } from 'react';

/**
 * Router tối giản dựa trên "#" (hash) — chạy được trên GitHub Pages mà không cần cấu hình máy chủ.
 *   #/            → trang Profile
 *   #/projects    → trang Projects  (có thể kèm ?q=...&tag=...)
 */
export function useHashRoute(): string {
  const read = () => (window.location.hash.replace(/^#/, '').split('?')[0].replace(/\/+$/, '') || '/');
  const [path, setPath] = useState(read);
  useEffect(() => {
    const onChange = () => setPath(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}
