import { useEffect, useState } from 'react';

interface Props {
  timezone: string;
  label: string;
}

function formatTime(timezone: string): string | null {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());
  } catch {
    return null; // múi giờ sai → không hiển thị
  }
}

/**
 * Đồng hồ nhỏ, mờ ở góc. Chỉ cập nhật 1 lần mỗi phút (đúng mốc phút),
 * không nằm trong vòng lặp animation. Dấu ":" nhấp nháy bằng CSS.
 */
export default function LocalTime({ timezone, label }: Props) {
  const [time, setTime] = useState<string | null>(() => formatTime(timezone));

  useEffect(() => {
    let timer = 0;
    const tick = () => {
      setTime(formatTime(timezone));
      timer = window.setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [timezone]);

  if (!time) return null;
  const [hh, mm] = time.split(':');

  return (
    <p className="localtime" aria-label={`Local time in ${label}: ${time}`}>
      <span className="localtime__label">{label}</span>
      <span className="localtime__time" aria-hidden="true">
        {hh}
        <span className="localtime__colon">:</span>
        {mm}
      </span>
    </p>
  );
}
