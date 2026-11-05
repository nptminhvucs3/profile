import type { Project, ProjectStatus } from '../config/projects';
import { slugify } from './utils';

/**
 * Lưu thay đổi dự án NGAY TRONG TRÌNH DUYỆT (localStorage) — trang web tĩnh trên GitHub Pages
 * không có máy chủ để ghi file. Muốn thay đổi thành chính thức cho mọi người:
 * dùng "Copy as code" rồi dán vào src/config/projects.ts.
 */
const KEY = 'sc.projects.v1';
const STATUSES: ProjectStatus[] = ['live', 'building', 'paused', 'archived'];

/** Làm sạch 1 dự án (dùng khi nhập file / đọc localStorage): bỏ trường lạ, ép đúng kiểu */
export function sanitizeProject(raw: unknown): Project | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const name = str(r.name);
  if (!name) return null;
  const id = slugify(str(r.id) || name);
  if (!id) return null;
  const tags = Array.isArray(r.tags) ? r.tags.map((t) => slugify(str(t))).filter(Boolean) : [];
  const p: Project = {
    id,
    name,
    description: str(r.description),
    url: str(r.url),
    tags: [...new Set(tags)],
    status: STATUSES.includes(r.status as ProjectStatus) ? (r.status as ProjectStatus) : 'live',
  };
  const repo = str(r.repo);
  if (repo) p.repo = repo;
  if (r.pinned === true) p.pinned = true;
  const updated = str(r.updated);
  if (/^\d{4}-\d{2}-\d{2}$/.test(updated)) p.updated = updated;
  return p;
}

/** Làm sạch cả danh sách, tự đổi id trùng ("a" → "a-2") */
export function sanitizeList(raw: unknown): Project[] | null {
  if (!Array.isArray(raw)) return null;
  const seen = new Set<string>();
  const out: Project[] = [];
  for (const item of raw) {
    const p = sanitizeProject(item);
    if (!p) continue;
    p.id = uniqueId(p.id, [...seen]);
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

export function uniqueId(base: string, existing: string[]): string {
  const root = base || 'project';
  let id = root;
  let n = 2;
  while (existing.includes(id)) id = `${root}-${n++}`;
  return id;
}

export function loadLocal(): Project[] | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? sanitizeList(JSON.parse(s)) : null;
  } catch {
    return null;
  }
}

export function saveLocal(list: Project[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function clearLocal(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* bỏ qua */
  }
}

const q = (v: string) => `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** Một dự án → đoạn code đúng định dạng của src/config/projects.ts */
export function projectToCode(p: Project): string {
  return [
    '  {',
    `    id: ${q(p.id)},`,
    `    name: ${q(p.name)},`,
    `    description: ${q(p.description)},`,
    `    url: ${q(p.url)},`,
    ...(p.repo ? [`    repo: ${q(p.repo)},`] : []),
    `    tags: [${p.tags.map(q).join(', ')}],`,
    `    status: ${q(p.status)},`,
    ...(p.pinned ? ['    pinned: true,'] : []),
    ...(p.updated ? [`    updated: ${q(p.updated)},`] : []),
    '  },',
  ].join('\n');
}

/** Cả danh sách → phần thân mảng `projects` để dán thay thế trong projects.ts */
export function listToCode(list: Project[]): string {
  return `export const projects: Project[] = [\n${list.map(projectToCode).join('\n')}\n];\n`;
}

export function downloadJson(list: Project[], filename = 'projects.json'): void {
  const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
