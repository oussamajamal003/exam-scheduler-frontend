import axios from 'axios';

const TOKEN_STORAGE_KEY = 'token';
const TOKEN_EXPIRES_AT_STORAGE_KEY = 'token_expires_at';
const AUTH_USER_STORAGE_KEY = 'auth_user';
const FORCE_LOGOUT_ON_RELOAD_STORAGE_KEY = 'auth_force_logout_on_reload';
const FORCE_LOGOUT_ON_RELOAD_BOOT_STORAGE_KEY = 'auth_force_logout_on_reload_boot';
const PAGE_BOOT_ID_SESSION_KEY = 'auth_page_boot_id';

const getCurrentPageBootId = () => sessionStorage.getItem(PAGE_BOOT_ID_SESSION_KEY);

export const initializeAuthPageSession = () => {
  const bootId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  sessionStorage.setItem(PAGE_BOOT_ID_SESSION_KEY, bootId);
  return bootId;
};

export const clearStoredAuthSession = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_AT_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  localStorage.removeItem(FORCE_LOGOUT_ON_RELOAD_STORAGE_KEY);
  localStorage.removeItem(FORCE_LOGOUT_ON_RELOAD_BOOT_STORAGE_KEY);
};

export const axiosClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    // Server may use either `error` or `message` field for error text
    const errorText =
      (typeof data?.error === 'string' ? data.error : '') ||
      (typeof data?.message === 'string' ? data.message : '');
    const invalidToken = status === 403 && /token/i.test(errorText);
    const invalidPermissions =
      status === 403 && /required permissions|forbidden/i.test(errorText);

    // If 401 on login, DO NOT hard redirect since the user is already on the login page trying to auth.
    // Let the component handle rendering the invalid credentials error.
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');

    if (!isLoginEndpoint && (status === 401 || invalidToken)) {
      // Keep the current session UI alive until the app fully reloads.
      // On the next page load, the auth guard will clear storage and send the
      // user back to login.
      localStorage.setItem(FORCE_LOGOUT_ON_RELOAD_STORAGE_KEY, 'true');
      const bootId = getCurrentPageBootId();
      if (bootId) {
        localStorage.setItem(FORCE_LOGOUT_ON_RELOAD_BOOT_STORAGE_KEY, bootId);
      }
    }

    if (!isLoginEndpoint && invalidPermissions) {
      clearStoredAuthSession();

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    // Pass the actual API error message upwards if present instead of default Axios text.
    if (errorText) {
      error.message = errorText;
    }

    return Promise.reject(error);
  }
);

export const authStorageKeys = {
  token: TOKEN_STORAGE_KEY,
  tokenExpiresAt: TOKEN_EXPIRES_AT_STORAGE_KEY,
  authUser: AUTH_USER_STORAGE_KEY,
  forceLogoutOnReload: FORCE_LOGOUT_ON_RELOAD_STORAGE_KEY,
  forceLogoutOnReloadBoot: FORCE_LOGOUT_ON_RELOAD_BOOT_STORAGE_KEY,
  pageBootId: PAGE_BOOT_ID_SESSION_KEY,
};
