(() => {
  'use strict';

  const emailButtons = document.querySelectorAll('[data-copy-email]');
  if (emailButtons.length) {
    const feedback = document.createElement('div');
    feedback.className = 'copy-feedback';
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.setAttribute('aria-atomic', 'true');
    document.body.appendChild(feedback);
    let feedbackTimer;

    const fallbackCopy = (email) => {
      const previousFocus = document.activeElement;
      const field = document.createElement('textarea');
      field.value = email;
      field.readOnly = true;
      field.style.cssText = 'position:fixed;left:-9999px;top:0;font-size:16px;';
      document.body.appendChild(field);
      field.select();
      field.setSelectionRange(0, email.length);
      try {
        if (!document.execCommand('copy')) throw new Error('Copy unavailable');
      } finally {
        field.remove();
        previousFocus?.focus({ preventScroll: true });
      }
    };

    emailButtons.forEach((button) => button.addEventListener('click', async () => {
      const email = button.dataset.copyEmail;
      if (!email) return;
      let message = 'Email copied!';
      try {
        if (navigator.clipboard?.writeText && window.isSecureContext) {
          try { await navigator.clipboard.writeText(email); }
          catch { fallbackCopy(email); }
        } else {
          fallbackCopy(email);
        }
      } catch {
        message = 'Unable to copy. Please select the email address.';
      }
      clearTimeout(feedbackTimer);
      feedback.textContent = message;
      feedback.classList.add('is-visible');
      feedbackTimer = setTimeout(() => {
        feedback.classList.remove('is-visible');
        feedback.textContent = '';
      }, 4000);
    }));
  }

  // Keep the homepage available while opening papers, documents, and other pages.
  // Same-page fragments retain the in-page highlighting and navigation below.
  document.querySelectorAll('a[href]').forEach((link) => {
    if (link.hasAttribute('download')) return;
    let url;
    try { url = new URL(link.getAttribute('href'), window.location.href); }
    catch { return; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    if (url.origin === window.location.origin && url.pathname === window.location.pathname &&
        url.search === window.location.search) return;
    link.target = '_blank';
    const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    link.setAttribute('rel', Array.from(rel).join(' '));
  });

  const sidebar = document.querySelector('.sidebar-wrapper');
  const main = document.querySelector('.main-wrapper');
  if (!sidebar || !main) return;

  // Same-page links share navigation behavior; click highlights live only in memory.
  const wrapper = document.querySelector('.wrapper');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clickedFragments = new Map();
  let navigatedByClick = false;
  const fragmentTarget = (hash) => {
    if (!hash || hash === '#') return null;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); }
    catch { return null; }
    const target = document.getElementById(id);
    return target && wrapper.contains(target) ? target : null;
  };
  const prepareTarget = (target) => {
    target.classList.add('navigation-anchor');
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    for (let details = target.closest('details'); details; details = details.parentElement?.closest('details')) {
      details.open = true;
    }
  };
  const clearHighlight = () => {
    wrapper.querySelectorAll('.is-navigation-target, .is-publication-target').forEach((item) => {
      item.classList.remove('is-navigation-target', 'is-publication-target');
      item.style.removeProperty('--navigation-accent');
    });
  };
  const releaseStaleFocus = (destination) => {
    const previousFocus = document.activeElement;
    if (!previousFocus?.closest('.navigation-anchor, .publication-anchor')) return;
    if (destination && destination !== previousFocus) {
      prepareTarget(destination);
      destination.focus({ preventScroll: true });
    }
    if (document.activeElement === previousFocus) previousFocus.blur();
  };
  const scrollToTarget = (target, smooth = false) => {
    const rect = target.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const viewportTop = window.visualViewport?.offsetTop || 0;
    // Center the actual item, without inheriting an asymmetric CSS scroll margin.
    // Long sections remain readable from their beginning rather than their midpoint.
    const inset = rect.height <= viewportHeight - 48 ? (viewportHeight - rect.height) / 2 : 24;
    const desiredTop = window.scrollY + rect.top - viewportTop - inset;
    const scroller = document.scrollingElement || document.documentElement;
    const maxTop = Math.max(0, scroller.scrollHeight - window.innerHeight);
    window.scrollTo({
      top: Math.max(0, Math.min(desiredTop, maxTop)),
      behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant',
    });
  };
  const highlightTargets = (ids) => Array.from(new Set(ids))
    .map((id) => document.getElementById(id))
    .filter((item) => item && wrapper.contains(item));
  const navigateTo = (target, record, smooth = false) => {
    clearHighlight();
    prepareTarget(target);
    const highlightedItems = record ? highlightTargets(record.targetIds) : [];
    // Reveal all related papers before measuring the primary destination.
    highlightedItems.forEach((item) => {
      prepareTarget(item);
      item.style.setProperty('--navigation-accent', record.color);
      item.classList.add('is-navigation-target');
    });
    const highlightedItem = highlightedItems.includes(target) ? target : highlightedItems[0];
    if (highlightedItem) {
      highlightedItem.focus({ preventScroll: true });
    } else releaseStaleFocus(target);
    scrollToTarget(highlightedItem || target, smooth);
  };
  wrapper.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || !wrapper.contains(link) || link.hasAttribute('download') ||
        (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname ||
        url.search !== window.location.search) return;
    const target = fragmentTarget(url.hash);
    if (!target) return;
    let highlights = highlightTargets((link.dataset.highlightTargets || '').split(/\s+/).filter(Boolean));
    if (!highlights.length) highlights = highlightTargets([link.dataset.highlightTarget || '']);
    if (!highlights.length) highlights = [target];
    const style = window.getComputedStyle(link);
    const record = {
      targetIds: highlights.map((item) => item.id),
      color: style.getPropertyValue('--navigation-accent').trim() || style.color,
    };
    event.preventDefault();
    clickedFragments.set(url.hash, record);
    navigatedByClick = true;
    if (window.location.hash !== url.hash) window.history.pushState(null, '', url.hash);
    navigateTo(target, record, true);
  });
  window.addEventListener('hashchange', () => {
    const target = fragmentTarget(window.location.hash);
    if (target) navigateTo(target, clickedFragments.get(window.location.hash));
    else {
      clearHighlight();
      releaseStaleFocus(null);
    }
  });
  // Restored pages keep their scroll/disclosure state, without reviving an old box.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      clearHighlight();
      releaseStaleFocus(null);
    }
  });
  const initialHash = window.location.hash;
  const initialTarget = fragmentTarget(initialHash);
  clearHighlight();
  if (initialTarget) {
    prepareTarget(initialTarget);
    releaseStaleFocus(null);
    scrollToTarget(initialTarget);
    // Direct entry/reload reveals the fragment, but never highlights or focuses it.
    window.addEventListener('load', () => {
      if (!navigatedByClick && window.location.hash === initialHash) {
        clearHighlight();
        releaseStaleFocus(null);
        scrollToTarget(initialTarget);
      }
    }, { once: true });
  }

  main.querySelector('.mobile-supporting-info')?.remove();
  const printMedia = window.matchMedia('print');
  let printState = null;

  // Browser-menu printing must include disclosures and all page content,
  // while cancelling or finishing print must restore the reader's choices.
  const preparePrint = () => {
    if (printState) return;
    printState = Array.from(document.querySelectorAll('.wrapper details'), (element) => ({
      element, open: element.open,
    }));
    printState.forEach(({ element }) => { element.open = true; });
  };
  const restorePrint = () => {
    if (!printState) return;
    const previousState = printState;
    printState = null;
    previousState.forEach(({ element, open }) => { element.open = open; });
  };
  window.addEventListener('beforeprint', preparePrint);
  window.addEventListener('afterprint', restorePrint);
  const printChanged = (event) => event.matches ? preparePrint() : restorePrint();
  if (printMedia.addEventListener) printMedia.addEventListener('change', printChanged);
  else printMedia.addListener(printChanged);

  // These small thumbnails also need to be ready for immediate browser printing.
  document.querySelectorAll('.wrapper img[loading="lazy"]').forEach((image) => {
    image.loading = 'eager';
  });
})();
