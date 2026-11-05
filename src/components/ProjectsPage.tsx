import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Activity, ArrowLeft, Download, FileCode, Pencil, Plus, RotateCcw, Search, Undo2, Upload, X, Check } from 'lucide-react';
import { projects as baseProjects, projectsPage, type Project, type ProjectStatus } from '../config/projects';
import ProjectCard, { STATUS_LABEL, type CheckState } from './ProjectCard';
import ProjectForm from './ProjectForm';
import { useProjects } from '../lib/useProjects';
import { useSession } from '../lib/useSession';
import { hasSupabase } from '../lib/supabase';
import { downloadJson, listToCode, sanitizeList } from '../lib/projectStore';
import { copyText, hostOf, isHttpUrl, markOpened, normalize, pingUrl, readOpened, runPool } from '../lib/utils';
import '../styles/projects.css';

type StatusFilter = 'all' | ProjectStatus;
type SortMode = 'smart' | 'name' | 'updated';

const STATUS_ORDER: ProjectStatus[] = ['live', 'building', 'paused', 'archived'];
const delay = (i: number) => ({ '--i': i }) as CSSProperties;

/** Đặt `allowManage: false` trong projectsPage (projects.ts) để ẩn hoàn toàn nút Manage (và bỏ qua chỉnh sửa lưu trong trình duyệt). Mặc định: bật. */
const ALLOW_MANAGE = (projectsPage as { allowManage?: boolean }).allowManage !== false;

/** Đọc bộ lọc từ địa chỉ (#/projects?q=...&tag=...) để F5 hoặc gửi link vẫn giữ nguyên kết quả */
function readParams() {
  const raw = window.location.hash.split('?')[1] ?? '';
  const p = new URLSearchParams(raw);
  const status = p.get('status') as StatusFilter | null;
  const sort = p.get('sort') as SortMode | null;
  return {
    q: p.get('q') ?? '',
    tag: p.get('tag') ?? '',
    status: status && (status === 'all' || STATUS_ORDER.includes(status)) ? status : ('all' as StatusFilter),
    sort: sort && ['smart', 'name', 'updated'].includes(sort) ? sort : ('smart' as SortMode),
  };
}

