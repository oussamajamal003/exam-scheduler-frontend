import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface StickyActionBarProps extends PropsWithChildren {
  className?: string;
}

const STICKY_OFFSET_PX = 76;

export function StickyActionBar({ children, className }: StickyActionBarProps) {
  const actionBarRef = useRef<HTMLDivElement | null>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    let frameId = 0;

    const updateStickyState = () => {
      frameId = 0;

      const element = actionBarRef.current;
      if (!element) {
        return;
      }

      const nextIsStuck = element.getBoundingClientRect().top <= STICKY_OFFSET_PX;
      setIsStuck((current) => (current === nextIsStuck ? current : nextIsStuck));
    };

    const requestUpdate = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(updateStickyState);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);

      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <div
      ref={actionBarRef}
      data-stuck={isStuck ? "true" : "false"}
      className={cn(
        "group sticky top-19 z-20 mb-8 border-y py-3 transition-[background-color,border-color,backdrop-filter]",
        isStuck
          ? "border-zinc-200/70 bg-stone-50/95 backdrop-blur supports-backdrop-filter:bg-stone-50/80"
          : "border-transparent bg-transparent",
        className
      )}
    >
      {children}
    </div>
  );
}