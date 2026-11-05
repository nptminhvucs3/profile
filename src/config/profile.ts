/**
 * ============================================================
 *  FILE CẤU HÌNH DUY NHẤT CHO THÔNG TIN CÁ NHÂN
 *  Chỉ cần sửa file này để đổi tên, bio, avatar, social links.
 * ============================================================
 */

export type SocialIconName =
  | 'facebook'
  | 'instagram'
  | 'github'
  | 'linkedin'
  | 'tiktok'
  | 'telegram'
  | 'email'
  | 'link'
  | 'projects'; // icon mới → thêm trong SocialButton.tsx
  ;

export interface SocialLink {
  /** Định danh duy nhất */
  id: string;
  /** Tên hiển thị trên nút */
  name: string;
  /** URL liên kết. Để trống '' nếu chưa cấu hình → nút bị vô hiệu hóa, không điều hướng */
  url: string;
  /** Tên icon (xem SocialIconName, thêm icon mới trong SocialButton.tsx) */
  icon: SocialIconName;
  /** false = ẩn hoàn toàn khỏi trang */
  enabled: boolean;
  /**
   * true  = nút lớn dạng viên thuốc (có tên) — dành cho liên kết chính
   * false = icon tròn nhỏ (hiện tên khi rê chuột / đọc bằng screen reader)
   * Mặc định: true
   */
  featured?: boolean;
}

export interface Profile {
  fullName: string;
  nickname: string;
  /** Lời chào đứng trước tên, ví dụ "Hi, I'm". Để '' nếu chỉ muốn hiện tên */
  greeting: string;
  /** Đường dẫn tương đối trong thư mục public/, ví dụ 'avatar/avatar.svg' */
  avatar: string;
  title: string;
  bio: string;
  /** Cụm từ trong bio sẽ được in đậm/nổi bật (phải nằm nguyên văn trong bio). Để '' nếu không dùng */
  bioHighlight: string;
  slogan?: string;
  /** Trạng thái hiển thị dưới avatar. Để '' nếu không muốn hiển thị */
  status: string;
  location?: string;
  /** Múi giờ IANA cho đồng hồ nhỏ ở góc trên phải, ví dụ 'Asia/Ho_Chi_Minh'. Để '' để ẩn đồng hồ */
  timezone?: string;
  /** Nhãn hiển thị cạnh giờ, ví dụ 'Hanoi'. Bỏ trống thì lấy phần trước dấu phẩy của location */
  timezoneLabel?: string;
  email: string;
  /** Năm hiển thị trong chữ trang trí và footer */
  year: number;
  socialLinks: SocialLink[];
}

const email = 'vunhatminh623@gmail.com'; // ← đổi email của bạn (để '' nếu không dùng)

export const profile: Profile = {
  fullName: 'VuNhatMinh',
  nickname: 'Nevam',
  greeting: "Hi, I'm",
  avatar: 'avatar/avt-cat.jpg',
  title: 'Backend Developer | Business Analyst',
  bio: 'Building ideas into reality.',
  bioHighlight: 'ideas into reality',
  slogan: 'Curious mind, endless universe.',
  status: 'Open to new opportunities',
  location: 'Hanoi, Vietnam',
  timezone: 'Asia/Ho_Chi_Minh',
  timezoneLabel: 'Hanoi',
  email,
  year: 2026,

  socialLinks: [
    // --- Liên kết chính (nút lớn) ---
    {
      id: 'github',
      name: 'GitHub',
      url: 'https://github.com/nptminhvucs3',
      icon: 'github',
      enabled: true,
      featured: true,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/minh-vu-nhat-1126083a1',
      icon: 'linkedin',
      enabled: true,
      featured: true,
    },
    {
      id: 'email',
      name: 'Email',
      url: email ? `mailto:${email}` : '',
      icon: 'email',
      enabled: true,
      featured: true,
    },

    // --- Liên kết phụ (icon tròn) ---
    {
      id: 'facebook',
      name: 'Facebook',
      url: 'https://www.facebook.com/vnv.3m',
      icon: 'facebook',
      enabled: true,
      featured: false,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      url: 'https://www.instagram.com/mi_3vn',
      icon: 'instagram',
      enabled: true,
      featured: false,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      url: 'https://www.tiktok.com/@your.username',
      icon: 'tiktok',
      enabled: true,
      featured: false,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      url: 'https://t.me/your_username',
      icon: 'telegram',
      enabled: true,
      featured: false,
    },
    {
      id: 'projects',
      name: 'Projects',
      url: '#/projects', // trang Projects (liên kết nội bộ, mở cùng tab)
      icon: 'projects',
      enabled: true,
      featured: false,
    },
  ],
};
