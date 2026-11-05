import type { CSSProperties } from 'react';
import {
  Facebook,
  Github,
  Instagram,
  Link as LinkIcon,
  Linkedin,
  Mail,
  Music2,
  Send,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import type { SocialIconName, SocialLink } from '../config/profile';

/**
 * Bảng ánh xạ tên icon → component.
 * Muốn thêm icon mới: import từ lucide-react, thêm vào SocialIconName
 * trong profile.ts và thêm một dòng ở đây.
 */
const ICONS: Record<SocialIconName, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  github: Github,
  linkedin: Linkedin,
  tiktok: Music2,
  telegram: Send,
  email: Mail,
  link: LinkIcon,
  projects: LayoutGrid, // icon mới → thêm trong SocialButton.tsx
};

interface Props {
  link: SocialLink;
  /** Thứ tự (dùng cho độ trễ xuất hiện) */
  index: number;
  /** pill = nút lớn có tên; icon = nút tròn nhỏ */
  variant: 'pill' | 'icon';
  /** 0–2: chọn gradient dịu cho icon tròn trong nút pill */
  tone?: number;
}

export default function SocialButton({ link, index, variant, tone = 0 }: Props) {
  const Icon = ICONS[link.icon] ?? LinkIcon;
  const url = link.url.trim();
  const configured = url.length > 0;
  const isMail = url.startsWith('mailto:');
  const isInternal = url.startsWith('#');
  const style = { '--i': index } as CSSProperties; // (không còn hiệu ứng riêng: cả cụm nút hiện cùng lúc)
  const className = [
    'social',
    variant === 'pill' ? 'social--pill' : 'social--icon',
    !configured && 'social--disabled',
  ]
    .filter(Boolean)
    .join(' ');

  const content =
    variant === 'pill' ? (
      <>
        <span className="social__name">{link.name}</span>
        <span className="social__divider" aria-hidden="true" />
        <span className={`social__badge social__badge--${'abc'[tone % 3]}`} aria-hidden="true">
          <Icon size={18} />
        </span>
      </>
    ) : (
      <Icon size={18} aria-hidden="true" />
    );

  // URL chưa cấu hình → không điều hướng
  if (!configured) {
    return (
      <span
        className={className}
        style={style}
        role="link"
        aria-disabled="true"
        aria-label={`${link.name} (not configured yet)`}
        title={`${link.name} — not configured yet`}
      >
        {content}
      </span>
    );
  }

  return (
    <a
      className={className}
      style={style}
      href={url}
      title={link.name}
      aria-label={
      isMail
        ? `Send an email: ${url.replace('mailto:', '')}`
        : isInternal
        ? `Open ${link.name}`
        : `${link.name} (opens in a new tab)`
      }
      {...(isMail || isInternal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
    >
      {content}
    </a>
  );
}
