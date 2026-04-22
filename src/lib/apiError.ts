type ApiErrorLike = {
  response?: {
    data?: {
      message?: string;
      data?: unknown;
    };
  };
  message?: string;
};

export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  const apiError = error as ApiErrorLike | undefined;
  return apiError?.response?.data?.message ?? apiError?.message ?? fallback;
};

type ValidationIssue = {
  message?: string;
  path?: Array<string | number>;
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

  const errors: Record<string, string[]> = {};
  for (const issue of payload) {
    const valIssue = issue as ValidationIssue;
    const path = Array.isArray(valIssue.path) && valIssue.path.length > 0 
      ? valIssue.path.filter(Boolean).join('.') 
      : 'root';
    if (valIssue.message) {
      if (!errors[path]) errors[path] = [];
      errors[path].push(valIssue.message);
    }
  }
  return errors;
};
