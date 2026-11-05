import ThemeToggle from './ThemeToggle';
import LocalTime from './LocalTime';
import type { Theme } from '../hooks/useTheme';
import { profile } from '../config/profile';
import { features } from '../config/features';

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
}

/** Lấy chữ cái đầu của tối đa 2 từ trong tên để làm logo */
// function getInitials(name: string): string {
//   return (
//     name
//       .trim()
//       .split(/\s+/)
//       .slice(0, 2)
//       .map((part) => part.charAt(0).toUpperCase())
//       .join('') || '✦'
//   );
// }

export default function Header({ theme, onToggleTheme }: Props) {
  return (
    <header className="header">
      {/* <span className="logo" aria-label={profile.fullName}>
        <span className="logo__mark" aria-hidden="true" />
        {getInitials(profile.fullName)}
      </span> */}
      <div className="header__right">
        {profile.timezone && (
          <LocalTime
            timezone={profile.timezone}
            label={profile.timezoneLabel || (profile.location ?? '').split(',')[0].trim() || 'Local'}
          />
        )}
        {features.themeToggle && <ThemeToggle theme={theme} onToggle={onToggleTheme} />}
      </div>
    </header>
  );
}
