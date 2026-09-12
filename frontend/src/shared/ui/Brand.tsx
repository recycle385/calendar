import { CalendarCheck2 } from 'lucide-react';

export function Brand() {
  return (
    <a className="brand" href="/" aria-label="moim 홈">
      <span className="brand-mark" aria-hidden="true"><CalendarCheck2 size={20} /></span>
      <span>moim</span>
    </a>
  );
}
