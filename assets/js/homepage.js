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
    supportingInfo.hidden = true;
    main.insertBefore(supportingInfo, main.querySelector('#activities'));
  }
  supportingInfo.setAttribute('aria-label', 'Languages and technical skills');

  const researchInfo = document.createElement('aside');
  researchInfo.className = 'mobile-research-interests';
  researchInfo.setAttribute('aria-label', 'Research interests');
  researchInfo.hidden = true;
  main.insertBefore(researchInfo, main.querySelector('.publications-section'));

  // Remember each block's original position so resizing restores the desktop sidebar.
  const blocks = supportingBlocks.map((element) => {
    const placeholder = document.createComment('Sidebar supporting information');
    element.before(placeholder);
    return { element, placeholder };
  });
  const mobile = window.matchMedia('screen and (max-width: 767px)');

  const updateLayout = () => {
    if (mobile.matches) {
      blocks.forEach(({ element }) => {
        const destination = element.matches('.interests-container') ? researchInfo : supportingInfo;
        destination.appendChild(element);
      });
      researchInfo.hidden = false;
      supportingInfo.hidden = false;
    } else {
      blocks.forEach(({ element, placeholder }) => placeholder.after(element));
      researchInfo.hidden = true;
      supportingInfo.hidden = true;
    }
  };

  updateLayout();
  if (mobile.addEventListener) mobile.addEventListener('change', updateLayout);
  else mobile.addListener(updateLayout);
})();
