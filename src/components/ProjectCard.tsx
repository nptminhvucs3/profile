import { useEffect, useRef, useState } from 'react';
import { Activity, Check, Copy, ExternalLink, Github, Pencil, Pin, Trash2 } from 'lucide-react';
import type { Project, ProjectStatus } from '../config/projects';
import { copyText, hostOf, isHttpUrl, isLocalUrl, type PingResult } from '../lib/utils';

export type CheckState = { state: 'checking' } | PingResult;

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  live: 'Live',
  building: 'Building',
  paused: 'Paused',
  archived: 'Archived',
};

interface Props {
  project: Project;
  check?: CheckState;
  activeTag: string;
  onCheck: () => void;
  onTag: (tag: string) => void;
  onOpened: () => void;
  /** Chế độ Manage: hiện nút Sửa / Xóa */
  manage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

function checkText(c: CheckState | undefined): string {
  if (!c) return '';
  if (c.state === 'checking') return 'Checking…';
  if (c.state === 'online') return `Online · ${c.ms} ms`;
  if (c.state === 'blocked') return "Can't check (http:// from https page)";
  return 'No response';
}

export default function ProjectCard({ project, check, activeTag, onCheck, onTag, onOpened, manage, onEdit, onDelete }: Props) {
  const { name, description, url, repo, tags, status, pinned } = project;
  const host = hostOf(url);
  const hasLink = url.trim().length > 0;
  const local = hasLink && isLocalUrl(url);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onCopy = async () => {
    if (!(await copyText(url))) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <article className={`pcard pcard--${status}`}>
      <header className="pcard__head">
        <h3 className="pcard__name">
          {hasLink ? (
            <a href={url} target="_blank" rel="noopener noreferrer" onClick={onOpened}>
              {name}
            </a>
          ) : (
            <span>{name}</span>
          )}
          {pinned && <Pin size={13} className="pcard__pin" aria-label="Pinned" />}
        </h3>
        <span className={`pstatus pstatus--${status}`}>{STATUS_LABEL[status]}</span>
      </header>

      <p className="pcard__desc">{description}</p>

      {tags.length > 0 && (
        <ul className="pcard__tags" aria-label="Tags">
          {tags.map((t) => (
            <li key={t}>
              <button
                type="button"
                className={`ptag${activeTag && t.toLowerCase() === activeTag.toLowerCase() ? ' is-active' : ''}`}
                onClick={() => onTag(t)}
                aria-pressed={!!activeTag && t.toLowerCase() === activeTag.toLowerCase()}
              >
                #{t}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="pcard__meta">
        {hasLink ? <span className="pcard__host">{host || url}</span> : <span className="pcard__host">No link yet</span>}
        {local && (
          <span className="pbadge" title="Runs on your own machine — only you can open it">
            Local
          </span>
        )}
        {check && (
          <span className={`pcheck pcheck--${check.state}`} role="status">
            <span className="pcheck__dot" aria-hidden="true" />
            {checkText(check)}
          </span>
        )}
      </p>

      {manage && confirming ? (
        <footer className="pcard__actions pcard__confirm" role="alertdialog" aria-label={`Delete ${name}?`}>
          <span>Delete “{name}”?</span>
          <button
            type="button"
            className="pbtn pbtn--danger"
            onClick={() => {
              setConfirming(false);
              onDelete?.();
            }}
            autoFocus
          >
            Delete
          </button>
          <button type="button" className="pbtn pbtn--ghost" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </footer>
      ) : (
      <footer className="pcard__actions">
        {hasLink ? (
          <a className="pbtn pbtn--primary" href={url} target="_blank" rel="noopener noreferrer" onClick={onOpened}>
            Open <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : (
          <span className="pbtn pbtn--primary is-disabled" aria-disabled="true">
            Open
          </span>
        )}
        {repo && (
          <a
            className="pbtn pbtn--icon"
            href={repo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name} source code`}
            title="Source code"
          >
            <Github size={16} aria-hidden="true" />
          </a>
        )}
        {hasLink && (
          <button type="button" className="pbtn pbtn--icon" onClick={onCopy} aria-label={`Copy link of ${name}`} title="Copy link">
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          </button>
        )}
        {hasLink && isHttpUrl(url) && (
          <button
            type="button"
            className="pbtn pbtn--icon"
            onClick={onCheck}
            disabled={check?.state === 'checking'}
            aria-label={`Check if ${name} is online`}
            title="Check if it responds"
          >
            <Activity size={16} aria-hidden="true" />
          </button>
        )}
        {manage && (
          <span className="pcard__manage">
            <button type="button" className="pbtn pbtn--icon" onClick={onEdit} aria-label={`Edit ${name}`} title="Edit">
              <Pencil size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="pbtn pbtn--icon pbtn--dangerIcon"
              onClick={() => setConfirming(true)}
              aria-label={`Delete ${name}`}
              title="Delete"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </span>
        )}
      </footer>
      )}
    </article>
  );
}
