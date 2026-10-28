export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000',
  appName: import.meta.env.VITE_APP_NAME ?? 'Sophis Central',
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  isProduction: import.meta.env.PROD === true,
  mode: import.meta.env.MODE ?? 'development',
} as const;
