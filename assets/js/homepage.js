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

  const supportingBlocks = Array.from(sidebar.children).filter((element) =>
    element.matches('.languages-container')
  );

  let supportingInfo = main.querySelector('.mobile-supporting-info');
  if (!supportingInfo) {
    supportingInfo = document.createElement('aside');
    supportingInfo.className = 'mobile-supporting-info';
    supportingInfo.hidden = true;
    main.insertBefore(supportingInfo, main.querySelector('#activities'));
  }
  supportingInfo.setAttribute('aria-label', 'Languages');

  // Remember each block's original position so resizing restores the desktop sidebar.
  const blocks = supportingBlocks.map((element) => {
    const placeholder = document.createComment('Sidebar supporting information');
    element.before(placeholder);
    return { element, placeholder };
  });
  const mobile = window.matchMedia('screen and (max-width: 767px)');
  const printMedia = window.matchMedia('print');
  let printState = null;

  const updateLayout = () => {
    if (mobile.matches && !printState && !printMedia.matches) {
      blocks.forEach(({ element }) => supportingInfo.appendChild(element));
      supportingInfo.hidden = false;
    } else {
      blocks.forEach(({ element, placeholder }) => placeholder.after(element));
      supportingInfo.hidden = true;
    }
  };

  updateLayout();
  if (mobile.addEventListener) mobile.addEventListener('change', updateLayout);
  else mobile.addListener(updateLayout);

  // Browser-menu printing must include disclosures and the desktop sidebar,
  // while cancelling or finishing print must restore the reader's choices.
  const preparePrint = () => {
    if (printState) return;
    printState = Array.from(document.querySelectorAll('.wrapper details'), (element) => ({
      element, open: element.open,
    }));
    printState.forEach(({ element }) => { element.open = true; });
    updateLayout();
  };
  const restorePrint = () => {
    if (!printState) { updateLayout(); return; }
    const previousState = printState;
    printState = null;
    previousState.forEach(({ element, open }) => { element.open = open; });
    updateLayout();
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
