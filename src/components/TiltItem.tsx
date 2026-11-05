import { useRef, type PointerEvent, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Góc nghiêng tối đa (độ) */
  max?: number;
  className?: string;
}

/**
 * Nghiêng rất nhẹ theo vị trí con trỏ khi hover nút. Chỉ áp dụng cho chuột (không phải cảm ứng),
 * bị tắt khi người dùng bật "giảm chuyển động". Ghi trực tiếp vào style, không dùng React state.
 * Đặt trên <li> bọc ngoài (không phải trên nút) vì nút có animation `reveal` đang giữ transform.
 */
export default function TiltItem({ children, max = 4, className }: Props) {
  const ref = useRef<HTMLLIElement>(null);

  const onMove = (e: PointerEvent<HTMLLIElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transition = 'transform 0.12s ease-out';
    el.style.transform = `perspective(700px) rotateX(${(-py * max * 2).toFixed(2)}deg) rotateY(${(px * max * 2).toFixed(2)}deg) translateZ(0)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1)';
    el.style.transform = '';
  };

  return (
    <li ref={ref} className={`tilt ${className ?? ''}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </li>
  );
}
