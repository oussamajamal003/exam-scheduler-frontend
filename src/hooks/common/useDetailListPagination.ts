import { useMemo, useState } from "react";

type DetailListPaginationOptions = {
  pageSize?: number;
  threshold?: number;
};

export const useDetailListPagination = <T,>(
  items: readonly T[],
  options: DetailListPaginationOptions = {}
) => {
  const pageSize = options.pageSize ?? 12;
  const threshold = options.threshold ?? pageSize;
  const total = items.length;
  const shouldPaginate = total > threshold;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [currentPage, setPage] = useState(1);
  const page = shouldPaginate ? Math.min(currentPage, totalPages) : 1;

  const visibleItems = useMemo(() => {
    if (!shouldPaginate) return items;
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize, shouldPaginate]);

  const start = total === 0 ? 0 : shouldPaginate ? (page - 1) * pageSize + 1 : 1;
  const end = total === 0 ? 0 : shouldPaginate ? Math.min(total, page * pageSize) : total;

  return {
    end,
    page,
    setPage,
    shouldPaginate,
    start,
    total,
    totalPages,
    visibleItems,
  };
};