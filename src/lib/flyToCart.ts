"use client";

import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/utils";

/** Find the cart icon that is actually visible (desktop nav vs mobile bar). */
function findTarget() {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-target]"));
  return candidates.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
}

export function pulseCart() {
  const target = findTarget();
  if (!target || prefersReducedMotion()) return;
  gsap.fromTo(target, { scale: 1 }, { scale: 1.22, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.inOut", overwrite: true });
}

/** Clone the dish image and arc it into the cart icon. */
export function flyToCart(source: HTMLElement | null, imageSrc: string) {
  const target = findTarget();
  if (!source || !target || prefersReducedMotion()) {
    pulseCart();
    return;
  }
  const s = source.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const size = 56;
  const ghost = document.createElement("div");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${s.left + s.width / 2 - size / 2}px`,
    top: `${s.top + s.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "16px",
    backgroundImage: `url(${imageSrc})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    boxShadow: "0 12px 30px -10px rgba(42,20,7,.5)",
    zIndex: "95",
    pointerEvents: "none",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(ghost);
  const dx = t.left + t.width / 2 - (s.left + s.width / 2);
  const dy = t.top + t.height / 2 - (s.top + s.height / 2);
  gsap.to(ghost, {
    duration: 0.75,
    ease: "power2.in",
    motionPath: {
      path: [
        { x: 0, y: 0 },
        { x: dx * 0.45, y: Math.min(dy, 0) - 140 },
        { x: dx, y: dy },
      ],
      curviness: 1.4,
    },
    scale: 0.25,
    opacity: 0.7,
    onComplete: () => {
      ghost.remove();
      pulseCart();
    },
  });
}
