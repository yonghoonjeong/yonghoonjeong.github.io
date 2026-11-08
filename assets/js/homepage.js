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

  const sidebar = document.querySelector('.sidebar-wrapper');
  const main = document.querySelector('.main-wrapper');
  if (!sidebar || !main) return;

  // About links lead to the matching paper, including papers in closed disclosures.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const publicationTarget = (hash) => {
    if (!hash.startsWith('#paper-')) return null;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); }
    catch { return null; }
    const target = document.getElementById(id);
    return target?.matches('.publications-section .publication-anchor') ? target : null;
  };
  const revealPublication = (target, smooth = false) => {
    const disclosure = target.closest('details');
    if (disclosure) disclosure.open = true;
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      block: 'start',
      behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant',
    });
  };
  main.querySelectorAll('a.research-paper-link[href^="#paper-"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
          event.shiftKey || event.altKey || (link.target && link.target !== '_self')) return;
      const target = publicationTarget(link.hash);
      if (!target) return;
      event.preventDefault();
      if (window.location.hash !== link.hash) window.history.pushState(null, '', link.hash);
      revealPublication(target, true);
    });
  });
  window.addEventListener('hashchange', () => {
    const target = publicationTarget(window.location.hash);
    if (target) revealPublication(target);
  });
  const initialPaperHash = window.location.hash;
  const initialPaper = publicationTarget(initialPaperHash);
  if (initialPaper) {
    revealPublication(initialPaper);
    // Re-align direct links after images and styles above the paper finish loading.
    window.addEventListener('load', () => {
      if (window.location.hash === initialPaperHash) revealPublication(initialPaper);
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
