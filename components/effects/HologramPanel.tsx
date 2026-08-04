"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import RadarAnimation from "@/components/effects/RadarAnimation";
import ScanLines from "@/components/effects/ScanLines";
import { cx } from "@/lib/cx";
import { prefersReducedMotion } from "@/lib/motion";
import type { ProductImage } from "@/types/product";

type HologramPanelProps = {
  image: ProductImage;
  alt: string;
  statusLabel: string;
  dataLabel: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

/**
 * Robot inside the holographic panel: radar sphere, scanning beam, two HUD
 * badges and a subtle tilt that follows the pointer.
 */
export default function HologramPanel({
  image,
  alt,
  statusLabel,
  dataLabel,
  priority = false,
  sizes = "(max-width: 620px) 92vw, (max-width: 950px) 80vw, 46vw",
  className,
}: HologramPanelProps) {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const element = imageRef.current;
    if (!element || prefersReducedMotion()) return;

    let frame = 0;
    let tiltY = 0;
    let tiltX = 0;

    const paint = () => {
      frame = 0;
      element.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
      element.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
      element.classList.add("tilted");
    };

    const onMove = (event: PointerEvent) => {
      tiltY = (event.clientX / window.innerWidth - 0.5) * 12;
      tiltX = (event.clientY / window.innerHeight - 0.5) * -8;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
      element.classList.remove("tilted");
    };
  }, []);

  return (
    <div className={cx("visual", className)}>
      <RadarAnimation />
      <Image
        ref={imageRef}
        className={cx("robot", image.hasBackdrop && "blend-screen")}
        src={image.src}
        alt={alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        priority={priority}
      />
      <ScanLines />
      <p className="hud a">
        <span className="dot" />
        {statusLabel}
      </p>
      <p className="hud b">{dataLabel}</p>
    </div>
  );
}
