type ApiErrorLike = {
  response?: {
    status?: number;
    data?: {
      error?: string;
      message?: string;
      data?: unknown;
    };
  };
  message?: string;
};

export const isAuthExpiredError = (error: unknown) => {
  const apiError = error as ApiErrorLike | undefined;
  const status = apiError?.response?.status;
  const message = [
    apiError?.response?.data?.error,
    apiError?.response?.data?.message,
    apiError?.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (status === 401) return true;
  if (status === 403 && message.includes("token")) return true;
  return message.includes("invalid or expired token");
};

const normalizeKnownApiMessage = (message?: string) => {
  if (!message) return message;

  const normalized = message.toLowerCase();
  if (
    normalized.includes("user with this email already exists") ||
    normalized.includes("a record with this email already exists") ||
    normalized === "email already exists."
  ) {
    return "Email already exists.";
  }
  if (normalized.includes("center name") && normalized.includes("already exists")) {
    return "Center name already exists.";
  }

  return message;
};

export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  const apiError = error as ApiErrorLike | undefined;
  return normalizeKnownApiMessage(apiError?.response?.data?.message)
    ?? normalizeKnownApiMessage(apiError?.message)
    ?? fallback;
};

type ValidationIssue = {
  message?: string;
  path?: Array<string | number>;
};

/**
 * Smart error description: shows field-level validation messages (Zod)
 * when the server returns them, otherwise falls back to the generic message.
 */
export const getSmartErrorDescription = (error: unknown, fallback = "Something went wrong"): string => {
  const apiError = error as ApiErrorLike | undefined;
  const payload = apiError?.response?.data?.data;

  if (Array.isArray(payload) && payload.length > 0) {
    const IGNORED_SEGMENTS = new Set(['body', 'query', 'params']);
    const messages = (payload as ValidationIssue[])
      .map((issue) => {
        const path = Array.isArray(issue.path)
          ? issue.path.filter((seg) => !IGNORED_SEGMENTS.has(String(seg)) && Boolean(seg)).join('.')
          : '';
        return path ? `${path}: ${issue.message ?? ''}` : (issue.message ?? '');
      })
      .filter(Boolean);
    if (messages.length > 0) return messages.join('\n');
  }

  return normalizeKnownApiMessage(apiError?.response?.data?.message)
    ?? normalizeKnownApiMessage(apiError?.message)
    ?? fallback;
};

export const getApiValidationMessages = (error: unknown): string[] => {
  const apiError = error as ApiErrorLike | undefined;
  const payload = apiError?.response?.data?.data;

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((issue) => {
      const validationIssue = issue as ValidationIssue;
      const fieldPath = Array.isArray(validationIssue.path)
        ? validationIssue.path.filter(Boolean).join(".")
        : "";

      if (fieldPath && validationIssue.message) {
        return `${fieldPath}: ${validationIssue.message}`;
      }

      return validationIssue.message ?? "";
    })
    .filter((message): message is string => Boolean(message));
};

export const getApiValidationErrors = (error: unknown): Record<string, string[]> => {
  const apiError = error as ApiErrorLike | undefined;
  const payload = apiError?.response?.data?.data;

  if (!Array.isArray(payload)) return {};

  const IGNORED_PATH_SEGMENTS = new Set(['body', 'query', 'params']);
  const errors: Record<string, string[]> = {};
  for (const issue of payload) {
    const valIssue = issue as ValidationIssue;
    const cleanPath = Array.isArray(valIssue.path)
      ? valIssue.path.filter((seg) => !IGNORED_PATH_SEGMENTS.has(String(seg)) && Boolean(seg)).join('.')
      : '';
    const path = cleanPath || 'root';
    if (valIssue.message) {
      if (!errors[path]) errors[path] = [];
      errors[path].push(valIssue.message);
    }
  }
  return errors;
};
