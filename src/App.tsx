import { useEffect } from 'react';
import ProjectsPage from './components/ProjectsPage';
import AdminPage from './components/AdminPage';
import { profileReady, useRemoteProfile } from './lib/useRemoteProfile';
import { useHashRoute } from './lib/useHashRoute';
import Starfield from './components/Starfield';
import galaxyUrl from './assets/galaxy-bg.webp';
import Header from './components/Header';
import Profile from './components/Profile';
import SocialLinks from './components/SocialLinks';
import Footer from './components/Footer';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const { theme, toggle } = useTheme();
  const route = useHashRoute();
  const isProjects = route === '/projects';
  const isAdmin = route === '/admin';
  const profile = useRemoteProfile(); // dữ liệu từ Supabase (nếu đã cấu hình), dự phòng: src/config/profile.ts

  // Đổi trang: cuộn lên đầu + đổi tiêu đề tab
  useEffect(() => {
    const original = document.title;
    if (isProjects) document.title = `Projects — ${profile.fullName}`;
    window.scrollTo(0, 0);
    return () => {
      document.title = original;
    };
  }, [isProjects, profile.fullName]);

  // Chờ ảnh nền giải mã xong + font tải xong rồi mới chạy intro → không giật, không nhảy chữ.
  // Có giới hạn 1.6 giây để mạng chậm vẫn hiện trang bình thường.
  useEffect(() => {
    const root = document.documentElement;
    let settle = 0;
    const go = () => {
      root.classList.add('is-ready');
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        root.classList.add('is-settled'); // intro xong → bắt đầu chuyển động nền + sao
        window.dispatchEvent(new Event('cosmic-settled'));
      }, 2000);
    };
    // Chỉ bắt đầu intro khi luồng chính đã rảnh (tối đa chờ 500ms) → không bị rớt khung ở những khung đầu
    const ready = () => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
        .requestIdleCallback;
      if (ric) ric(go, { timeout: 500 });
      else go();
    };
    const img = new Image();
    img.src = galaxyUrl;
    const decoded = img.decode ? img.decode().catch(() => undefined) : Promise.resolve();
    const remote = profileReady.catch(() => undefined); // lần đầu: chờ hồ sơ từ Supabase để không nháy chữ mẫu
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const timer = window.setTimeout(ready, 1600);
    Promise.all([decoded, fonts, remote]).then(() => {
      window.clearTimeout(timer);
      requestAnimationFrame(() => requestAnimationFrame(ready)); // sau khi trình duyệt dựng xong khung đầu
    });
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(settle);
    };
  }, []);

  return (
    <>
      {/* Layer 1: ảnh Galaxy tĩnh → scrim nhẹ → khung trang trí tĩnh
          Layer 2: canvas sao tự chuyển động
          Layer 3: giao diện (.page) */}
      <div className="galaxy" aria-hidden="true">
        <div className="galaxy__drift">
          <div className="galaxy__img" />
          <div className="galaxy__core" />
        </div>
        <div className="galaxy__veil" />
      </div>
      <div className="scrim" aria-hidden="true" />
      <div className="frames" aria-hidden="true">
        <div className="frame frame--a" />
        <div className="frame frame--b" />
      </div>
      <Starfield theme={theme} />

      <div className="page">
        <Header theme={theme} onToggleTheme={toggle} />

        {isAdmin ? (
          <main className="main main--top">
            <AdminPage current={profile} />
          </main>
        ) : isProjects ? (
          <main className="main main--top">
            <ProjectsPage />
          </main>
        ) : (
          <main className="main">
            <div className="content">
              <Profile profile={profile} />
              <SocialLinks links={profile.socialLinks} />
            </div>
          </main>
        )}

        <Footer fullName={profile.fullName} year={profile.year} />
      </div>
    </>
  );
}
