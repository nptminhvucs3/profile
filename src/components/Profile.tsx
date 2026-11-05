import type { CSSProperties, ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import type { Profile as ProfileData } from '../config/profile';

interface Props {
  profile: ProfileData;
}

/** Ghép đường dẫn với BASE_URL để chạy đúng trên GitHub Pages */
const asset = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

const delay = (i: number) => ({ '--i': i }) as CSSProperties;

/** In đậm cụm từ nổi bật trong bio (nếu có và nằm nguyên văn trong bio) */
function renderBio(bio: string, highlight: string): ReactNode {
  const at = highlight ? bio.indexOf(highlight) : -1;
  if (at < 0) return bio;
  return (
    <>
      {bio.slice(0, at)}
      <strong>{highlight}</strong>
      {bio.slice(at + highlight.length)}
    </>
  );
}

export default function Profile({ profile }: Props) {
  const { fullName, nickname, greeting, avatar, title, bio, bioHighlight, slogan, status, location } = profile;

  return (
    <section className="profile" aria-labelledby="profile-name">
      <p className="eyebrow reveal" style={delay(0)}>
        Personal Space
      </p>

      <div className="avatar-halo reveal" style={delay(1)}>
        <span className="avatar-orbit" aria-hidden="true" />
        <div className="avatar">
          <img src={asset(avatar)} alt={`Avatar of ${fullName}`} width={112} height={112} decoding="async" />
        </div>
      </div>

      {status && (
        <p className="status reveal" style={delay(2)}>
          <span className="status__dot" aria-hidden="true" />
          {status}
        </p>
      )}

      <h1 id="profile-name" className="name reveal" style={delay(3)}>
        {greeting && <span className="name__hi">{greeting} </span>}
        <span className="name__main">{fullName}</span>
      </h1>
      {nickname && (
        <p className="nickname reveal" style={delay(3)}>
          @{nickname}
        </p>
      )}

      <p className="title reveal" style={delay(4)}>
        {title}
      </p>
      <p className="bio reveal" style={delay(4)}>
        {renderBio(bio, bioHighlight)}
      </p>

      {slogan && (
        <p className="slogan reveal" style={delay(5)}>
          “{slogan}”
        </p>
      )}

      {location && (
        <p className="location reveal" style={delay(5)}>
          <MapPin size={14} aria-hidden="true" />
          {location}
        </p>
      )}
    </section>
  );
}
