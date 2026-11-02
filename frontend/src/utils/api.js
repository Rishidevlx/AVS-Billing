/**
 * Centralized API client helper for AVS Billing Software.
 * Automatically injects the JWT Bearer authorization token from localStorage
 * and handles base URL resolution and cross-domain credentials.
 */

const getApiBase = () => {
  return import.meta.env.VITE_API_BASE_URL || '';
};

export const getAuthToken = () => {
  try {
    const token = localStorage.getItem('auth_token');
    if (token && token !== 'auth_active_session' && token !== 'undefined' && token !== 'null') {
      return token;
    }
  } catch (err) {
    console.warn('Error reading auth_token from localStorage:', err);
  }
  return null;
};

export const getAuthHeaders = (customHeaders = {}) => {
  const headers = { ...customHeaders };
  const token = getAuthToken();

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const apiFetch = async (endpoint, options = {}) => {
  const apiBase = getApiBase();
  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${apiBase}${endpoint}`;

  const headers = getAuthHeaders(options.headers || {});

  // If body is object and not FormData, stringify it & set Content-Type
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
    body,
  });

  return response;
};

export default apiFetch;

