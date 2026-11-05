import type { Profile } from '../config/profile';
import type { Project } from '../config/projects';
import { getClient, restGet } from './supabase';
import { sanitizeProject } from './projectStore';

const toRow = (p: Project) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  url: p.url,
  repo: p.repo ?? null,
  tags: p.tags,
  status: p.status,
  pinned: !!p.pinned,
  updated: p.updated ?? null,
  updated_at: new Date().toISOString(),
});

export async function fetchProfileData(): Promise<Partial<Profile> | null> {
  const rows = await restGet<{ data: Partial<Profile> }[]>('site_profile?id=eq.1&select=data');
  const d = rows?.[0]?.data;
  return d && typeof d === 'object' && Object.keys(d).length > 0 ? d : null;
}

export async function fetchProjects(): Promise<Project[] | null> {
  const rows = await restGet<unknown[]>('projects?select=*&order=updated_at.desc');
  if (!rows) return null;
  return rows.map(sanitizeProject).filter((p): p is Project => !!p);
}

export async function saveProfileData(data: Partial<Profile>): Promise<string | null> {
  const c = await getClient();
  const { error } = await c.from('site_profile').upsert({ id: 1, data, updated_at: new Date().toISOString() });
  return error ? error.message : null;
}

/** Ghi thay đổi: thêm/sửa (upsert) + xoá những id không còn trong danh sách mới */
export async function syncProjects(prev: Project[], next: Project[]): Promise<string | null> {
  const c = await getClient();
  const before = new Map(prev.map((p) => [p.id, JSON.stringify(p)]));
  const changed = next.filter((p) => before.get(p.id) !== JSON.stringify(p));
  const nextIds = new Set(next.map((p) => p.id));
  const removed = prev.filter((p) => !nextIds.has(p.id)).map((p) => p.id);
  if (removed.length) {
    const { error } = await c.from('projects').delete().in('id', removed);
    if (error) return error.message;
  }
  if (changed.length) {
    const { error } = await c.from('projects').upsert(changed.map(toRow));
    if (error) return error.message;
  }
  return null;
}
