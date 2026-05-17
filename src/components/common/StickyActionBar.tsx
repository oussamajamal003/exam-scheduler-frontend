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
        "group sticky top-[76px] z-20 mb-8 flex transition-all duration-200 items-start border-y",
        isStuck
          ? "-mx-5 border-zinc-200/70 bg-transparent px-5 py-3 shadow-sm backdrop-blur-md sm:-mx-6 sm:h-[76px] sm:items-center sm:px-6 sm:py-0 lg:-mx-8 lg:px-8 dark:border-zinc-800/80 dark:bg-zinc-950/35 dark:shadow-black/10"
          : "py-2 border-transparent bg-transparent",
      )}
    >
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </div>
  );
}