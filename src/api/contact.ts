import { apiRequest } from '../lib/api/client';

export type ContactEnquiryPayload = {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  website?: string;
};

export const contactApi = {
  submit: (payload: ContactEnquiryPayload) =>
    apiRequest<{ success: boolean; message: string; ticketNumber?: string }>('/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
