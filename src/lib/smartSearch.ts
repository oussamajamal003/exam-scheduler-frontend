/** Entity-segment separator used by {@link buildMultiEntitySearchIndex}. */
const ENTITY_SEP = "\x00";

/**
 * Builds a flat search index for a **single** entity from its field values.
 * Values are normalised to lowercase and joined by space so that any token
 * can be found with a simple `includes` check.
 */
export const buildSearchIndex = (...values: Array<string | number | null | undefined>) =>
  values
    .flatMap<string>((value) => {
      if (value === null || value === undefined || value === "") return [];
      return String(value).split(/\s+/);
    })
    .join(" ")
    .toLowerCase();

/**
 * Builds a **multi-entity** search index from pre-built per-entity indices.
 *
 * Use this instead of merging all field values into one flat string when the
 * search scope covers a group of distinct entities (e.g. multiple proctors
 * assigned to the same exam, or multiple students in a roster group).
 *
 * The entities are stored as `\x00`-separated segments.  {@link matchesSmartSearch}
 * will then require that **all** query tokens appear within the **same** segment,
 * preventing false positives caused by tokens matching across different entities.
 *
 * @example
 * // Proctors: "Fadi Khan" and "Adam Ahmed" assigned to the same exam.
 * const idx = buildMultiEntitySearchIndex([
 *   buildSearchIndex("Fadi Khan", "CS101", "Room A"),
 *   buildSearchIndex("Adam Ahmed", "CS101", "Room B"),
 * ]);
 * matchesSmartSearch(idx, "Fadi Ahmed"); // → false  ✓ (not the same person)
 * matchesSmartSearch(idx, "Fadi Khan");  // → true   ✓
 * matchesSmartSearch(idx, "CS101");      // → true   ✓ (appears in every segment)
 */
export const buildMultiEntitySearchIndex = (entityIndices: string[]): string =>
  entityIndices.filter(Boolean).join(ENTITY_SEP);

/**
 * Returns `true` when the *query* matches the *searchIndex*.
 *
 * - **Single-entity index** (no `\x00`): every token must appear anywhere in the index.
 * - **Multi-entity index** (contains `\x00`): every token must appear within the
 *   **same** entity segment, preventing cross-entity false positives.
 */
export const matchesSmartSearch = (searchIndex: string, query: string): boolean => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const tokens = normalized.split(/\s+/).filter(Boolean);

  if (searchIndex.includes(ENTITY_SEP)) {
    // Multi-entity: all tokens must be satisfied by a single entity's segment.
    const segments = searchIndex.split(ENTITY_SEP);
    return segments.some((segment) => tokens.every((token) => segment.includes(token)));
  }

  // Single-entity: tokens can match anywhere in the flat index.
  return tokens.every((token) => searchIndex.includes(token));
};