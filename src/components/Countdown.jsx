import { useEffect, useState } from "react";

function diff(target) {
  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export default function Countdown({ target, className = "" }) {
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    const tick = () => setT(diff(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!t) return <span className={`text-red-500 font-semibold ${className}`}>ამოიწურა</span>;

  const urgent = t.days === 0 && t.hours < 24;
  return (
    <span className={`font-mono tabular-nums ${urgent ? "text-amber-600 font-semibold" : "text-gray-700"} ${className}`}>
      {t.days > 0 && `${t.days}დ `}
      {String(t.hours).padStart(2, "0")}:{String(t.minutes).padStart(2, "0")}:{String(t.seconds).padStart(2, "0")}
    </span>
  );
}
