/* =============================================================
   APP.JS — Core logic: search, filter, tried tracking, export,
             counts, popup sound observer
   ============================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ----- CACHED DOM REFERENCES ----- */
  const strainInput = document.getElementById('strainInput');
  const noResultsPopup = document.getElementById('noResultsPopup');
  const popupSound = document.getElementById('popupSound');
  const randomStrainButton = document.getElementById('randomStrain');
  const exportTriedButton = document.getElementById('exportTried');

  const counts = {
    indica: document.getElementById('indicaCount'),
    sativa: document.getElementById('sativaCount'),
    hybrid: document.getElementById('hybridCount'),
    unknown: document.getElementById('unknownCount'),
    total: document.getElementById('totalCount'),
    tried: document.getElementById('triedCount')
  };

  const strainListContainer = document.querySelector('.strain-list-container');
  const strainItems = strainListContainer
    ? Array.from(strainListContainer.querySelectorAll('li'))
    : [];
  const legendItems = Array.from(document.querySelectorAll('.legend .legend-item'));
  const triedToggles = strainItems
    .map((li) => li.querySelector('.tried-toggle'))
    .filter(Boolean);

  /* ----- STATE ----- */
  let triedStrains = JSON.parse(localStorage.getItem('wildcatTriedStrains') || '[]');
  let pendingCountTimer = null;

  /* ----- COUNT DISPLAY ----- */
  function updateCounts() {
    let indicaCount = 0;
    let sativaCount = 0;
    let hybridCount = 0;
    let unknownCount = 0;
    let totalCount = 0;

    strainItems.forEach((strain) => {
      if (strain.classList.contains('hidden')) return;

      totalCount += 1;
      if (strain.classList.contains('indica-strain')) indicaCount += 1;
      else if (strain.classList.contains('sativa-strain')) sativaCount += 1;
      else if (strain.classList.contains('hybrid-strain')) hybridCount += 1;
      else if (strain.classList.contains('unknown-strain')) unknownCount += 1;
    });

    const triedCount = triedToggles.reduce((count, toggle) => {
      return count + (toggle.classList.contains('checked') ? 1 : 0);
    }, 0);

    if (counts.indica) counts.indica.textContent = indicaCount;
    if (counts.sativa) counts.sativa.textContent = sativaCount;
    if (counts.hybrid) counts.hybrid.textContent = hybridCount;
    if (counts.unknown) counts.unknown.textContent = unknownCount;
    if (counts.total) counts.total.textContent = totalCount;
    if (counts.tried) counts.tried.textContent = triedCount;
  }

  function scheduleCountsUpdate(delay = 0) {
    if (pendingCountTimer) clearTimeout(pendingCountTimer);
    pendingCountTimer = setTimeout(() => {
      pendingCountTimer = null;
      updateCounts();
    }, delay);
  }

  /* ----- ANIMATION HELPERS ----- */
  function hideWithFade(el, deferCountUpdate = false) {
    el.classList.remove('fade-in');
    el.classList.add('fade-out');
    setTimeout(() => {
      el.classList.add('hidden');
      if (!deferCountUpdate) updateCounts();
    }, 300);
  }

  function showWithFade(el, deferCountUpdate = false) {
    el.classList.remove('hidden', 'fade-out');
    el.classList.add('fade-in');
    if (!deferCountUpdate) updateCounts();
  }

  /* ----- SEARCH ----- */
  function searchStrains() {
    if (!strainInput) return;

    const query = strainInput.value.toLowerCase().trim();

    if (!query) {
      strainItems.forEach((strain) => showWithFade(strain, true));
      legendItems.forEach((item) => item.classList.remove('active'));
      if (noResultsPopup) noResultsPopup.style.display = 'none';
      scheduleCountsUpdate();
      return;
    }

    const words = query.split(/\s+/).filter(Boolean);
    let visibleCount = 0;
    let hasHiddenChanges = false;

    strainItems.forEach((strain) => {
      const nameEl = strain.querySelector('.strain-name');
      const name = nameEl ? nameEl.textContent.toLowerCase() : '';
      const match = words.every((word) => name.includes(word));

      if (match) {
        showWithFade(strain, true);
        visibleCount += 1;
      } else {
        hideWithFade(strain, true);
        hasHiddenChanges = true;
      }
    });

    if (noResultsPopup && visibleCount === 0) {
      noResultsPopup.innerHTML = '🌿 OOO A new one! 🌿';
      noResultsPopup.style.display = 'flex';
    } else if (noResultsPopup) {
      noResultsPopup.style.display = 'none';
    }

    scheduleCountsUpdate(hasHiddenChanges ? 300 : 0);
  }

  let searchTimeout;
  if (strainInput) {
    strainInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(searchStrains, 250);
    });
  }

  /* ----- LEGEND FILTER ----- */
  legendItems.forEach((item) => {
    item.addEventListener('click', () => {
      const filter = item.dataset.filter;
      let hasHiddenChanges = false;
      let visibleCount = 0;

      legendItems.forEach((legendItem) => legendItem.classList.remove('active'));
      item.classList.add('active');

      strainItems.forEach((strain) => {
        let shouldShow = false;

        if (filter === 'all') {
          shouldShow = true;
        } else if (filter === 'tried') {
          shouldShow = strain.classList.contains('tried');
        } else {
          shouldShow = strain.classList.contains(filter);
        }

        if (shouldShow) {
          showWithFade(strain, true);
          visibleCount += 1;
        } else {
          hideWithFade(strain, true);
          hasHiddenChanges = true;
        }
      });

      if (noResultsPopup) {
        if (visibleCount === 0) {
          noResultsPopup.innerHTML = filter === 'tried'
            ? '💜 Tap a leaf to mark strains tried!'
            : '🌿 No strains found!';
          noResultsPopup.style.display = 'flex';
        } else {
          noResultsPopup.style.display = 'none';
        }
      }

      scheduleCountsUpdate(hasHiddenChanges ? 300 : 0);
    });
  });

  /* ----- TRIED TOGGLE ----- */
  document.addEventListener('click', function (e) {
    if (!e.target.classList.contains('tried-checkmark')) return;
    e.preventDefault();
    e.stopPropagation();

    const toggle = e.target.closest('.tried-toggle');
    if (!toggle) return;

    const li = toggle.closest('li');
    const checkbox = toggle.querySelector('input[type="checkbox"]');
    if (!li || !checkbox) return;

    const nameEl = li.querySelector('.strain-name');
    const name = nameEl ? nameEl.textContent.trim().replace(/\s+/g, ' ').trim() : '';

    const isChecked = checkbox.checked = !checkbox.checked;
    toggle.classList.toggle('checked', isChecked);
    li.classList.toggle('tried', isChecked);

    if (isChecked) {
      if (name && !triedStrains.includes(name)) triedStrains.push(name);
    } else {
      triedStrains = triedStrains.filter((strainName) => strainName !== name);
    }

    localStorage.setItem('wildcatTriedStrains', JSON.stringify(triedStrains));
    updateCounts();
  }, true);

  /* Restore saved tried states on page load */
  triedToggles.forEach((toggle) => {
    const li = toggle.closest('li');
    if (!li) return;

    const nameEl = li.querySelector('.strain-name');
    const name = nameEl ? nameEl.textContent.trim().replace(/\s+/g, ' ').trim() : '';

    if (triedStrains.includes(name)) {
      const checkbox = toggle.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = true;
      toggle.classList.add('checked');
      li.classList.add('tried');
    }
  });

  /* ----- RANDOM PICKER ----- */
  if (randomStrainButton) {
    randomStrainButton.addEventListener('click', () => {
      const visible = strainItems.filter((strain) => !strain.classList.contains('hidden'));
      if (!visible.length) return;

      const random = visible[Math.floor(Math.random() * visible.length)];
      strainItems.forEach((li) => li.classList.remove('random-highlight'));
      random.classList.add('random-highlight');
      random.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => random.classList.remove('random-highlight'), 3000);
    });
  }

  /* ----- CSV EXPORT ----- */
  if (exportTriedButton) {
    exportTriedButton.addEventListener('click', () => {
      const tried = strainItems
        .filter((li) => li.classList.contains('tried'))
        .map((li) => {
          const link = li.querySelector('a');
          const name = link ? link.textContent.trim() : li.textContent.trim();
          const leafly = link ? link.href : '';
          const type = li.classList.contains('indica-strain') ? 'Indica'
            : li.classList.contains('sativa-strain') ? 'Sativa'
              : li.classList.contains('hybrid-strain') ? 'Hybrid'
                : 'Unknown';
          return `"${name}","${type}","${leafly}"`;
        });

      if (!tried.length) return alert('No tried strains!');

      const csv = 'Strain,Type,Leafly\n' + tried.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-tried-strains.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  /* ----- POPUP SOUND OBSERVER ----- */
  if (noResultsPopup && popupSound) {
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === 'attributes') {
          const isVisible =
            (noResultsPopup.style.display !== 'none' || getComputedStyle(noResultsPopup).display !== 'none') &&
            noResultsPopup.offsetParent !== null;

          if (isVisible) {
            popupSound.currentTime = 0;
            popupSound.volume = 0.7;
            popupSound.play().catch((e) => console.error('Sound play failed:', e));
          }
        }
      });
    });

    observer.observe(noResultsPopup, { attributes: true, attributeFilter: ['style', 'class'] });
  }

  /* ----- INITIAL RENDER ----- */
  updateCounts();

});
