(() => {
  'use strict';

  const measurementId = document.currentScript?.dataset.measurementId || '';
  if (!/^G-[A-Z0-9]+$/.test(measurementId)) return;
  const production = window.location.hostname === 'yonghoonjeong.github.io';
  const preferenceKey = 'yh-analytics-consent-v1';
  let enabled = false;
  let started = false;
  let preference = '';
  try { preference = localStorage.getItem(preferenceKey) || ''; } catch (_) {}
  // Preferences last six months, independently of Google's cookies.
  try {
    const saved = JSON.parse(preference);
    preference = saved.expires > Date.now() ? saved.value : '';
  } catch (_) { preference = ''; }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied'
  });

  function start() {
    enabled = true;
    window['ga-disable-' + measurementId] = false;
    if (!production || started) return;
    started = true;
    const pageUrl = new URL(window.location.href);
    const safeUrl = new URL(window.location.origin + window.location.pathname);
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_term', 'utm_content']) {
      if (pageUrl.searchParams.has(key)) safeUrl.searchParams.set(key, pageUrl.searchParams.get(key));
    }
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 15552000,
      page_location: safeUrl.href,
      page_referrer: document.referrer ? document.referrer.split(/[?#]/)[0] : ''
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    document.head.appendChild(tag);
  }

  const style = document.createElement('style');
  style.textContent = `.analytics-choice{position:fixed;bottom:16px;right:16px;z-index:10000;box-sizing:border-box;width:min(420px,calc(100% - 32px));padding:18px;background:#fff;color:#263d45;border:1px solid #d5e1e4;border-radius:12px;box-shadow:0 5px 25px #0002;font:14px/1.5 Arial,sans-serif;color-scheme:only light}.analytics-choice[hidden]{display:none}.analytics-choice p{margin:0 0 12px}.analytics-choice a{color:#285b91;text-decoration:underline}.analytics-choice-actions{display:flex;gap:10px}.analytics-choice button{flex:1;padding:8px 12px;border:1px solid #315f69;border-radius:6px;background:#fff;color:#315f69;font:inherit;cursor:pointer}.analytics-choice button:focus-visible,.analytics-settings:focus-visible{outline:3px solid #68a1b4;outline-offset:3px}.analytics-footer{padding:16px;text-align:center;font:12px/1.6 Arial,sans-serif;color:#52636a}.analytics-footer a,.analytics-settings{color:inherit;text-decoration:underline}.analytics-settings{background:none;border:0;padding:0;font:inherit;cursor:pointer}`;
  document.head.appendChild(style);
  const panel = document.createElement('section');
  panel.className = 'analytics-choice';
  panel.setAttribute('aria-label', 'Website analytics preferences');
  panel.innerHTML = '<p>May I use Google Analytics to understand visits and paper downloads? Analytics cookies are optional. <a href="/privacy.html">Privacy details</a></p><div class="analytics-choice-actions"><button type="button" data-choice="accepted">Accept analytics</button><button type="button" data-choice="declined">Decline</button></div>';
  panel.hidden = Boolean(preference);
  document.body.appendChild(panel);
  const footer = document.createElement('div');
  footer.className = 'analytics-footer';
  footer.innerHTML = '<a href="/privacy.html">Privacy</a> · <button class="analytics-settings" type="button">Cookie settings</button>';
  document.body.appendChild(footer);
  const settings = footer.querySelector('button');
  settings.addEventListener('click', () => { panel.hidden = false; panel.querySelector('button').focus(); });
  panel.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-choice]');
    if (!button) return;
    preference = button.dataset.choice;
    try { localStorage.setItem(preferenceKey, JSON.stringify({ value: preference, expires: Date.now() + 15552000000 })); } catch (_) {}
    panel.hidden = true;
    if (preference === 'accepted') {
      if (started && !enabled) { window.location.reload(); return; }
      start();
    } else {
      enabled = false;
      window['ga-disable-' + measurementId] = true;
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.trim().split('=')[0];
        if (!/^_ga(?:_|$)/.test(name)) continue;
        for (const domain of ['', '; domain=' + window.location.hostname, '; domain=.' + window.location.hostname]) {
          document.cookie = name + '=; Max-Age=0; path=/' + domain;
        }
      }
      // Unload an already active tag to stop automatic events after withdrawal.
      if (started) { window.location.reload(); return; }
    }
    settings.focus({ preventScroll: true });
  });
  if (preference === 'accepted') start();

  document.addEventListener('click', (event) => {
    if (!enabled || !production) return;
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    let eventName;
    let parameters = {};

    if (url.origin === window.location.origin && /\/Yonghoon_Jeong_CV_[^/]+\.pdf$/i.test(url.pathname)) {
      eventName = 'cv_click';
      parameters.document_name = 'Curriculum Vitae';
    } else if (link.closest('.publications-section') &&
               (link.getAttribute('aria-label')?.startsWith('Read paper:') || /\(Paper\)/.test(link.textContent))) {
      eventName = 'paper_click';
      parameters.paper_title = (link.getAttribute('aria-label') || '').replace(/^Read paper:\s*/, '').slice(0, 100);
    } else {
      return;
    }

    window.gtag('event', eventName, {
      ...parameters,
      send_to: measurementId,
      link_domain: url.hostname,
      link_url: url.origin + url.pathname,
      transport_type: 'beacon'
    });
  });
})();
