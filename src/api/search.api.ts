import { axiosClient } from "./axiosclient";

export type SearchResultType =
  | "admin-dashboard"
  | "semester"
  | "course"
  | "course-offering"
  | "exam"
  | "student"
  | "student-dashboard"
  | "proctor"
  | "proctor-dashboard"
  | "admin"
  | "program"
  | "department"
  | "room"
  | "center"
  | "schedule";

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: string;
  href: string;
  metadata?: Record<string, unknown>;
};

export type SearchGroupKey = "academic" | "users" | "scheduling" | "resources";

export type SearchGroup = {
  key: SearchGroupKey;
  label: string;
  items: SearchResult[];
};

export type GlobalSearchResponse = {
  groups: SearchGroup[];
  total: number;
  query: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export const fetchGlobalSearch = async (
  q: string,
  limit = 5,
  signal?: AbortSignal
): Promise<GlobalSearchResponse> => {
  const trimmed = q.trim();
  if (!trimmed) {
    return { groups: [], total: 0, query: "" };
  }

  const response = await axiosClient.get<ApiEnvelope<GlobalSearchResponse>>(
    "/search",
    {
      params: { q: trimmed, limit },
      signal,
    }
  );

  return (
    response.data?.data ?? { groups: [], total: 0, query: trimmed }
  );
};
