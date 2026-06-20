/* =====================================================
   Calculator Pro — vat.js (Enhanced with Country-Specific Logic)
   Supports: Malaysia SST, China VAT, Singapore GST, US Sales Tax, EU VAT
   ===================================================== */
(function () {
  'use strict';

  function fmt(val, sym) {
    sym = sym || window.selectedCurrencySymbol || '$';
    return sym + ' ' + Math.round(val * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ── Country-Specific Tax Info ──
  const countryRates = {
    my: { defaultRate: 6, label: 'SST', presets: [6, 10] },
    cn: { defaultRate: 13, label: 'VAT', presets: [13, 9, 6] },
    sg: { defaultRate: 9, label: 'GST', presets: [9] },
    us: { defaultRate: 7, label: 'Sales Tax', presets: [7, 8.25, 6, 4] },
    eu: { defaultRate: 20, label: 'VAT', presets: [20, 19, 21, 23] },
    other: { defaultRate: 10, label: 'Tax', presets: [10, 15, 5] }
  };

  // ── DOM References ──
  const form = document.getElementById('vatForm');
  const countrySelect = document.getElementById('vatCountry');
  const rateInput = document.getElementById('vatRate');
  const amountInput = document.getElementById('vatAmount');
  const modeRadios = document.querySelectorAll('input[name="vatMode"]');

  const kpiGross = document.getElementById('kpiGross');
  const kpiTax = document.getElementById('kpiTax');
  const kpiNet = document.getElementById('kpiNet');
  const kpiSstInfo = document.getElementById('kpiSstInfo');

  const resultActions = document.getElementById('resultActions');
  const dashPrompt = document.getElementById('dashPrompt');

  // ── Country Changed ──
  function onCountryChange() {
    const country = countrySelect ? countrySelect.value : 'my';
    const info = countryRates[country] || countryRates['other'];

    // Update rate input
    if (rateInput && !rateInput.dataset.userSet) {
      rateInput.value = info.defaultRate;
    }

    // Show/hide preset buttons
    const allPresets = document.querySelectorAll('.rate-btn');
    allPresets.forEach(function (btn) {
      const parent = btn.closest('.rate-presets');
      if (parent) {
        // Show only matching country presets
        const rate = parseFloat(btn.dataset.rate);
        let show = false;
        if (country === 'my' && (rate === 6 || rate === 10)) show = true;
        else if (country === 'cn' && (rate === 13 || rate === 9 || rate === 6)) show = true;
        else if (country === 'sg' && rate === 9) show = true;
        else if (country === 'us') show = true;
        else if (country === 'other') show = true;
        btn.style.display = show ? 'inline-block' : 'none';
      }
    });

    // Update SST info label
    const sstLabel = document.querySelector('[data-i18n="vat.result.sstInfo"]');
    if (sstLabel) {
      sstLabel.textContent = info.label + ' Info';
    }
  }

  if (countrySelect) {
    countrySelect.addEventListener('change', onCountryChange);
    onCountryChange(); // Init
  }

  // ── Rate Preset Buttons ──
  document.querySelectorAll('.rate-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (rateInput) {
        rateInput.value = btn.dataset.rate;
        rateInput.dataset.userSet = '1';
      }
    });
  });

  // ── Mode Tabs ──
  document.querySelectorAll('.radio-label').forEach(function (label) {
    label.addEventListener('click', function () {
      document.querySelectorAll('.radio-label').forEach(function (l) { l.classList.remove('active'); });
      label.classList.add('active');
    });
  });

  // ── Calculate ──
  function calculate() {
    const country = countrySelect ? countrySelect.value : 'my';
    const amount = parseFloat(amountInput ? amountInput.value : 0) || 0;
    const rate = parseFloat(rateInput ? rateInput.value : 6) || 0;
    const mode = document.querySelector('input[name="vatMode"]:checked');
    const modeVal = mode ? mode.value : 'add';

    if (amount <= 0) return;

    let gross, net, tax;

    if (modeVal === 'add') {
      // Add tax: net + tax = gross
      net = amount;
      tax = net * (rate / 100);
      gross = net + tax;
    } else if (modeVal === 'remove') {
      // Remove tax: gross - tax = net
      gross = amount;
      tax = gross * (rate / 100) / (1 + rate / 100);
      net = gross - tax;
    } else {
      // Inclusive: amount includes tax
      gross = amount;
      tax = gross * (rate / 100) / (1 + rate / 100);
      net = gross - tax;
    }

    // Update display
    if (kpiGross) kpiGross.textContent = fmt(gross);
    if (kpiTax) kpiTax.textContent = fmt(tax);
    if (kpiNet) kpiNet.textContent = fmt(net);

    // Country-specific info
    if (kpiSstInfo) {
      const info = countryRates[country] || countryRates['other'];
      if (country === 'my') {
        kpiSstInfo.innerHTML = '<strong>SST ' + rate + '%</strong><br>' +
          (rate === 6 ? 'Service Tax (restaurants, hotels, etc.)' : 'Sales Tax (specific goods)');
      } else if (country === 'cn') {
        kpiSstInfo.innerHTML = '<strong>VAT ' + rate + '%</strong><br>' +
          (rate === 13 ? 'Standard rate' : rate === 9 ? 'Low rate (food, water, etc.)' : 'Low rate (books, etc.)');
      } else {
        kpiSstInfo.innerHTML = '<strong>' + info.label + ' ' + rate + '%</strong>';
      }
    }

    // Show results
    if (dashPrompt) dashPrompt.style.display = 'none';
    if (resultActions) {
      resultActions.querySelectorAll('button').forEach(function (b) { b.disabled = false; });
    }
    document.querySelectorAll('.hidden-until-calc').forEach(function (el) { el.classList.remove('hidden-until-calc'); });
  }

  // ── Form Events ──
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      calculate();
    });
    form.addEventListener('reset', function () {
      setTimeout(function () {
        if (dashPrompt) dashPrompt.style.display = '';
        if (resultActions) {
          resultActions.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
        }
        document.querySelectorAll('.show-after-calc').forEach(function (el) { el.classList.remove('show-after-calc'); });
        if (rateInput) delete rateInput.dataset.userSet;
        onCountryChange();
      }, 10);
    });
  }

  // ── Copy Results ──
  const copyBtn = document.getElementById('copyResults');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const country = countrySelect ? countrySelect.value : 'my';
      const info = countryRates[country] || countryRates['other'];
      const amount = parseFloat(amountInput ? amountInput.value : 0) || 0;
      const rate = parseFloat(rateInput ? rateInput.value : 6) || 0;
      const mode = document.querySelector('input[name="vatMode"]:checked');
      const modeVal = mode ? mode.value : 'add';

      const lines = [
        info.label + ' Calculator:',
        'Country: ' + (countrySelect ? countrySelect.options[countrySelect.selectedIndex].text : country),
        'Amount: ' + fmt(amount),
        'Rate: ' + rate + '%',
        'Mode: ' + modeVal,
        'Gross: ' + (kpiGross ? kpiGross.textContent : ''),
        'Tax: ' + (kpiTax ? kpiTax.textContent : ''),
        'Net: ' + (kpiNet ? kpiNet.textContent : '')
      ];
      navigator.clipboard.writeText(lines.join('\n'));
    });
  }

  // ── Currency Change ──
  document.addEventListener('currencyChanged', function (e) {
    document.querySelectorAll('.currency-prefix').forEach(function (el) {
      el.textContent = window.selectedCurrencySymbol || '$';
    });
  });

  // ── Init ──
  if (window._t) {
    applyTranslation(window.currentLang || 'en');
  }

})();
