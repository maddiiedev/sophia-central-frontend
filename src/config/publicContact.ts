/** Public email destinations used by the website's contact links. */
export const publicContactEmails = {
  general: 'sophiscentral@gmail.com',

  support: 'sophiscentral+support@gmail.com',

  careers: 'sophiscentral@gmail.com',

  financial: 'sophiscentral@gmail.com',
} as const;

export function isConfiguredEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
