"use client";

import { useEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "@/lib/motion";

type CountUpProps = {
  to: number;
  duration?: number;
};

/**
 * Counts from zero to `to` when the number scrolls into view. The final value
 * is rendered on the server, so the markup is correct before hydration and
 * when JavaScript never runs.
 */
export default function CountUp({ to, duration = 1100 }: CountUpProps) {
  const [value, setValue] = useState(to);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;

    let frame = 0;
    let started = false;

    const animate = (from: number) => {
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(to * eased));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      setValue(from);
      frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || started) continue;
        started = true;
        observer.disconnect();
        animate(0);
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [to, duration]);

  return <span ref={ref}>{value}</span>;
}
