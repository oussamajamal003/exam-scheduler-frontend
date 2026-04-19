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
