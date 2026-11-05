import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, LogOut, Save, Upload, RotateCcw } from 'lucide-react';
import { profile as fileProfile, type Profile } from '../config/profile';
import { projects as fileProjects } from '../config/projects';
import { hasSupabase } from '../lib/supabase';
import { useSession } from '../lib/useSession';
import { saveProfileData, syncProjects, fetchProjects } from '../lib/remote';
import { announceProfile } from '../lib/useRemoteProfile';
import '../styles/projects.css';

/** Trang quản trị cho chủ web: đăng nhập + sửa hồ sơ (profile) + đẩy dữ liệu từ file lên Supabase */
export default function AdminPage({ current }: { current: Profile }) {
  const s = useSession(true);
  const [mail, setMail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [json, setJson] = useState(() => JSON.stringify(current, null, 2));
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const prev = document.title;
    document.title = 'Admin';
    return () => {
      document.title = prev;
    };
  }, []);

  const say = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(''), 5000);
  };

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr((await s.signIn(mail, pw)) ?? '');
    setBusy(false);
    setPw('');
  };

  const saveProfile = async () => {
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      return say('JSON chưa hợp lệ — kiểm tra dấu phẩy / ngoặc kép.');
    }
    const d = data as Partial<Profile>;
    if (!d || typeof d !== 'object' || typeof d.fullName !== 'string' || !Array.isArray(d.socialLinks)) {
      return say('Thiếu "fullName" (chuỗi) hoặc "socialLinks" (danh sách).');
    }
    const e = await saveProfileData(d);
    if (e) return say(`Lưu lỗi: ${e}`);
    announceProfile(d);
    say('Đã lưu hồ sơ lên Supabase.');
  };

  const seedProjects = async () => {
    const before = (await fetchProjects()) ?? [];
    const e = await syncProjects(before, fileProjects);
    say(e ? `Lỗi: ${e}` : `Đã đẩy ${fileProjects.length} dự án từ projects.ts lên Supabase.`);
  };

  return (
    <section className="projects" aria-labelledby="admin-title">
      <div className="projects__head reveal">
        <a className="projects__back" href="#/">
          <ArrowLeft size={15} aria-hidden="true" /> Back to profile
        </a>
        <h1 id="admin-title">Admin</h1>
        <p className="projects__sub">Sửa thông tin cá nhân và dữ liệu lưu trên Supabase.</p>
      </div>

      {!hasSupabase ? (
        <div className="padd">
          <p>
            Chưa cấu hình Supabase. Tạo file <code>.env.local</code> (xem <code>.env.example</code>), điền{' '}
            <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_ANON_KEY</code>, rồi chạy lại <code>npm run dev</code>.
          </p>
        </div>
      ) : s.loading ? (
        <p className="pcount">Loading…</p>
      ) : !s.email ? (
        <form className="padd" onSubmit={login}>
          <h2 className="padd__title">Sign in</h2>
          <div className="padd__grid">
            <label className="pfield">
              <span>Email</span>
              <input type="email" value={mail} onChange={(e) => setMail(e.target.value)} autoComplete="username" required />
            </label>
            <label className="pfield">
              <span>Password</span>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required />
            </label>
          </div>
          {err && (
            <p className="pmanage__warn" role="alert">
              {err}
            </p>
          )}
          <div className="padd__actions">
            <button type="submit" className="pbtn pbtn--primary" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="pmanage">
            <div className="pmanage__row">
              <span className="pmanage__hint" style={{ margin: 0 }}>
                Signed in as <strong>{s.email}</strong>
              </span>
              <button type="button" className="pbtn pbtn--ghost" onClick={() => void s.signOut()} style={{ marginLeft: 'auto' }}>
                <LogOut size={14} aria-hidden="true" /> Sign out
              </button>
            </div>
            <p className="pmanage__hint">
              Dự án: sửa/xoá/thêm trực tiếp ở trang <a href="#/projects">Projects</a> (nút Manage), tự lưu lên Supabase.
            </p>
          </div>

          <div className="padd">
            <h2 className="padd__title">Profile (JSON)</h2>
            <p className="pmanage__hint">
              Toàn bộ thông tin cá nhân: tên, bio, avatar (đường dẫn trong <code>public/</code> hoặc link https), liên kết mạng xã hội, email, múi giờ…
              Trường bỏ trống sẽ lấy theo <code>src/config/profile.ts</code>.
            </p>
            <textarea
              className="pcode"
              value={json}
              onChange={(e) => setJson(e.target.value)}
              spellCheck={false}
              rows={22}
              aria-label="Profile JSON"
            />
            <div className="padd__actions">
              <button type="button" className="pbtn pbtn--primary" onClick={() => void saveProfile()}>
                <Save size={14} aria-hidden="true" /> Save profile
              </button>
              <button type="button" className="pbtn pbtn--ghost" onClick={() => setJson(JSON.stringify(fileProfile, null, 2))}>
                <RotateCcw size={14} aria-hidden="true" /> Load from profile.ts
              </button>
              <button type="button" className="pbtn pbtn--ghost" onClick={() => void seedProjects()} title="Lần đầu: đẩy danh sách trong projects.ts lên Supabase">
                <Upload size={14} aria-hidden="true" /> Upload projects.ts → Supabase
              </button>
            </div>
            {msg && (
              <p className="pcount__note" role="status" style={{ marginTop: '0.8rem' }}>
                {msg}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
