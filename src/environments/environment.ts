// PRODUCTION (used by `ng build` / Vercel).
// All requests go through the Vercel proxy (see vercel.json), so the browser
// only ever talks to the HTTPS Vercel domain: no mixed-content errors.
export const environment = {
  production: true,
  host: '/backend',
  apiUrl: '/backend/Auth/api',   // auth endpoints
  mainApiUrl: '/backend/api',    // the rest of the API
    // Used by the WhatsApp button only when the contact API can't be loaded (e.g. visitors, until the API is public).
  // Example: 'https://wa.me/201XXXXXXXXX'. Leave '' to hide the button in that case.
  whatsappUrl: '',
};
