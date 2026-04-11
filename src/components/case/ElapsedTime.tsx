import { useState, useEffect } from "react";

interface ElapsedTimeProps {
  since: string;
}

export function ElapsedTime({ since }: ElapsedTimeProps) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 1000));
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setElapsed(mins > 0 ? `${mins} мин ${secs} сек` : `${secs} сек`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [since]);

  return <span className="text-xs text-muted-foreground tabular-nums">{elapsed}</span>;
}
