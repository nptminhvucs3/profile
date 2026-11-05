import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Copy, Save } from 'lucide-react';
import type { Project, ProjectStatus } from '../config/projects';
import { copyText, isHttpUrl, slugify } from '../lib/utils';
import { projectToCode, uniqueId } from '../lib/projectStore';

interface Props {
  /** Có `initial` = sửa dự án đó; không có = thêm mới */
  initial?: Project;
  existingIds: string[];
  onSave: (p: Project) => void;
  onCancel: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

/** Form thêm / sửa dự án. Lưu vào trình duyệt; có thể copy đoạn code để dán vào projects.ts */
export default function ProjectForm({ initial, existingIds, onSave, onCancel }: Props) {
  const editing = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [repo, setRepo] = useState(initial?.repo ?? '');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? 'live');
  const [pinned, setPinned] = useState(!!initial?.pinned);
  const [updated, setUpdated] = useState(initial?.updated ?? today());
  const [copied, setCopied] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLFormElement>(null);

  useEffect(() => {
    root.current?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    nameRef.current?.focus({ preventScroll: true });
  }, []);

  const problems: string[] = [];
  if (!name.trim()) problems.push('Name is required.');
  if (url.trim() && !isHttpUrl(url)) problems.push('URL should start with http:// or https://');
  if (repo.trim() && !isHttpUrl(repo)) problems.push('Repo link should start with http:// or https://');

  const build = (): Project => {
    const others = existingIds.filter((i) => i !== initial?.id);
    const p: Project = {
      id: initial?.id ?? uniqueId(slugify(name), others),
      name: name.trim(),
      description: description.trim(),
      url: url.trim(),
      tags: [...new Set(tags.split(',').map((t) => slugify(t)).filter(Boolean))],
      status,
    };
    if (repo.trim()) p.repo = repo.trim();
    if (pinned) p.pinned = true;
    if (/^\d{4}-\d{2}-\d{2}$/.test(updated)) p.updated = updated;
    return p;
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (problems.length === 0) onSave(build());
  };

  const onCopy = async () => {
    if (!(await copyText(projectToCode(build())))) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <form
      ref={root}
      className="padd"
      onSubmit={submit}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      aria-label={editing ? `Edit ${initial?.name}` : 'Add a project'}
    >
      <h2 className="padd__title">{editing ? 'Edit project' : 'Add project'}</h2>
      <div className="padd__grid">
        <label className="pfield">
          <span>Name</span>
          <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="My new project" required />
        </label>
        <label className="pfield">
          <span>URL (where it runs)</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" />
        </label>
        <label className="pfield pfield--wide">
          <span>Description</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="One or two sentences" />
        </label>
        <label className="pfield">
          <span>Tags (comma separated)</span>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="backend, api" />
        </label>
        <label className="pfield">
          <span>Repo link (optional)</span>
          <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="https://github.com/…" inputMode="url" />
        </label>
        <label className="pfield">
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
            <option value="live">Live</option>
            <option value="building">Building</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="pfield">
          <span>Last updated</span>
          <input type="date" value={updated} onChange={(e) => setUpdated(e.target.value)} />
        </label>
        <label className="pfield pfield--check">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          <span>Pin to the top</span>
        </label>
      </div>

      {problems.length > 0 && (
        <ul className="padd__problems" role="alert">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      <div className="padd__actions">
        <button type="submit" className="pbtn pbtn--primary" disabled={problems.length > 0}>
          <Save size={14} aria-hidden="true" /> {editing ? 'Save changes' : 'Add project'}
        </button>
        <button type="button" className="pbtn pbtn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="pbtn pbtn--ghost" onClick={onCopy} title="Copy this project as code for src/config/projects.ts">
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? 'Copied!' : 'Copy as code'}
        </button>
      </div>
    </form>
  );
}
