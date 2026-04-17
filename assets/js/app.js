document.addEventListener('DOMContentLoaded', function () {
  const strainInput = document.getElementById('strainInput');
  const noResultsPopup = document.getElementById('noResultsPopup');
  const popupMessage = document.getElementById('popupMessage');
  const popupSound = document.getElementById('popupSound');
  const dismissBtn = document.getElementById('dismissBtn');
  const randomStrainButton = document.getElementById('randomStrain');
  const exportTriedButton = document.getElementById('exportTried');
  const strainList = document.getElementById('strainList');

  const counts = {
    indica: document.getElementById('indicaCount'),
    sativa: document.getElementById('sativaCount'),
    hybrid: document.getElementById('hybridCount'),
    unknown: document.getElementById('unknownCount'),
    total: document.getElementById('totalCount'),
    tried: document.getElementById('triedCount')
  };

  const legendItems = Array.from(document.querySelectorAll('.legend .legend-item'));

  let strainItems = [];
  let triedToggles = [];
  let triedStrains = JSON.parse(localStorage.getItem('wildcatTriedStrains') || '[]');
  let pendingCountTimer = null;

  function createStrainItem(strain) {
    const li = document.createElement('li');
    li.className = strain.type || 'unknown-strain';

    const safeName = (strain.name || 'Unknown').trim();
    const safeUrl = (strain.url || '').trim();
    const nameMarkup = safeUrl
      ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeName}</a>`
      : safeName;

    li.innerHTML = `
      <span class="strain-content tried-toggle">
        <input type="checkbox">
        <span class="tried-checkmark"></span>
        <span class="tried-label">
          <span class="strain-name">${nameMarkup}</span>
        </span>
      </span>
    `;

    return li;
  }

  function renderStrains() {
    if (!strainList) {
  console.error('Missing #strainList');
  return;
}

if (!Array.isArray(window.STRAINS)) {
  console.error('STRAINS failed to load');
  strainList.innerHTML = '<li class="unknown-strain">Strain data failed to load.</li>';
  return;
}

    const fragment = document.createDocumentFragment();

    window.STRAINS.forEach((strain) => {
      fragment.appendChild(createStrainItem(strain));
    });

    strainList.innerHTML = '';
    strainList.appendChild(fragment);
  }

  function cacheStrainReferences() {
    strainItems = strainList ? Array.from(strainList.querySelectorAll('li')) : [];
    triedToggles = strainItems
      .map((li) => li.querySelector('.tried-toggle'))
      .filter(Boolean);
  }

  function getStrainName(li) {
    const nameEl = li.querySelector('.strain-name');
    return nameEl ? nameEl.textContent.trim().replace(/\s+/g, ' ').trim() : '';
  }

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

  function showPopup(message) {
    if (!noResultsPopup) return;
    if (popupMessage) popupMessage.textContent = message;
    noResultsPopup.style.display = 'flex';
  }

  function hidePopup() {
    if (!noResultsPopup) return;
    noResultsPopup.style.display = 'none';
  }

  function restoreTriedStates() {
    triedToggles.forEach((toggle) => {
      const li = toggle.closest('li');
      if (!li) return;

      const name = getStrainName(li);
      if (triedStrains.includes(name)) {
        const checkbox = toggle.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = true;
        toggle.classList.add('checked');
        li.classList.add('tried');
      }
    });
  }

  function searchStrains() {
    if (!strainInput) return;

    const query = strainInput.value.toLowerCase().trim();

    if (!query) {
      strainItems.forEach((strain) => showWithFade(strain, true));
      legendItems.forEach((item) => item.classList.remove('active'));
      hidePopup();
      scheduleCountsUpdate();
      return;
    }

    const words = query.split(/\s+/).filter(Boolean);
    let visibleCount = 0;
    let hasHiddenChanges = false;

    strainItems.forEach((strain) => {
      const name = getStrainName(strain).toLowerCase();
      const match = words.every((word) => name.includes(word));

      if (match) {
        showWithFade(strain, true);
        visibleCount += 1;
      } else {
        hideWithFade(strain, true);
        hasHiddenChanges = true;
      }
    });

    if (visibleCount === 0) {
      showPopup('🌿 OOO A new one! 🌿');
    } else {
      hidePopup();
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

      if (visibleCount === 0) {
        showPopup(filter === 'tried'
          ? '💜 Tap a leaf to mark strains tried!'
          : '🌿 No strains found!');
      } else {
        hidePopup();
      }

      scheduleCountsUpdate(hasHiddenChanges ? 300 : 0);
    });
  });

function bindTriedToggles() {
  document.querySelectorAll('.tried-toggle:not(.bound)').forEach((toggle) => {
    toggle.classList.add('bound');
    const checkbox = toggle.querySelector('input[type="checkbox"]');
    const checkmark = toggle.querySelector('.tried-checkmark');
    if (!checkbox || !checkmark) return;

    checkmark.onclick = (e) => {
      console.log('CLICK');
      e.preventDefault();
      e.stopPropagation();
      const li = toggle.closest('li');
      if (!li) return;
      const name = getStrainName(li);
      const isChecked = !checkbox.checked;
      checkbox.checked = isChecked;
      toggle.classList.toggle('checked', isChecked);
      li.classList.toggle('tried', isChecked);
      if (isChecked) {
        if (name && !triedStrains.includes(name)) triedStrains.push(name);
      } else {
        triedStrains = triedStrains.filter((strainName) => strainName !== name);
      }
      clearTimeout(window.saveTimeout);
      window.saveTimeout = setTimeout(() => {
        localStorage.setItem('wildcatTriedStrains', JSON.stringify(triedStrains));
      }, 300);
      updateCounts();
    };
  });
}

  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      hidePopup();

      if (popupSound) {
        popupSound.currentTime = 0;
        popupSound.volume = 0.5;
        popupSound.play().catch((e) => console.error('Sound failed:', e));
      }
    });
  }

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

if (exportTriedButton) {
  exportTriedButton.addEventListener('click', () => {
    const tried = strainItems
      .filter((li) => li.classList.contains('tried'))
      .map((li) => {
        const link = li.querySelector('a');
        const name = link ? link.textContent.trim() : getStrainName(li);
        const url = link ? link.href : '';
        const type = li.classList.contains('indica-strain')
          ? 'Indica'
          : li.classList.contains('sativa-strain')
            ? 'Sativa'
            : li.classList.contains('hybrid-strain')
              ? 'Hybrid'
              : 'Unknown';

        return `"${name}","${type}","${url}"`;
      });

    if (!tried.length) {
      alert('No tried strains!');
      return;
    }

    const csv = 'Strain,Type,Leafly\n' + tried.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = 'my-tried-strains.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

  if (noResultsPopup && popupSound) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type !== 'attributes') return;

        const isVisible =
          (noResultsPopup.style.display !== 'none' ||
            getComputedStyle(noResultsPopup).display !== 'none') &&
          noResultsPopup.offsetParent !== null;

        if (isVisible) {
          popupSound.currentTime = 0;
          popupSound.volume = 0.7;
          popupSound.play().catch((e) => console.error('Sound play failed:', e));
        }
      });
    });

    observer.observe(noResultsPopup, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  console.log('strainList exists:', !!strainList);
console.log('window.STRAINS:', window.STRAINS);
  renderStrains();
  cacheStrainReferences();
  bindTriedToggles();
  restoreTriedStates();
  updateCounts();
});