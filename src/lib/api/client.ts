
import { appConfig } from '../../config/env';

export type ApiRequestOptions = RequestInit;

let csrfToken: string | null = null;
let csrfRefresh: Promise<string> | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

function buildUrl(endpoint: string) {
  const baseUrl = appConfig.apiBaseUrl.endsWith('/')
    ? appConfig.apiBaseUrl.slice(0, -1)
    : appConfig.apiBaseUrl;

  const normalized = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  return baseUrl + normalized;
}

function getErrorMessage(
  value: unknown,
  fallback: string,
): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const messages = value
      .map(item => getErrorMessage(item, ''))
      .filter(Boolean);

    if (messages.length) {
      return messages.join(', ');
    }
  }

  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;

    for (const key of [
      'message',
      'error',
      'detail',
      'description',
    ]) {
      const message = getErrorMessage(object[key], '');

      if (message) return message;
    }
  }

  return fallback;
}

async function refreshCsrfToken(): Promise<string> {
  if (!csrfRefresh) {
    csrfRefresh = fetch(buildUrl('/auth/csrf'), {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error(
            'Unable to initialize secure request validation. Please refresh and try again.',
          );
        }

        const payload = await response.json();

        const token =
          payload?.csrfToken ??
          payload?.data?.csrfToken;

        if (typeof token !== 'string' || !token) {
          throw new Error(
            'The server did not provide a valid security token. Please refresh and try again.',
          );
        }

        csrfToken = token;

        return token;
      })
      .finally(() => {
        csrfRefresh = null;
      });
  }

  return csrfRefresh;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
  _legacyToken?: string | null,
): Promise<T> {
  const { headers, ...rest } = options;

  const method = (rest.method ?? 'GET').toUpperCase();

  const needsCsrf = ![
    'GET',
    'HEAD',
    'OPTIONS',
  ].includes(method);

  if (needsCsrf && !csrfToken) {
    await refreshCsrfToken();
  }

  const send = async (): Promise<Response> => {
    const requestHeaders: HeadersInit = {
      Accept: 'application/json',

      ...(rest.body instanceof FormData
        ? {}
        : {
            'Content-Type': 'application/json',
          }),

      ...(needsCsrf && csrfToken
        ? {
            'X-CSRF-Token': csrfToken,
          }
        : {}),

      ...headers,
    };

    const controller = new AbortController();

    const timeoutId = window.setTimeout(
      () => controller.abort(),
      20000,
    );

    try {
      return await fetch(buildUrl(endpoint), {
        ...rest,

        signal: rest.signal ?? controller.signal,

        credentials: 'include',

        headers: requestHeaders,
      });
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === 'AbortError'
      ) {
        throw new Error(
          'The server took too long to respond. Please retry in a moment.',
        );
      }

      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  let response = await send();

  // Refresh CSRF token once if the server explicitly reports
  // a CSRF validation failure.
  if (needsCsrf && response.status === 403) {
    let isCsrfFailure = false;

    try {
      const payload = await response.clone().json();

      const message = getErrorMessage(
        payload?.message,
        '',
      );

      isCsrfFailure = message
        .toLowerCase()
        .includes('csrf validation failed');
    } catch {
      // Retain the original response.
    }

    if (isCsrfFailure) {
      await refreshCsrfToken();
      response = await send();
    }
  }

  if (!response.ok) {
    const fallback =
      `Request failed with status ${response.status}`;

    let message = fallback;

    try {
      const payload = await response.json();

      message = getErrorMessage(
        payload?.message ?? payload?.error ?? payload,
        fallback,
      );
    } catch {
      // Use HTTP fallback when the response is not JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json();

  return (payload?.data ?? payload ?? undefined) as T;
}
