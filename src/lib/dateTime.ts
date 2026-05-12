type DateLike = string | null | undefined;

const toValidDate = (value: DateLike) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatUtcDate = (value: DateLike, fallback = "—") => {
  const date = toValidDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
};

export const formatUtcTime = (value: DateLike, fallback = "—") => {
  const date = toValidDate(value);
  if (!date) return fallback;
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
};

export const formatTimeSlotLabel = (
  slot?: { date?: string | null; startTime?: string | null; endTime?: string | null; label?: string | null } | null,
  fallback = "Time slot TBD"
) => {
  if (slot?.label?.trim()) return slot.label;

  const dateLabel = formatUtcDate(slot?.date ?? slot?.startTime, "");
  const startLabel = formatUtcTime(slot?.startTime, "");
  const endLabel = formatUtcTime(slot?.endTime, "");
  const rangeLabel = [startLabel, endLabel].filter(Boolean).join(" - ");
  const combined = [dateLabel, rangeLabel].filter(Boolean).join(" • ");

  return combined || fallback;
};