export default function ProjectsPage() {
  const initial = useMemo(readParams, []);
  const store = useProjects(baseProjects, ALLOW_MANAGE);
  const items = store.items;
  const session = useSession(false);
  // Có Supabase: chỉ chủ web (đã đăng nhập) mới thấy Manage. Không có: như cũ (theo allowManage).
  const canManage = hasSupabase ? !!session.email : ALLOW_MANAGE;

  const [q, setQ] = useState(initial.q);
  const [tag, setTag] = useState(initial.tag);
  const [status, setStatus] = useState<StatusFilter>(initial.status);
  const [sort, setSort] = useState<SortMode>(initial.sort);
  const [manage, setManage] = useState(false);
  const [form, setForm] = useState<{ mode: 'add' } | { mode: 'edit'; project: Project } | null>(null);
  const [checks, setChecks] = useState<Record<string, CheckState>>({});
  const [opened, setOpened] = useState<Record<string, number>>(readOpened);
  const [undo, setUndo] = useState<{ label: string; prev: Project[] } | null>(null);
  const [note, setNote] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  const undoTimer = useRef(0);

  useEffect(() => {
    alive.current = true;
    titleRef.current?.focus({ preventScroll: true }); // đưa focus vào tiêu đề khi chuyển trang (cho screen reader)
    return () => {
      alive.current = false;
      window.clearTimeout(undoTimer.current);
    };
  }, []);

  // Đồng bộ bộ lọc lên địa chỉ (replaceState: không tạo thêm mục trong lịch sử, không kích hoạt hashchange)
  useEffect(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (tag) p.set('tag', tag);
    if (status !== 'all') p.set('status', status);
    if (sort !== 'smart') p.set('sort', sort);
    const qs = p.toString();
    window.history.replaceState(null, '', `#/projects${qs ? `?${qs}` : ''}`);
  }, [q, tag, status, sort]);

  // Phím tắt: "/" để nhảy vào ô tìm kiếm
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Chỉ mục tìm kiếm: tên + mô tả + thẻ + trạng thái + tên miền, đã bỏ dấu
  const index = useMemo(
    () =>
      new Map(
        items.map((p) => [
          p.id,
          normalize([p.name, p.description, p.tags.join(' '), STATUS_LABEL[p.status], hostOf(p.url)].join(' ')),
        ]),
      ),
    [items],
  );

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of items) for (const t of p.tags) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [items]);

  const statusesPresent = useMemo(() => STATUS_ORDER.filter((s) => items.some((p) => p.status === s)), [items]);

  const visible = useMemo(() => {
    const tokens = normalize(q).split(/\s+/).filter(Boolean);
    const wantTag = normalize(tag);
    const list = items.filter(
      (p) =>
        (status === 'all' || p.status === status) &&
        (!wantTag || p.tags.some((t) => normalize(t) === wantTag)) &&
        tokens.every((t) => (index.get(p.id) ?? '').includes(t)),
    );
    const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'vi');
    list.sort((a, b) => {
      if (sort === 'name') return byName(a, b);
      if (sort === 'updated') return (b.updated ?? '').localeCompare(a.updated ?? '') || byName(a, b);
      // smart: lưu trữ xuống cuối → ghim lên đầu → mở gần đây → mới cập nhật → tên
      return (
        Number(a.status === 'archived') - Number(b.status === 'archived') ||
        Number(!!b.pinned) - Number(!!a.pinned) ||
        (opened[b.id] ?? 0) - (opened[a.id] ?? 0) ||
        (b.updated ?? '').localeCompare(a.updated ?? '') ||
        byName(a, b)
      );
    });
    return list;
  }, [items, q, tag, status, sort, index, opened]);

  const checkOne = useCallback(async (id: string, url: string) => {
    setChecks((c) => ({ ...c, [id]: { state: 'checking' } }));
    const result = await pingUrl(url);
    if (alive.current) setChecks((c) => ({ ...c, [id]: result }));
  }, []);

  const checkVisible = useCallback(async () => {
    const targets = visible.filter((p) => isHttpUrl(p.url));
    await runPool(targets, 4, (p) => checkOne(p.id, p.url));
  }, [visible, checkOne]);

  const summary = useMemo(() => {
    let online = 0;
    let offline = 0;
    for (const p of visible) {
      const c = checks[p.id];
      if (c?.state === 'online') online++;
      else if (c?.state === 'offline') offline++;
    }
    return { online, offline };
  }, [visible, checks]);
  const checking = Object.values(checks).some((c) => c.state === 'checking');

  // --- Chỉnh sửa (Manage) ---
  /** Chạy thay đổi và hiện thanh "Undo" 8 giây (khôi phục lại danh sách trước đó) */
  const withUndo = (label: string, change: () => void) => {
    const prev = items;
    change();
    window.clearTimeout(undoTimer.current);
    setUndo({ label, prev });
    undoTimer.current = window.setTimeout(() => setUndo(null), 8000);
  };
  const doUndo = () => {
    if (!undo) return;
    store.replaceAll(undo.prev);
    window.clearTimeout(undoTimer.current);
    setUndo(null);
  };
  const say = (msg: string) => {
    setNote(msg);
    window.setTimeout(() => setNote(''), 4000);
  };

  const onSaveForm = (p: Project) => {
    if (form?.mode === 'edit') {
      store.update(form.project.id, p);
      say(`Saved “${p.name}”.`);
    } else {
      store.add(p);
      say(`Added “${p.name}”.`);
    }
    setForm(null);
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const list = sanitizeList(JSON.parse(await file.text()));
      if (!list || list.length === 0) throw new Error('empty');
      withUndo(`Imported ${list.length} project${list.length === 1 ? '' : 's'}`, () => store.replaceAll(list));
    } catch {
      say('Could not import: the file is not a valid projects JSON.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const onCopyCode = async () => {
    if (!(await copyText(listToCode(items)))) return;
    setCodeCopied(true);
    window.setTimeout(() => setCodeCopied(false), 2000);
  };

  const filtersActive = !!(q.trim() || tag || status !== 'all');
  const clearFilters = () => {
    setQ('');
    setTag('');
    setStatus('all');
  };
  const toggleTag = (t: string) => setTag((cur) => (cur.toLowerCase() === t.toLowerCase() ? '' : t));

  return (
    <section className="projects" aria-labelledby="projects-title">
      <div className="projects__head reveal" style={delay(0)}>
        <a className="projects__back" href="#/">
          <ArrowLeft size={15} aria-hidden="true" /> Back to profile
        </a>
        <h1 id="projects-title" ref={titleRef} tabIndex={-1}>
          {projectsPage.title}
        </h1>
        <p className="projects__sub">{projectsPage.subtitle}</p>
      </div>

      <div className="pbar reveal" style={delay(1)} role="search">
        <label className="psearch">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search projects</span>
          <input
            ref={searchRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (q) setQ('');
                else (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Search name, tag, description…"
            autoComplete="off"
            spellCheck={false}
          />
          {q ? (
            <button type="button" className="psearch__clear" onClick={() => setQ('')} aria-label="Clear search">
              <X size={15} aria-hidden="true" />
            </button>
          ) : (
            <kbd className="psearch__kbd" aria-hidden="true">
              /
            </kbd>
          )}
        </label>

        <label className="pselect">
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
            <option value="all">All status</option>
            {statusesPresent.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="pselect">
          <span className="sr-only">Sort projects</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
            <option value="smart">Smart order</option>
            <option value="updated">Recently updated</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>

        <button type="button" className="pbtn" onClick={checkVisible} disabled={checking || visible.length === 0} title="Ping every shown project to see which ones respond">
          <Activity size={15} aria-hidden="true" /> {checking ? 'Checking…' : 'Check status'}
        </button>
        {canManage && (
          <button
            type="button"
            className={`pbtn${manage ? ' is-on' : ''}`}
            onClick={() => {
              setManage((v) => !v);
              setForm(null);
            }}
            aria-pressed={manage}
          >
            <Pencil size={15} aria-hidden="true" /> {manage ? 'Done' : 'Manage'}
          </button>
        )}
      </div>

      {canManage && manage && (
        <div className="pmanage">
          <div className="pmanage__row">
            <button type="button" className="pbtn pbtn--primary" onClick={() => setForm({ mode: 'add' })}>
              <Plus size={14} aria-hidden="true" /> Add project
            </button>
            <button type="button" className="pbtn pbtn--ghost" onClick={() => downloadJson(items)}>
              <Download size={14} aria-hidden="true" /> Export JSON
            </button>
            <button type="button" className="pbtn pbtn--ghost" onClick={() => fileRef.current?.click()}>
              <Upload size={14} aria-hidden="true" /> Import JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => void onImport(e.target.files?.[0])}
            />
            <button type="button" className="pbtn pbtn--ghost" onClick={onCopyCode} title="Copy the whole list as code to paste into src/config/projects.ts">
              {codeCopied ? <Check size={14} aria-hidden="true" /> : <FileCode size={14} aria-hidden="true" />}
              {codeCopied ? 'Copied!' : 'Copy all as code'}
            </button>
            {store.isLocal && (
              <button
                type="button"
                className="pbtn pbtn--ghost"
                onClick={() => withUndo('Reset to the list in projects.ts', store.reset)}
                title="Discard your edits and go back to the list in src/config/projects.ts"
              >
                <RotateCcw size={14} aria-hidden="true" /> Reset
              </button>
            )}
          </div>
          <p className="pmanage__hint">
            {store.remote
              ? 'Changes are saved to Supabase and visible to everyone right away.'
              : store.isLocal
              ? 'Your edits are saved in this browser only. To make them permanent for everyone: “Copy all as code”, paste it into src/config/projects.ts (replace the existing export const projects), then deploy.'
              : 'Edit, delete or add projects right here. Changes are saved in this browser only until you copy them into src/config/projects.ts.'}
          </p>
          {!!store.saveError && (
            <p className="pmanage__warn" role="alert">
              {store.remote
                ? `Could not save to Supabase: ${store.saveError}. The list was reloaded from the server.`
                : 'This browser blocked saving (private mode?). Your changes will be lost on reload — use Export JSON or Copy all as code.'}
            </p>
          )}
        </div>
      )}

      {form && (
        <ProjectForm
          key={form.mode === 'edit' ? form.project.id : 'new'}
          initial={form.mode === 'edit' ? form.project : undefined}
          existingIds={items.map((p) => p.id)}
          onSave={onSaveForm}
          onCancel={() => setForm(null)}
        />
      )}

      {tagCounts.length > 0 && (
        <ul className="pchips reveal" style={delay(2)} aria-label="Filter by tag">
          <li>
            <button type="button" className={`pchip${!tag ? ' is-active' : ''}`} onClick={() => setTag('')} aria-pressed={!tag}>
              All <span>{items.length}</span>
            </button>
          </li>
          {tagCounts.map(([t, n]) => {
            const on = tag.toLowerCase() === t.toLowerCase();
            return (
              <li key={t}>
                <button type="button" className={`pchip${on ? ' is-active' : ''}`} onClick={() => toggleTag(t)} aria-pressed={on}>
                  #{t} <span>{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="pcount" aria-live="polite">
        Showing {visible.length} of {items.length} project{items.length === 1 ? '' : 's'}
        {store.isLocal && <span className="pbadge pbadge--inline">Local edits</span>}
        {(summary.online > 0 || summary.offline > 0) && (
          <>
            {' · '}
            <span className="pcount__ok">{summary.online} online</span>
            {summary.offline > 0 && (
              <>
                {' · '}
                <span className="pcount__bad">{summary.offline} no response</span>
              </>
            )}
          </>
        )}
        {filtersActive && (
          <button type="button" className="pcount__clear" onClick={clearFilters}>
            Clear filters
          </button>
        )}
        {note && <span className="pcount__note"> · {note}</span>}
      </p>

      {visible.length > 0 ? (
        <div className="pgrid reveal" style={delay(3)}>
          {visible.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              check={checks[p.id]}
              activeTag={tag}
              onCheck={() => void checkOne(p.id, p.url)}
              onTag={toggleTag}
              onOpened={() => setOpened(markOpened(p.id))}
              manage={canManage && manage}
              onEdit={() => setForm({ mode: 'edit', project: p })}
              onDelete={() => withUndo(`Deleted “${p.name}”`, () => store.remove(p.id))}
            />
          ))}
        </div>
      ) : (
        <div className="pempty">
          <p>
            {items.length === 0
              ? 'No projects yet.'
              : <>No project matches {q.trim() ? <>“{q.trim()}”</> : 'these filters'}.</>}
          </p>
          {items.length === 0 && canManage ? (
            <button
              type="button"
              className="pbtn"
              onClick={() => {
                setManage(true);
                setForm({ mode: 'add' });
              }}
            >
              <Plus size={14} aria-hidden="true" /> Add your first project
            </button>
          ) : (
            <button type="button" className="pbtn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {hasSupabase && !session.email && (
        <p className="projects__foot">
          <a href="#/admin">Owner sign in</a>
        </p>
      )}

      {undo && (
        <div className="ptoast" role="status">
          <span>{undo.label}</span>
          <button type="button" onClick={doUndo}>
            <Undo2 size={14} aria-hidden="true" /> Undo
          </button>
        </div>
      )}
    </section>
  );
}
