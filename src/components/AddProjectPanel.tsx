import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { ProjectStatus } from '../config/projects';
import { copyText, isHttpUrl, slugify } from '../lib/utils';

interface Props {
  existingIds: string[];
}

const q = (v: string) => `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/**
 * Trang web không có máy chủ nên không thể "lưu" dự án mới từ trình duyệt.
 * Bảng này giúp bạn điền form → tạo sẵn đoạn code đúng định dạng → dán vào src/config/projects.ts.
 */
export default function AddProjectPanel({ existingIds }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [repo, setRepo] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('live');
  const [pinned, setPinned] = useState(false);
  const [copied, setCopied] = useState(false);

  const id = slugify(name) || 'project-id';
  const today = new Date().toISOString().slice(0, 10);
  const tagList = tags
    .split(',')
    .map((t) => slugify(t))
    .filter(Boolean);

  const problems: string[] = [];
  if (existingIds.includes(id)) problems.push(`The id "${id}" already exists — rename the project or edit the id.`);
  if (url.trim() && !isHttpUrl(url)) problems.push('URL should start with http:// or https://');
  if (repo.trim() && !isHttpUrl(repo)) problems.push('Repo link should start with http:// or https://');

  const snippet = useMemo(
    () =>
      [
        '  {',
        `    id: ${q(id)},`,
        `    name: ${q(name.trim() || 'Project name')},`,
        `    description: ${q(description.trim())},`,
        `    url: ${q(url.trim())},`,
        ...(repo.trim() ? [`    repo: ${q(repo.trim())},`] : []),
        `    tags: [${tagList.map(q).join(', ')}],`,
        `    status: ${q(status)},`,
        ...(pinned ? ['    pinned: true,'] : []),
        `    updated: ${q(today)},`,
        '  },',
      ].join('\n'),
    [id, name, description, url, repo, tagList.join(','), status, pinned, today], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onCopy = async () => {
    if (!(await copyText(snippet))) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="padd" aria-label="Add a project">
      <p className="padd__intro">
        Fill this in, copy the generated code and paste it at the end of the <code>projects</code> list in{' '}
        <code>src/config/projects.ts</code>.
      </p>
      <div className="padd__grid">
        <label className="pfield">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My new project" />
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

      <pre className="padd__code" aria-label="Generated code">
        {snippet}
      </pre>
      <button type="button" className="pbtn pbtn--primary" onClick={onCopy}>
        {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        {copied ? 'Copied!' : 'Copy code'}
      </button>
    </section>
  );
}
