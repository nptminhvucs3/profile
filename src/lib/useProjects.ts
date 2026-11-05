import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project } from '../config/projects';
import { clearLocal, loadLocal, saveLocal, sanitizeList } from './projectStore';
import { hasSupabase } from './supabase';
import { fetchProjects, syncProjects } from './remote';

const CACHE = 'sc.remote.projects';
const readCache = (): Project[] | null => {
  try {
    const s = localStorage.getItem(CACHE);
    return s ? sanitizeList(JSON.parse(s)) : null;
  } catch {
    return null;
  }
};
const writeCache = (l: Project[]) => {
  try {
    localStorage.setItem(CACHE, JSON.stringify(l));
  } catch {
    /* bỏ qua */
  }
};

/**
 * Danh sách dự án hiển thị:
 *  • Có Supabase: lấy từ Supabase (có cache để mở là thấy ngay), ghi trực tiếp lên Supabase khi bạn đã đăng nhập.
 *    Bảng còn trống / lỗi mạng → dùng danh sách dự phòng trong src/config/projects.ts.
 *  • Không có Supabase: như cũ — bản sửa lưu trong trình duyệt hoặc danh sách trong file.
 */
export function useProjects(base: Project[], localEnabled: boolean) {
  const [override, setOverride] = useState<Project[] | null>(() => (!hasSupabase && localEnabled ? loadLocal() : null));
  const [remote, setRemote] = useState<Project[] | null>(() => (hasSupabase ? readCache() : null));
  const [saveError, setSaveError] = useState('');
  const items = hasSupabase ? (remote && remote.length > 0 ? remote : base) : (override ?? base);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const load = useCallback(async () => {
    const list = await fetchProjects();
    if (list) {
      setRemote(list);
      writeCache(list);
    }
  }, []);
  useEffect(() => {
    if (hasSupabase) void load();
  }, [load]);

  const commit = useCallback(
    (next: Project[]) => {
      const prev = itemsRef.current;
      if (hasSupabase) {
        setRemote(next);
        writeCache(next);
        setSaveError('');
        void syncProjects(prev, next).then((err) => {
          if (err) {
            setSaveError(err);
            void load(); // ghi thất bại → trả lại đúng dữ liệu đang có trên Supabase
          }
        });
      } else {
        setOverride(next);
        setSaveError(saveLocal(next) ? '' : 'blocked');
      }
    },
    [load],
  );

  return {
    items,
    remote: hasSupabase,
    isLocal: !hasSupabase && override !== null,
    saveError,
    add: (p: Project) => commit([...items, p]),
    update: (id: string, p: Project) => commit(items.map((it) => (it.id === id ? p : it))),
    remove: (id: string) => commit(items.filter((it) => it.id !== id)),
    replaceAll: (list: Project[]) => commit(list),
    reset: () => {
      clearLocal();
      setOverride(null);
      setSaveError('');
    },
  };
}
