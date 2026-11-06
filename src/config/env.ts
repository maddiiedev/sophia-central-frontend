export const appConfig = {
  // In deployed builds, route API traffic through the frontend origin.
  // This keeps session cookies first-party on iOS, Android, and desktop browsers.
  // Local development can continue using VITE_API_BASE_URL or localhost.
  apiBaseUrl: import.meta.env.PROD
    ? '/api'
    : (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'),
  appName: import.meta.env.VITE_APP_NAME ?? 'Sophis Central',
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  isProduction: import.meta.env.PROD === true,
  mode: import.meta.env.MODE ?? 'development',
} as const;
