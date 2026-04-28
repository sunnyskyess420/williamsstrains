// ALL HEADER ELEMENTS HIDE IN SEQUENCE ON STRAIN LIST SCROLL
let lastStrainScrollTop = 0;
let hideTimeout = null;

const strainList = document.querySelector('.strain-list-container');
const topControlsWrap = document.querySelector('.top-controls-wrap');

if (strainList) {
  function handleStrainScroll() {
    const currentScrollTop = strainList.scrollTop;
    const scrollDelta = currentScrollTop - lastStrainScrollTop;
    const scrollingDown = scrollDelta > 6 && currentScrollTop > 50;
    const scrollingUp = scrollDelta < -18;

    clearTimeout(hideTimeout);

    if (!topControlsWrap) return;

    if (scrollingDown) {
      hideTimeout = setTimeout(() => {
        topControlsWrap.classList.add('scroll-hidden');
      }, 60);
    } else if (scrollingUp || currentScrollTop <= 10) {
      topControlsWrap.classList.remove('scroll-hidden');
    }

    lastStrainScrollTop = currentScrollTop;
  }

  strainList.addEventListener('scroll', handleStrainScroll, { passive: true });
}
