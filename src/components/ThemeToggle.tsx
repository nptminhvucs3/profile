import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';

interface Props {
  theme: Theme;
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: Props) {
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button type="button" className="theme-toggle" onClick={onToggle} aria-label={label} title={label}>
      <Moon className="theme-toggle__icon theme-toggle__moon" size={18} aria-hidden="true" />
      <Sun className="theme-toggle__icon theme-toggle__sun" size={18} aria-hidden="true" />
    </button>
  );
}
