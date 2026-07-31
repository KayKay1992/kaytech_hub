import { useEffect, useState } from 'react';

// Animated completion ring — starts at 0 and eases in to the real value on
// mount, same "draw itself in" feel as the rest of the site's scroll
// reveals. Respects prefers-reduced-motion via the CSS transition being
// disabled globally for .dashboard-ring__fill.
export default function ProgressRing({ percent, size = 132, strokeWidth = 10 }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(percent), 150);
    return () => clearTimeout(timer);
  }, [percent]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="dashboard-ring">
      <circle className="dashboard-ring__track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
      <circle
        className="dashboard-ring__fill"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="dashboard-ring__label">{percent}%</text>
    </svg>
  );
}
