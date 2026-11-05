import { useCallback, useEffect, useState } from 'react';
import { features } from '../config/features';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';

/** Theme đã được script trong index.html gán sẵn lên <html> trước khi React chạy */
function readInitialTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function useTheme() {
  // Nút theme đang tắt (features.themeToggle = false) → khóa Dark Mode
  const [theme, setTheme] = useState<Theme>(features.themeToggle ? readInitialTheme : 'dark');

  const apply = useCallback((next: Theme, persist: boolean) => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    root.setAttribute('data-theme', next);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', next === 'light' ? '#DDE1F0' : '#18243B');
    setTheme(next);
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* localStorage có thể bị chặn (private mode) — bỏ qua */
      }
    }
    window.setTimeout(() => root.classList.remove('theme-transition'), 700);
  }, []);

  const toggle = useCallback(() => {
    if (!features.themeToggle) return;
    apply(theme === 'dark' ? 'light' : 'dark', true);
  }, [apply, theme]);

  // Nếu người dùng chưa chọn thủ công, theo dõi thay đổi theme của hệ điều hành
  useEffect(() => {
    if (!features.themeToggle) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e: MediaQueryListEvent) => {
      if (!readStored()) apply(e.matches ? 'light' : 'dark', false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [apply]);

  return { theme, toggle };
}
