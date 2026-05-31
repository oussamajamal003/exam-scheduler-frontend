import { useEffect, useRef } from "react";

/**
 * Scrolls to the target row identified by a data attribute and applies a
 * 2-second premium gold glow animation that auto-removes itself.
 *
 * Highlight fires ONLY when targetId changes (i.e., on fresh navigation),
 * NOT on every data reload / search keystroke.
 *
 * @param dataAttr   - The data attribute name, e.g. "data-course-id"
 * @param targetId   - The id value to match, e.g. "abc123"
 * @param dataLength - The length of the data array; used to re-run after data loads.
 */
export function useHighlightRow(
  dataAttr: string,
  targetId: string | null | undefined,
  dataLength: number
) {
  // Tracks which targetId has already been successfully highlighted.
  // Prevents re-firing on data reloads (e.g. search changes, refetches).
  const lastHighlightedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!targetId || dataLength === 0) return;
    // Skip if we already highlighted this exact ID — prevents re-fire when
    // data length changes due to search input or background refetch.
    if (lastHighlightedRef.current === targetId) return;

    let applied = false;

    const applyHighlight = () => {
      if (applied) return;
      const el = document.querySelector<HTMLElement>(
        `[${dataAttr}="${CSS.escape(targetId)}"]`
      );
      if (!el) return;

      applied = true;
      lastHighlightedRef.current = targetId;

      el.scrollIntoView({ behavior: "smooth", block: "center" });

      // Remove any existing animation first (in case of re-navigation).
      el.classList.remove("row-highlight-gold");
      // Force reflow so removing + re-adding triggers a fresh animation.
      void el.offsetWidth;
      el.classList.add("row-highlight-gold");

      window.setTimeout(() => {
        el.classList.remove("row-highlight-gold");
      }, 2400);
    };

    // Initial attempt after render.
    const rafId = requestAnimationFrame(applyHighlight);
    // Retry after 200 ms — virtual rows need one React re-render cycle.
    const retry1 = window.setTimeout(applyHighlight, 200);
    // Second retry after 600 ms — safety net for slow data loads.
    const retry2 = window.setTimeout(applyHighlight, 600);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(retry1);
      clearTimeout(retry2);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, dataAttr, dataLength]);
}
