# Soft Cosmic — Personal Profile Website

Trang cá nhân phong cách **Soft Cosmic / Muted Galaxy**: nền ngân hà xanh – tím, tinh vân trôi chậm, sao nhấp nháy và tự trôi, sao băng hiếm. Nút Dark/Light đang tạm ẩn (giao diện Dark cố định). Thuần front-end (React + TypeScript + Vite), triển khai miễn phí bằng GitHub Pages.

## Tính năng

- Nền Galaxy: ảnh độ nét cao (WebP 2880×1800, ~600 KB) có chuyển động tinh vân tự động rất chậm (chỉ transform/opacity, không méo ảnh) + 1 canvas sao trong suốt phía trên (sao nhỏ, sao sáng nhấp nháy, sao tự trôi chậm, sao băng) — hoàn toàn không phụ thuộc chuột
- Font tự host (có tiếng Việt), không gọi CDN ngoài
- Tối ưu: một vòng `requestAnimationFrame`, dừng khi tab ẩn, giảm mật độ sao trên mobile, hỗ trợ `prefers-reduced-motion`
- Dark Mode đang được khóa cố định; code Light Mode + nút chuyển theme vẫn còn, bật lại bằng cờ `VITE_THEME_TOGGLE` (xem mục “Bật/tắt nút Dark/Light”)
- Layout căn trái trên desktop, tự căn giữa trên mobile (mobile first)
- Toàn bộ thông tin cá nhân nằm trong **một file**: `src/config/profile.ts`

## 1. Cài đặt Node.js và npm

Tải Node.js bản LTS (≥ 18, khuyến nghị 20) tại <https://nodejs.org>. npm đi kèm theo. Kiểm tra:

```bash
node -v
npm -v
```

## 2. Clone Repository

```bash
git clone https://github.com/<username>/<repo>.git
cd <repo>
```

## 3. Cài đặt dependencies

```bash
npm install
```

## 4. Chạy local

```bash
npm run dev
```

