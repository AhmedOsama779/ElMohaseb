// DEVELOPMENT (used by `ng serve`).
// localhost runs on HTTP, so calling the HTTP API directly is fine here.
export const environment = {
  production: false,
  host: 'http://mohaseb-api.runasp.net',
  apiUrl: 'http://mohaseb-api.runasp.net/Auth/api',   // auth endpoints
  mainApiUrl: 'http://mohaseb-api.runasp.net/api',    // the rest of the API
    // Used by the WhatsApp button only when the contact API can't be loaded (e.g. visitors, until the API is public).
  // Example: 'https://wa.me/201XXXXXXXXX'. Leave '' to hide the button in that case.
  whatsappUrl: '',
};
