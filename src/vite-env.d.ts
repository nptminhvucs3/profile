/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'true' = bật nút chuyển Dark/Light; mọi giá trị khác = tắt (khóa Dark Mode) */
  readonly VITE_THEME_TOGGLE?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
