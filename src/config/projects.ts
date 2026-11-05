/**
 * ============================================================
 *  DANH SÁCH DỰ ÁN — chỉ cần sửa file này để thêm / sửa / xóa dự án.
 *
 *  Thêm dự án: copy một khối { ... } bên dưới, dán vào cuối mảng `projects`, đổi nội dung.
 *  (Hoặc mở trang Projects → nút "Add project" → điền form → copy đoạn code sinh sẵn.)
 *  Sắp xếp thế nào cũng được: trang tự sắp theo "pinned", dự án mở gần đây, ngày cập nhật.
 * ============================================================
 */

export type ProjectStatus = 'live' | 'building' | 'paused' | 'archived';

export interface Project {
  /** Định danh duy nhất, không dấu, không khoảng trắng (ví dụ 'task-api') */
  id: string;
  name: string;
  /** Mô tả ngắn 1–2 câu (cũng được dùng để tìm kiếm) */
  description: string;
  /** Link để truy cập dự án. Để '' nếu chưa có → nút Open bị vô hiệu hóa */
  url: string;
  /** Link mã nguồn (GitHub...). Bỏ trống nếu không có */
  repo?: string;
  /** Thẻ để lọc/tìm, ví dụ ['backend', 'api'] */
  tags: string[];
  /** live = đang chạy · building = đang làm · paused = tạm dừng · archived = lưu trữ */
  status: ProjectStatus;
  /** true = ghim lên đầu danh sách */
  pinned?: boolean;
  /** Ngày cập nhật gần nhất, dạng 'YYYY-MM-DD' (dùng để sắp xếp) */
  updated?: string;
}

/** Chữ hiển thị đầu trang Projects */
export const projectsPage = {
  title: 'Projects',
  subtitle: 'Everything I am running or building — search, filter and jump straight in.',
};

export const projects: Project[] = [
  {
    id: 'soft-cosmic',
    name: 'Soft Cosmic',
    description: 'Trang cá nhân này — nền thiên hà động, React + Vite, triển khai bằng GitHub Pages.',
    url: 'https://your-username.github.io/soft-cosmic',
    repo: 'https://github.com/your-username/soft-cosmic',
    tags: ['frontend', 'react', 'portfolio'],
    status: 'live',
    pinned: true,
    updated: '2026-11-04',
  },
  {
    id: 'task-api',
    name: 'Task API',
    description: 'REST API quản lý công việc: xác thực JWT, phân quyền, tài liệu OpenAPI.',
    url: 'https://api.example.com/docs',
    repo: 'https://github.com/your-username/task-api',
    tags: ['backend', 'api'],
    status: 'live',
    pinned: true,
    updated: '2026-10-20',
  },
  {
    id: 'admin-dashboard',
    name: 'Admin Dashboard',
    description: 'Bảng điều khiển quản trị: biểu đồ, bảng dữ liệu, xuất báo cáo.',
    url: 'http://localhost:5174',
    tags: ['frontend', 'dashboard'],
    status: 'building',
    updated: '2026-11-01',
  },
  {
    id: 'notes-sync',
    name: 'Notes Sync',
    description: 'Ứng dụng ghi chú đồng bộ giữa các thiết bị, hoạt động cả khi offline.',
    url: 'https://notes.example.com',
    tags: ['fullstack', 'pwa'],
    status: 'paused',
    updated: '2026-07-12',
  },
  {
    id: 'old-blog',
    name: 'Old Blog',
    description: 'Blog cá nhân phiên bản cũ, đã lưu trữ để tham khảo.',
    url: '',
    repo: 'https://github.com/your-username/old-blog',
    tags: ['frontend'],
    status: 'archived',
    updated: '2025-03-02',
  },
];
