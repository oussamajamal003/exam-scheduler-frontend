import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SearchResult } from "@/api/search.api";
import { axiosClient } from "@/api/axiosclient";
import { normalizeRole } from "@/lib/authRoutes";

/** Returns true if the current JWT belongs to an admin user. */
const currentUserIsAdmin = (): boolean => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { role?: string };
    return normalizeRole(payload.role) === "ADMIN";
  } catch {
    return false;
  }
};

/** Entity types whose validation endpoints require ADMIN access. */
const ADMIN_ONLY_TYPES = new Set([
  "student", "proctor", "course", "course-offering",
  "room", "center", "department", "semester", "schedule", "exam",
]);

/**
 * Validates if a SearchResult item still exists in the system.
 * Returns a map of item key -> isValid boolean.
 *
 * Used to check if recent searches point to deleted entities.
 */
export const useValidateRecentItems = (items: SearchResult[]) => {
  const [validationMap, setValidationMap] = useState<Record<string, boolean>>({});

  // Build a query key and params for validation
  const queryKey = ["validate-recent-items", items.map((i) => `${i.type}-${i.id}`).join(",")];

  const { data: results } = useQuery({
    queryKey,
    queryFn: async () => {
      if (items.length === 0) return {};

      const validationResults: Record<string, boolean> = {};

      // Validate each item
      for (const item of items) {
        validationResults[`${item.type}-${item.id}`] = await validateSingleItem(item);
      }

      return validationResults;
    },
    enabled: items.length > 0,
    staleTime: 60_000, // Cache validation for 1 minute
    gcTime: 5 * 60_000, // Keep in cache for 5 minutes
  });

  useEffect(() => {
    if (results) {
      setValidationMap(results);
    }
  }, [results]);

  const isValid = useCallback(
    (item: SearchResult): boolean => {
      const key = `${item.type}-${item.id}`;
      // If not yet validated, assume valid (optimistic)
      return validationMap[key] !== false;
    },
    [validationMap]
  );

  return { isValid, validationMap };
};

/**
 * Validates if a single SearchResult item still exists.
 * Returns true if the entity exists, false if it's been deleted.
 * Non-admin users always receive true for admin-only entity types to avoid
 * calling restricted endpoints (which would trigger a 403 global redirect).
 */
async function validateSingleItem(item: SearchResult): Promise<boolean> {
  // For entity types backed by admin-only API endpoints, skip validation
  // entirely when the current user is not an admin — calling those endpoints
  // returns 403 "Forbidden" which the axios interceptor escalates to a full
  // page redirect to /login.
  if (ADMIN_ONLY_TYPES.has(item.type) && !currentUserIsAdmin()) {
    return true;
  }

  try {
    switch (item.type) {
      case "course-offering":
        return await validateCourseOffering(item.id);
      case "student":
        return await validateStudent(item.id);
      case "proctor":
        return await validateProctor(item.id);
      case "semester":
        return await validateSemester(item.id);
      case "course":
        return await validateCourse(item.id);
      case "room":
        return await validateRoom(item.id);
      case "center":
        return await validateCenter(item.id);
      case "department":
        return await validateDepartment(item.id);
      case "schedule":
        return await validateSchedule(item.id);
      case "exam":
        return await validateExam(item.id);
      // Dashboard items are always valid
      case "admin-dashboard":
      case "student-dashboard":
      case "proctor-dashboard":
        return true;
      default:
        return true;
    }
  } catch {
    // If validation fails (network error, etc.), assume valid to avoid breaking UX
    return true;
  }
}

// Validation functions for each entity type using a shared helper that ignores 404 errors in console/interceptors
async function checkExists(path: string): Promise<boolean> {
  try {
    const response = await axiosClient.get(path, {
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    });
    return response.status === 200 && !!response.data?.data;
  } catch {
    return false;
  }
}

async function validateCourseOffering(id: string): Promise<boolean> {
  return checkExists(`/course-offerings/${id}`);
}

async function validateStudent(id: string): Promise<boolean> {
  return checkExists(`/students/${id}`);
}

async function validateProctor(id: string): Promise<boolean> {
  return checkExists(`/proctors/${id}`);
}

async function validateSemester(id: string): Promise<boolean> {
  return checkExists(`/semesters/${id}`);
}

async function validateCourse(id: string): Promise<boolean> {
  return checkExists(`/courses/${id}`);
}

async function validateRoom(id: string): Promise<boolean> {
  return checkExists(`/rooms/${id}`);
}

async function validateCenter(id: string): Promise<boolean> {
  return checkExists(`/centers/${id}`);
}

async function validateDepartment(id: string): Promise<boolean> {
  return checkExists(`/departments/${id}`);
}

async function validateSchedule(id: string): Promise<boolean> {
  return checkExists(`/schedules/${id}`);
}

async function validateExam(id: string): Promise<boolean> {
  return checkExists(`/exams/${id}`);
}
