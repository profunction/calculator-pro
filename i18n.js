/* =====================================================
   Calculator Pro — i18n.js
   Translation Apply Function + Language Dropdown
   ===================================================== */

function applyTranslation(lang) {
  const t = window.translations ? window.translations[lang] : null;
  if (!t) return;

  // Update all elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) {
      el.innerHTML = t[key];
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.placeholder = t[key];
  });

  // Update html lang attribute
  var langMap = { en: 'en', zh: 'zh-CN', ms: 'ms' };
  document.documentElement.setAttribute('lang', langMap[lang] || 'en');

  // Update active state in dropdown
  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  // Update the language button label
  var flagMap = { en: '🇺🇸', zh: '🇨🇳', ms: '🇲🇾' };
  var labelMap = { en: 'EN', zh: '华文', ms: 'MY' };
  var langFlag = document.getElementById('langFlag');
  var langLabel = document.getElementById('langLabel');
  if (langFlag) langFlag.textContent = flagMap[lang] || '🇺🇸';
  if (langLabel) langLabel.textContent = labelMap[lang] || 'EN';

  // Save preference
  localStorage.setItem('lang', lang);
}

(function initLang() {
  const langBtn = document.getElementById('langBtn');
  const langDropdown = document.getElementById('langDropdown');

  if (!langBtn || !langDropdown) return;

  // Toggle dropdown
  langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    langDropdown.classList.toggle('open');
  });

  // Close on outside click
  document.addEventListener('click', () => {
    langDropdown.classList.remove('open');
  });

  // Language selection
  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const lang = btn.getAttribute('data-lang');
      applyTranslation(lang);
      langDropdown.classList.remove('open');
    });
  });

  // Load saved preference or default to 'en'
  let savedLang = localStorage.getItem('lang') || 'en';

  // Check URL for lang parameter (shared links)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('lang')) {
    savedLang = urlParams.get('lang');
  }

  applyTranslation(savedLang);
})();

/* =====================================================
   Currency Selector Logic (Inline in Input Fields)
   ===================================================== */

function applyCurrency(currency) {
  var symbol = window.currencyMap ? window.currencyMap[currency] : '$';
  if (!symbol) symbol = '$';

  // Update ALL inline currency buttons
  document.querySelectorAll('.currency-btn-inline .currency-symbol').forEach(el => {
    el.textContent = symbol;
  });

  // Update active state in dropdown
  document.querySelectorAll('#currencyDropdown .currency-option').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-currency') === currency);
  });

  // Store globally for app.js
  window.selectedCurrency = currency;
  window.selectedCurrencySymbol = symbol;

  // Save preference
  localStorage.setItem('currency', currency);
}

(function initCurrency() {
  window.currencyMap = {
    USD: '$', MYR: 'RM', SGD: '$', CNY: '¥', EUR: '€', GBP: '£', JPY: '¥', AUD: '$'
  };

  var dropdown = document.getElementById('currencyDropdown');
  if (!dropdown) return;

  // Move dropdown to body to avoid clipping by overflow/parent containers
  document.body.appendChild(dropdown);
  dropdown.style.position = 'fixed';
  dropdown.style.display = 'none';
  dropdown.style.zIndex = '9999';

  function positionDropdown(btn) {
    var rect = btn.getBoundingClientRect();
    var dropH = dropdown.offsetHeight || 320;
    var dropW = 220;
    var top = rect.bottom + 6;
    var left = rect.left;

    // If dropdown would go off bottom of viewport, show above button
    if (top + dropH > window.innerHeight && rect.top > dropH) {
      top = rect.top - dropH - 6;
    }
    // If dropdown would go off right of viewport, shift left
    if (left + dropW > window.innerWidth) {
      left = window.innerWidth - dropW - 8;
    }
    // Clamp left to not go off left edge
    if (left < 4) left = 4;

    dropdown.style.top = top + 'px';
    dropdown.style.left = left + 'px';
    dropdown.style.minWidth = '200px';
  }

  var allBtns = document.querySelectorAll('.currency-btn-inline');
  var currentBtn = null;

  allBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      // Close lang dropdown
      var langDrop = document.getElementById('langDropdown');
      if (langDrop) langDrop.classList.remove('open');

      // If already open for this button, close it
      if (dropdown.classList.contains('open') && currentBtn === btn) {
        dropdown.classList.remove('open');
        dropdown.style.display = 'none';
        currentBtn = null;
        return;
      }

      // Position and show dropdown
      currentBtn = btn;
      positionDropdown(btn);
      dropdown.classList.add('open');
      dropdown.style.display = 'block';
    });
  });

  // Reposition on scroll/resize
  window.addEventListener('scroll', function() {
    if (dropdown.classList.contains('open') && currentBtn) {
      positionDropdown(currentBtn);
    }
  }, true);
  window.addEventListener('resize', function() {
    if (dropdown.classList.contains('open') && currentBtn) {
      positionDropdown(currentBtn);
    }
  });

  // Currency selection from dropdown
  dropdown.querySelectorAll('.currency-option').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var currency = this.getAttribute('data-currency');
      applyCurrency(currency);
      dropdown.classList.remove('open');
      dropdown.style.display = 'none';
      currentBtn = null;
    });
  });

  // Close on outside click
  document.addEventListener('click', function() {
    dropdown.classList.remove('open');
    dropdown.style.display = 'none';
    currentBtn = null;
  });

  // Load saved preference or default to 'USD'
  applyCurrency(localStorage.getItem('currency') || 'USD');
})();
