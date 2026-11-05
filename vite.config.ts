import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' dùng đường dẫn tương đối nên chạy đúng cả với
//   - https://<user>.github.io/            (user site)
//   - https://<user>.github.io/<repo>/     (project site)
// Không cần sửa khi đổi tên repository.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
