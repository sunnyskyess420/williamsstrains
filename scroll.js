// ALL HEADER ELEMENTS HIDE IN SEQUENCE ON STRAIN LIST SCROLL
let lastStrainScrollTop = 0;
let hideTimeout = null;

const strainList = document.querySelector('.strain-list-container');
const headerImage = document.querySelector('.header-image');
const searchContainer = document.querySelector('.search-container');
const legend = document.querySelector('.legend');

const elements = [
  { el: headerImage, class: 'scroll-hidden', delay: 0 },
  { el: searchContainer, class: 'scroll-hidden', delay: 100 },
  { el: legend, class: 'scroll-hidden', delay: 200 }
].filter(item => item.el);

if (strainList) {
  function handleStrainScroll() {
    const scrollingDown = strainList.scrollTop > lastStrainScrollTop && strainList.scrollTop > 50;
    
    clearTimeout(hideTimeout);
    
    if (scrollingDown) {
      // Hide in perfect sequence
      elements.forEach(({ el, class: cls, delay }) => {
        hideTimeout = setTimeout(() => {
          el.classList.add(cls);
        }, delay);
      });
    } else {
      // Show all immediately when scrolling up
      elements.forEach(({ el }) => {
        el.classList.remove('scroll-hidden');
      });
    }
    
    lastStrainScrollTop = strainList.scrollTop;
  }
  
  strainList.addEventListener('scroll', handleStrainScroll, { passive: true });
}
