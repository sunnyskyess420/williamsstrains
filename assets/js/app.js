/* =============================================================
   APP.JS — Core logic: search, filter, tried tracking, export,
             counts, popup sound observer
   ============================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ----- STATE ----- */
  // Primary tried storage key used throughout
  let triedStrains = JSON.parse(localStorage.getItem('wildcatTriedStrains') || '[]');

  /* ----- COUNT DISPLAY ----- */
  function updateCounts() {
    document.getElementById('indicaCount').textContent   = document.querySelectorAll('.indica-strain:not(.hidden)').length;
    document.getElementById('sativaCount').textContent   = document.querySelectorAll('.sativa-strain:not(.hidden)').length;
    document.getElementById('hybridCount').textContent   = document.querySelectorAll('.hybrid-strain:not(.hidden)').length;
    document.getElementById('unknownCount').textContent  = document.querySelectorAll('.unknown-strain:not(.hidden)').length;
    document.getElementById('totalCount').textContent    = document.querySelectorAll('li:not(.hidden)').length;
    document.getElementById('triedCount').textContent    = document.querySelectorAll('.tried-toggle.checked').length;
  }

  /* ----- ANIMATION HELPERS ----- */
  function hideWithFade(el) {
    el.classList.remove('fade-in');
    el.classList.add('fade-out');
    setTimeout(() => {
      el.classList.add('hidden');
      updateCounts();
    }, 300);
  }

  function showWithFade(el) {
    el.classList.remove('hidden', 'fade-out');
    el.classList.add('fade-in');
    updateCounts();
  }

  /* ----- SEARCH ----- */
  /* ----- SEARCH ----- */
function searchStrains() {
  const query = document.getElementById('strainInput').value.toLowerCase().trim();
  const strains = document.querySelectorAll('.strain-list-container ul li');

  if (!query) {
    strains.forEach(showWithFade);
    document.querySelectorAll('.legend-item').forEach(item => item.classList.remove('active'));
    const popup = document.getElementById('noResultsPopup');
    if (popup) popup.style.display = 'none';
    return;
  }

  let visibleCount = 0;
  strains.forEach(strain => {
    const name = strain.querySelector('.strain-name').textContent.toLowerCase();
    const words = query.split(/\s+/).filter(w => w);
    const match = words.every(word => name.includes(word));
    if (match) {
      showWithFade(strain);
      visibleCount++;
    } else {
      hideWithFade(strain);
    }
  });  // LOOP ENDS HERE

  // POPUP - Runs ONCE after loop
  const popup = document.getElementById('noResultsPopup');
  if (popup && visibleCount === 0) {
    popup.innerHTML = '🌿 OOO A new one! 🌿';  // Replaces ALL text, no duplicates
    popup.style.display = 'flex';
    const sound = document.getElementById('popupSound');
    if (sound) {
      sound.currentTime = 0;
      sound.volume = 0.7;
      sound.play().catch(e => console.error('Sound failed:', e));
    }
  } else if (popup) {
    popup.style.display = 'none';
  }
}



  let searchTimeout;
  document.getElementById('strainInput').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(searchStrains, 250);
  });

  /* ----- LEGEND FILTER ----- */
  document.querySelectorAll('.legend-item').forEach(item => {
    item.addEventListener('click', () => {
      const filter  = item.dataset.filter;
      const strains = document.querySelectorAll('.strain-list-container ul li');

      document.querySelectorAll('.legend-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      strains.forEach(strain => {
        if (filter === 'all') {
          showWithFade(strain);
        } else if (filter === 'tried') {
          strain.classList.contains('tried') ? showWithFade(strain) : hideWithFade(strain);
        } else {
          strain.classList.contains(filter) ? showWithFade(strain) : hideWithFade(strain);
        }
      });
    });
  });

  /* ----- TRIED TOGGLE ----- */
  // Bulletproof event delegation — catches all clicks on .tried-checkmark
  document.addEventListener('click', function (e) {
    if (!e.target.classList.contains('tried-checkmark')) return;
    e.preventDefault();
    e.stopPropagation();

    const toggle   = e.target.closest('.tried-toggle');
    const li       = toggle.closest('li');
    const checkbox = toggle.querySelector('input[type="checkbox"]');
    const name     = li.querySelector('.strain-name').textContent.trim().replace(/\s+/g, ' ').trim();

    const isChecked      = checkbox.checked = !checkbox.checked;
    toggle.classList.toggle('checked', isChecked);
    li.classList.toggle('tried', isChecked);

    if (isChecked) {
      if (!triedStrains.includes(name)) triedStrains.push(name);
    } else {
      triedStrains = triedStrains.filter(s => s !== name);
    }

    localStorage.setItem('wildcatTriedStrains', JSON.stringify(triedStrains));
    updateCounts();
  }, true);

  /* Restore saved tried states on page load */
  document.querySelectorAll('.tried-toggle').forEach(toggle => {
    const li   = toggle.closest('li');
    const name = li.querySelector('.strain-name').textContent.trim().replace(/\s+/g, ' ').trim();

    if (triedStrains.includes(name)) {
      toggle.querySelector('input[type="checkbox"]').checked = true;
      toggle.classList.add('checked');
      li.classList.add('tried');
    }
  });

  /* ----- RANDOM PICKER ----- */
  document.getElementById('randomStrain').addEventListener('click', () => {
    const visible = document.querySelectorAll('li:not(.hidden)');
    if (!visible.length) return;

    const random = visible[Math.floor(Math.random() * visible.length)];
    document.querySelectorAll('li').forEach(li => li.classList.remove('random-highlight'));
    random.classList.add('random-highlight');
    random.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => random.classList.remove('random-highlight'), 3000);
  });

  /* ----- CSV EXPORT ----- */
  document.getElementById('exportTried').addEventListener('click', () => {
    const tried = Array.from(document.querySelectorAll('li.tried')).map(li => {
      const link   = li.querySelector('a');
      const name   = link ? link.textContent.trim() : li.textContent.trim();
      const leafly = link ? link.href : '';
      const type   = li.classList.contains('indica-strain') ? 'Indica'
                   : li.classList.contains('sativa-strain')  ? 'Sativa'
                   : li.classList.contains('hybrid-strain')  ? 'Hybrid'
                   : 'Unknown';
      return `"${name}","${type}","${leafly}"`;
    });

    if (!tried.length) return alert('No tried strains!');

    const csv  = 'Strain,Type,Leafly\n' + tried.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'my-tried-strains.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  /* ----- POPUP SOUND OBSERVER ----- */
  // Plays fireworks sound whenever #noResultsPopup becomes visible
  const popup = document.getElementById('noResultsPopup');
  const sound = document.getElementById('popupSound');

  if (popup && sound) {
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === 'attributes') {
          const isVisible = (popup.style.display !== 'none' || getComputedStyle(popup).display !== 'none') && 
                            popup.offsetParent !== null;
          if (isVisible) {
            sound.currentTime = 0;
            sound.play().catch(e => console.error('Sound play failed:', e));
          }
        }
      });
    });

    observer.observe(popup, { attributes: true, attributeFilter: ['style', 'class'] });

  }

  /* ----- INITIAL RENDER ----- */
  updateCounts();

}); // end DOMContentLoaded