Mở địa chỉ hiển thị trong terminal (thường là <http://localhost:5173>).

## 5. Build

```bash
npm run build      # kết quả nằm trong thư mục dist/
npm run preview    # xem thử bản build
```

## 6. Thay đổi thông tin cá nhân

Mở `src/config/profile.ts` và sửa: `fullName`, `nickname`, `greeting`, `title`, `bio`, `bioHighlight`, `slogan`, `status`, `location`, `email`, `year`.

- `greeting`: lời chào đứng trước tên (mặc định `"Hi, I'm"`). Để `''` nếu chỉ muốn hiện tên.
- `bioHighlight`: cụm từ trong `bio` được in đậm (phải nằm nguyên văn trong bio). Để `''` nếu không dùng.
- Không muốn hiển thị mục nào (slogan, status, location) thì để chuỗi rỗng `''` hoặc xóa dòng đó (với `slogan`, `location`).
- Đổi tiêu đề tab và mô tả SEO/Open Graph trong `index.html` (`<title>`, `description`, `og:title`, `og:description`).

## 7. Thay đổi avatar

1. Đặt ảnh vào `public/avatar/` (ví dụ `me.jpg`, nên là ảnh vuông ~400×400px, dưới 150 KB).
2. Sửa trong `src/config/profile.ts`:

```ts
avatar: 'avatar/me.jpg',
```

## 8. Thay đổi social links

Trong `socialLinks` của `src/config/profile.ts`, mỗi liên kết gồm `id`, `name`, `url`, `icon`, `enabled`:

- **Bật/tắt**: đặt `enabled: true / false`.
- **Kiểu hiển thị**: `featured: true` (hoặc bỏ trống) = nút lớn dạng viên thuốc có tên; `featured: false` = icon tròn nhỏ ở hàng dưới (tên hiện khi rê chuột). Thứ tự trong mảng quyết định thứ tự hiển thị trong từng nhóm.
- **Chưa có link**: để `url: ''` — nút hiển thị mờ và không điều hướng.
- **Thêm mạng xã hội mới**: thêm một object mới vào mảng. Nếu cần icon mới, thêm tên vào `SocialIconName` (trong `profile.ts`) và ánh xạ tới icon của [Lucide](https://lucide.dev) trong `src/components/SocialButton.tsx`. Có sẵn icon `link` dùng cho mọi website khác.
- **Xóa**: xóa object tương ứng khỏi mảng.
- Link ngoài mở ở tab mới (`target="_blank"`, `rel="noopener noreferrer"`); email dùng `mailto:`.

> Các URL mặc định chỉ là placeholder (`your-username`) — hãy thay bằng tài khoản thật.

## 9. Push code lên GitHub

1. Tạo repository mới trên GitHub (ví dụ `my-space`).
2. Trong thư mục dự án:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

### Bật GitHub Pages (chỉ làm một lần)

1. Vào repository → **Settings** → **Pages**.
2. Ở mục **Build and deployment** → **Source**, chọn **GitHub Actions**.
3. Mỗi lần push lên nhánh `main`, workflow `.github/workflows/deploy.yml` sẽ tự build và deploy.

> Dự án dùng `base: './'` trong `vite.config.ts` nên chạy đúng cả khi repo tên `<username>.github.io` lẫn repo thường (`https://<username>.github.io/<repo>/`). Không cần sửa khi đổi tên repo.

## 10. Kiểm tra kết quả deployment

1. Vào tab **Actions** của repository, chờ workflow *Deploy to GitHub Pages* có dấu tick xanh (khoảng 1–2 phút).
2. Mở `https://<username>.github.io/<repo>/` (đường dẫn cũng hiển thị trong **Settings → Pages**).
3. Kiểm tra: nền galaxy hiển thị và chuyển động nhẹ, giao diện Dark ổn định, DevTools Console không có lỗi.

Nếu workflow lỗi ở bước `npm ci`, hãy chắc chắn đã commit file `package-lock.json`.

## Tùy chỉnh màu sắc

- Biến màu Dark/Light: `src/styles/themes.css` (khối `:root[data-theme='dark']` và `'light'`).
- Màu sao (Dark/Light): hằng `PALETTE` ở đầu `src/components/Starfield.tsx`.
- Số lượng sao: hàm `targetCount` trong `Starfield.tsx` (mặc định: mobile 44, tablet 95, desktop 130).
- Tốc độ sao: trong `createStar()` — `speed` (px/giây, mặc định 3–8 với sao sáng, 4–12 với sao nhỏ, rất chậm). Quỹ đạo nhỏ: `orbitR`, `orbitSpeed`.
- Tần suất sao băng: `nextMeteorAt = time + ...` trong hàm `update()` (desktop 10–22 giây, mobile 22–40 giây).
- Độ sáng của lớp phủ Light Mode: `--veil` trong `themes.css`; lớp làm dịu mép chữ bên trái: `--scrim`; khung hình thoi: `--frame`.

### Ảnh nền Galaxy

Nền dùng ảnh `src/assets/galaxy-bg.webp` (2880×1800, WebP), hiển thị bằng `background-size: cover`, không blur, giữ nguyên màu gốc. Chuyển động tinh vân hoàn toàn tự động (không theo chuột), chỉ dùng `transform`/`opacity` nên chạy trên GPU compositor:

1. **Camera drift** (`.galaxy__drift`): cả ảnh trôi + zoom cực nhẹ trong 150 giây.
2. **Lõi sáng** (`.galaxy__core`, chỉ desktop): một quầng sáng dịu đặt trên đám mây xanh, "thở" chậm; dùng alpha thường (không `mix-blend-mode`).

Cố ý **không** dùng mask / `mix-blend-mode` / `filter` trên các lớp lớn vì đã đo: đó là nguyên nhân làm giật trên máy yếu. Trước đây có thêm hai "mảng sáng" trôi qua nền (dùng blend-mode), đã gỡ bỏ để mọi máy đều mượt.

- Đổi ảnh: ghi đè file `src/assets/galaxy-bg.webp` (nên ≥ 1920×1080, tốt nhất 2560×1440 trở lên, giữ tỉ lệ ngang).
- Chỉnh vùng ảnh hiển thị: `background-position` của `.galaxy__img` trong `themes.css` (có 3 mức: desktop, ≤959px, ≤600px). Ví dụ muốn vùng sáng lệch sang trái thì giảm phần trăm đầu tiên.

### Hiệu ứng nhỏ khác

- **Bokeh xa gần:** 4/7/10 đĩa mờ (mobile/tablet/desktop) trôi cực chậm dưới lớp sao; chỉnh số lượng ở `bokehCount`, độ đậm ở `alpha` trong `createBokeh()` (`Starfield.tsx`).
- **Đồng hồ góc trên phải:** cấu hình `timezone` (IANA, ví dụ `'Asia/Ho_Chi_Minh'`) và `timezoneLabel` trong `src/config/profile.ts`; để `timezone: ''` để ẩn. Cập nhật mỗi phút (`LocalTime.tsx`).
- **Copy email:** nút nhỏ trong nút Email, chỉ hiện khi email đã cấu hình (`CopyEmailButton.tsx`).
- **Nghiêng nút khi hover:** `TiltItem.tsx` (`max` = góc tối đa). Chỉ với chuột, tắt khi `prefers-reduced-motion`.
- **Lõi sáng đám mây, vệ tinh quanh avatar, vệt sáng lướt qua nút:** xem `themes.css` / `global.css` / `animations.css`.

### Hiệu ứng mở trang (intro)

`App.tsx` chờ ảnh nền giải mã xong và font tải xong (tối đa 1,6 giây) rồi mới thêm class `is-ready` lên `<html>`; lúc đó nền hiện dần, sao hiện dần, và các khối nội dung trượt lên tuần tự (`.reveal`, mỗi khối trễ 75ms — chỉnh ở `animations.css`). Chỉ dùng `opacity`/`transform`. Khi bật `prefers-reduced-motion`, mọi thứ hiện ngay.

### Bật/tắt nút Dark/Light

File `.env` (đọc lúc build, GitHub Actions cũng dùng): `VITE_THEME_TOGGLE=false` → ẩn nút và khóa Dark; đổi thành `true` rồi build lại để bật lại nút, lưu LocalStorage và theo hệ điều hành như trước. Cờ nằm ở `src/config/features.ts`.

### Starfield (lớp sao)

Một canvas trong suốt đặt trên ảnh, hoàn toàn độc lập với chuột: mỗi sao tự trôi chậm theo hướng riêng, quay quỹ đạo nhỏ và nhấp nháy theo nhịp riêng; thỉnh thoảng có sao băng. Canvas tự dừng khi tab bị ẩn, tự co giãn theo cửa sổ (ResizeObserver), và đổi Dark/Light không làm khởi tạo lại canvas. Nếu hệ điều hành bật "giảm chuyển động", sao đứng yên.

## Open Graph image (tùy chọn)

Để link chia sẻ có ảnh xem trước, thêm `public/og-image.png` (1200×630) rồi bỏ comment hai thẻ `og:url` và `og:image` trong `index.html` với URL thật sau khi deploy.

## Cấu trúc thư mục

```
src/
├── assets/       galaxy-bg.webp (ảnh nền Galaxy)
├── components/   Header, Profile, SocialLinks, SocialButton, ThemeToggle, Starfield, Footer
├── config/       profile.ts   ← sửa thông tin cá nhân ở đây
├── hooks/        useTheme.ts
├── styles/       global.css, themes.css, animations.css
├── App.tsx
└── main.tsx
public/           favicon.svg, avatar/
.github/workflows/deploy.yml
```
