import { useEffect, useState } from 'react';
import { profile as fileProfile, type Profile } from '../config/profile';
import { hasSupabase } from './supabase';
import { fetchProfileData } from './remote';

const KEY = 'sc.remote.profile';
const EVENT = 'sc-profile';

const merge = (d: Partial<Profile> | null): Profile =>
  d ? { ...fileProfile, ...d, socialLinks: Array.isArray(d.socialLinks) ? d.socialLinks : fileProfile.socialLinks } : fileProfile;

function readCache(): Partial<Profile> | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? (JSON.parse(s) as Partial<Profile>) : null;
  } catch {
    return null;
  }
}
const writeCache = (d: Partial<Profile>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* bỏ qua */
  }
};

const cached = hasSupabase ? readCache() : null;
const firstFetch = hasSupabase ? fetchProfileData() : Promise.resolve(null);
void firstFetch.then((d) => d && writeCache(d));

/** Intro chờ cái này: lần đầu (chưa có cache) đợi dữ liệu về để không nháy chữ mẫu → chữ thật.
 *  Lần sau có cache là sẵn sàng ngay, dữ liệu mới được cập nhật ngầm. */
export const profileReady: Promise<void> = cached ? Promise.resolve() : firstFetch.then(() => undefined);

/** Gọi sau khi lưu ở trang Admin để trang chủ đổi ngay */
export function announceProfile(d: Partial<Profile>) {
  writeCache(d);
  window.dispatchEvent(new CustomEvent<Partial<Profile>>(EVENT, { detail: d }));
}

/** Hồ sơ hiển thị = file src/config/profile.ts (dự phòng) phủ lên bởi dữ liệu trên Supabase (nếu có) */
export function useRemoteProfile(): Profile {
  const [data, setData] = useState<Partial<Profile> | null>(cached);
  useEffect(() => {
    let alive = true;
    void firstFetch.then((d) => alive && d && setData(d));
    const on = (e: Event) => setData((e as CustomEvent<Partial<Profile>>).detail);
    window.addEventListener(EVENT, on);
    return () => {
      alive = false;
      window.removeEventListener(EVENT, on);
    };
  }, []);
  return merge(data);
}
