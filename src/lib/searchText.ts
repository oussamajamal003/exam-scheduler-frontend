export const normalizeCommandSearchText = (value: string | null | undefined) => {
  const text = String(value ?? '').trim();
  if (!text) return '';

  let normalized = text;
  while (/\s*\([^()]*\)\s*$/.test(normalized)) {
    normalized = normalized.replace(/\s*\([^()]*\)\s*$/, '').trim();
  }

  return normalized.replace(/\s+/g, ' ');
};