"use client";

import { useEffect, useRef, useState } from "react";

export function GlobalActionIndicator() {
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function indicate(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const action = target.closest("button, a[href]");
      if (
        !action ||
        action.hasAttribute("disabled") ||
        action.getAttribute("aria-disabled") === "true"
      )
        return;
      setActive(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setActive(false), 800);
    }
    document.addEventListener("click", indicate, true);
    return () => {
      document.removeEventListener("click", indicate, true);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={active ? "Action in progress" : undefined}
      className={`global-action-indicator ${active ? "is-active" : ""}`}
    >
      <span className="global-action-spinner" aria-hidden="true" />
      <span>Working…</span>
    </div>
  );
}
