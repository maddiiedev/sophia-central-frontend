const productionApiBaseUrl = 'https://sophia-central-backend.onrender.com';

export const appConfig = {
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL ??
    (import.meta.env.PROD ? productionApiBaseUrl : 'http://localhost:4000'),
  appName: import.meta.env.VITE_APP_NAME ?? 'Sophis Central',
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  isProduction: import.meta.env.PROD === true,
  mode: import.meta.env.MODE ?? 'development',
} as const;
