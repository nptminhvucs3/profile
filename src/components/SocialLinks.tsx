import type { CSSProperties } from 'react';
import SocialButton from './SocialButton';
import TiltItem from './TiltItem';
import CopyEmailButton from './CopyEmailButton';
import type { SocialLink } from '../config/profile';

interface Props {
  links: SocialLink[];
}

export default function SocialLinks({ links }: Props) {
  const visible = links.filter((link) => link.enabled);
  if (visible.length === 0) return null;

  const featured = visible.filter((link) => link.featured !== false);
  const secondary = visible.filter((link) => link.featured === false);

  return (
    <nav className="socials reveal" style={{ '--i': 6 } as CSSProperties} aria-label="Social links and contact">
      {featured.length > 0 && (
        <ul className="socials__pills">
          {featured.map((link, i) => (
            <TiltItem key={link.id} max={3}>
              <SocialButton link={link} index={i} variant="pill" tone={i} />
              {link.icon === 'email' && link.url.trim().startsWith('mailto:') && (
                <CopyEmailButton email={link.url.trim().replace('mailto:', '')} />
              )}
            </TiltItem>
          ))}
        </ul>
      )}
      {secondary.length > 0 && (
        <ul className="socials__icons">
          {secondary.map((link, i) => (
            <TiltItem key={link.id} max={9}>
              <SocialButton link={link} index={featured.length + i} variant="icon" />
            </TiltItem>
          ))}
        </ul>
      )}
    </nav>
  );
}
