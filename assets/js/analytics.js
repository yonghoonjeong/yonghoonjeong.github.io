// Analytics has been retired. This file only cleans up earlier installations.
(() => {
  window['ga-disable-G-624YY7HS54'] = true;
  try { localStorage.removeItem('yh-analytics-consent-v1'); } catch (_) {}
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.trim().split('=')[0];
    if (!/^_ga(?:_|$)/.test(name)) continue;
    for (const domain of ['', '; domain=' + location.hostname, '; domain=.' + location.hostname]) {
      document.cookie = name + '=; Max-Age=0; path=/' + domain;
    }
  }
})();
