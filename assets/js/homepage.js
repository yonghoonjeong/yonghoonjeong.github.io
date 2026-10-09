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
