(() => {
  'use strict';

  const sidebar = document.querySelector('.sidebar-wrapper');
  const main = document.querySelector('.main-wrapper');
  if (!sidebar || !main) return;

  const supportingBlocks = Array.from(sidebar.children).filter((element) =>
    element.matches('.interests-container, .languages-container, .skills-container')
  );
  if (!supportingBlocks.length) return;

  let supportingInfo = main.querySelector('.mobile-supporting-info');
  if (!supportingInfo) {
    supportingInfo = document.createElement('aside');
    supportingInfo.className = 'mobile-supporting-info';
    supportingInfo.setAttribute('aria-label', 'Research interests and skills');
    supportingInfo.hidden = true;
    main.insertBefore(supportingInfo, main.querySelector('#activities'));
  }

  // Remember each block's original position so resizing restores the desktop sidebar.
  const blocks = supportingBlocks.map((element) => {
    const placeholder = document.createComment('Sidebar supporting information');
    element.before(placeholder);
    return { element, placeholder };
  });
  const mobile = window.matchMedia('screen and (max-width: 767px)');

  const updateLayout = () => {
    if (mobile.matches) {
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
})();
