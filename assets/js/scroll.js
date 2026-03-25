// LEGEND HIDE ON SCROLL DOWN
let lastScrollY = window.scrollY;

const legend = document.querySelector('.legend');
if (legend) {
  function checkLegendScroll() {
    let currentScrollY = window.scrollY;
    const strainList = document.querySelector('.strain-list-container');
    
    // Add strain list scroll if it exists
    if (strainList) {
      currentScrollY += strainList.scrollTop;
    }

    if (currentScrollY > lastScrollY && currentScrollY > 200) {
      legend.classList.add('hide');
    } else {
      legend.classList.remove('hide');
    }

    lastScrollY = currentScrollY;
  }
  }

