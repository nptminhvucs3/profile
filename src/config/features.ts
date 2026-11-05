/**
 * Cờ bật/tắt tính năng. Giá trị lấy từ file `.env` (xem chú thích trong đó).
 */
export const features = {
  /** Nút chuyển Dark/Light. false = ẩn nút và khóa giao diện ở Dark Mode. */
  themeToggle: import.meta.env.VITE_THEME_TOGGLE === 'true',
} as const;
