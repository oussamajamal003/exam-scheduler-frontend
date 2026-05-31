import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type VirtualRowOptions = {
  estimateRowHeight?: number;
  overscan?: number;
  threshold?: number;
  maxHeight?: number;
};

export type VirtualRow<T> = {
  item: T;
  index: number;
};

export const useVirtualRows = <T,>(
  rows: T[],
  {
    estimateRowHeight = 64,
    overscan = 8,
    threshold = 100,
    maxHeight = 640,
  }: VirtualRowOptions = {}
) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(maxHeight);
  const isVirtualized = rows.length > threshold;

  useEffect(() => {
    if (!isVirtualized) return;
    const element = scrollRef.current;
    if (!element) return;

    const updateViewport = () => {
      setViewportHeight(element.clientHeight || maxHeight);
      setScrollTop(element.scrollTop);
    };

    updateViewport();
    const observer = new ResizeObserver(updateViewport);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isVirtualized, maxHeight]);

  const onScroll = () => {
    if (!isVirtualized) return;
    setScrollTop(scrollRef.current?.scrollTop ?? 0);
  };

  const virtual = useMemo(() => {
    if (!isVirtualized) {
      return {
        rows: rows.map((item, index) => ({ item, index })),
        topPadding: 0,
        bottomPadding: 0,
      };
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / estimateRowHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / estimateRowHeight) + overscan * 2;
    const endIndex = Math.min(rows.length, startIndex + visibleCount);
    const visibleRows = rows
      .slice(startIndex, endIndex)
      .map((item, offset) => ({ item, index: startIndex + offset }));

    return {
      rows: visibleRows,
      topPadding: startIndex * estimateRowHeight,
      bottomPadding: Math.max(0, (rows.length - endIndex) * estimateRowHeight),
    };
  }, [estimateRowHeight, isVirtualized, overscan, rows, scrollTop, viewportHeight]);

  const maxHeightClass = maxHeight >= 720 ? "max-h-[720px]" : "max-h-[640px]";

  const scrollToIndex = useCallback(
    (index: number) => {
      const container = scrollRef.current;
      if (!container || !isVirtualized) return;
      const newScrollTop = Math.max(
        0,
        index * estimateRowHeight - viewportHeight / 2 + estimateRowHeight / 2
      );
      container.scrollTop = newScrollTop;
      setScrollTop(newScrollTop);
    },
    [estimateRowHeight, isVirtualized, viewportHeight]
  );

  return {
    scrollRef,
    onScroll,
    virtualRows: virtual.rows,
    topPadding: virtual.topPadding,
    bottomPadding: virtual.bottomPadding,
    isVirtualized,
    containerClassName: isVirtualized ? `${maxHeightClass} overflow-y-auto` : "",
    scrollToIndex,
  };
};