/**
 * PUBLIC CONTACT EMAIL CONFIGURATION
 *
 * EDIT THE VALUES BELOW when Sophis Central's dedicated email aliases are ready.
 * The Gmail address is the temporary contact destination supplied for this project.
 * Replace it with the corresponding active alias when configured.
 *
 * Suggested aliases (domain to be confirmed):
 * support@YOUR-DOMAIN  – platform support
 * careers@YOUR-DOMAIN  – recruitment and career enquiries
 * info@YOUR-DOMAIN     – general enquiries
 *
 * These values only configure the website's displayed links. They do not create
 * mailboxes, aliases, forwarding rules, or email-provider settings.
 */
export const publicContactEmails = {
  // EDIT HERE: public company contact address.
  general: 'sophiscentral@gmail.com',

  // EDIT HERE: currently routes to the supplied contact mailbox; replace with support alias.
  support: 'sophiscentral@gmail.com',

  // EDIT HERE: currently routes to the supplied contact mailbox with a Careers subject;
  // replace with the dedicated careers alias when it has been configured.
  careers: 'sophiscentral@gmail.com',

  // EDIT HERE: financial enquiries address; replace with a dedicated alias if created.
  financial: 'sophiscentral@gmail.com',
} as const;

export function isConfiguredEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
