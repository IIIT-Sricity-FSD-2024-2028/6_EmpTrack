import { useEffect, useState } from 'react';

/** Counts up from 0 to value over 700ms (sa-common animateCount). */
export default function AnimatedCount({ value }) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / 700, 1);
      setShown(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return shown.toLocaleString();
}
