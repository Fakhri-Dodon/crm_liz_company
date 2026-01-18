import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Ensure cookies are sent for same-origin requests
window.axios.defaults.withCredentials = true;
// Proper XSRF config (axios uses these names to auto-read the cookie)
window.axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
window.axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

// Use meta csrf token as a fallback for environments where the XSRF cookie
// is not present or when requests are constructed manually.
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
  window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
  window.csrfToken = token.content;
}

// Polyfill/wrapper for fetch to automatically include credentials and
// the CSRF token when missing — fixes ad-hoc fetch POST/PUT/DELETE calls.
(function () {
  const _fetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    init = init || {};
    // default to same-origin so cookies are sent for same-site requests
    init.credentials = init.credentials || 'same-origin';

    // normalize headers and inject CSRF if not present
    const headers = new Headers(init.headers || {});
    if (!headers.get('X-CSRF-TOKEN') && window.csrfToken) {
      headers.set('X-CSRF-TOKEN', window.csrfToken);
    }
    if (!headers.get('X-Requested-With')) {
      headers.set('X-Requested-With', 'XMLHttpRequest');
    }

    init.headers = headers;
    return _fetch(input, init);
  };
})();
