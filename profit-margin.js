/* =====================================================
   Calculator Pro — profit-margin.js (Enhanced with Country-Specific Logic)
   Supports: Malaysia (24%), US (21%), China (25%), Singapore (17%), etc.
   ===================================================== */
(function () {
  'use strict';

  function fmt(val, sym) {
    sym = sym || window.selectedCurrencySymbol || '$';
    return sym + ' ' + Math.round(val).toLocaleString('en-US');
  }

  // ── Country-Specific Corporate Tax Rates (2024) ──
  const countryTaxRates = {
    my: { rate: 24, label: 'Malaysia', flag: '🇲🇾' },
    us: { rate: 21, label: 'United States', flag: '🇺🇸' },
    cn: { rate: 25, label: 'China', flag: '🇨🇳' },
    sg: { rate: 17, label: 'Singapore', flag: '🇸🇬' },
    uk: { rate: 25, label: 'United Kingdom', flag: '🇬🇧' },
    eu: { rate: 21, label: 'Euro zone (avg)', flag: '🇪🇺' },
    other: { rate: 20, label: 'Other', flag: '🌐' }
  };

  // ── DOM References ──
  const form = document.getElementById('profitForm');
  const countrySelect = document.getElementById('profitCountry');
  const costInput = document.getElementById('costPrice');
  const sellingInput = document.getElementById('sellingPrice');
  const fixedCostsInput = document.getElementById('fixedCosts');
  const corpTaxInput = document.getElementById('corpTax');

  const kpiMargin = document.getElementById('kpiMargin');
  const kpiMarkup = document.getElementById('kpiMarkup');
  const kpiProfit = document.getElementById('kpiProfit');
  const kpiAfterTax = document.getElementById('kpiAfterTax');
  const kpiBreakeven = document.getElementById('kpiBreakeven');
  const kpiTarget = document.getElementById('kpiTarget');

  const resultActions = document.getElementById('resultActions');
  const dashPrompt = document.getElementById('dashPrompt');

  // ── Country Changed ──
  function onCountryChange() {
    const country = countrySelect ? countrySelect.value : 'my';
    const info = countryTaxRates[country] || countryTaxRates['other'];

    // Update tax rate input
    if (corpTaxInput && !corpTaxInput.dataset.userSet) {
      corpTaxInput.value = info.rate;
    }
  }

  if (countrySelect) {
    countrySelect.addEventListener('change', onCountryChange);
    onCountryChange(); // Init
  }

  // ── Calculate ──
  function calculate() {
    const country = countrySelect ? countrySelect.value : 'my';
    const cost = parseFloat(costInput ? costInput.value : 0) || 0;
    const selling = parseFloat(sellingInput ? sellingInput.value : 0) || 0;
    const fixed = parseFloat(fixedCostsInput ? fixedCostsInput.value : 0) || 0;
    const taxRate = parseFloat(corpTaxInput ? corpTaxInput.value : 24) || 24;

    if (cost <= 0 || selling <= 0) return;

    // Profit calculations
    const profit = selling - cost;
    const margin = (profit / selling) * 100;
    const markup = (profit / cost) * 100;

    // After-tax profit
    const afterTax = profit * (1 - taxRate / 100);

    // Break-even units (fixed costs / profit per unit)
    const breakEven = fixed > 0 && profit > 0 ? Math.ceil(fixed / profit) : 0;

    // Target units for target profit (assuming target = fixed costs)
    const targetUnits = profit > 0 ? Math.ceil((fixed + profit * 12) / profit) : 0;

    // Update display
    if (kpiMargin) kpiMargin.textContent = margin.toFixed(2) + '%';
    if (kpiMarkup) kpiMarkup.textContent = markup.toFixed(2) + '%';
    if (kpiProfit) kpiProfit.textContent = fmt(profit);
    if (kpiAfterTax) kpiAfterTax.textContent = fmt(afterTax);
    if (kpiBreakeven) kpiBreakeven.textContent = breakEven > 0 ? breakEven + ' units' : 'N/A';
    if (kpiTarget) kpiTarget.textContent = targetUnits > 0 ? targetUnits + ' units' : 'N/A';

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
        if (corpTaxInput) delete corpTaxInput.dataset.userSet;
        onCountryChange();
      }, 10);
    });
  }

  // ── Tax input: mark as user-set ──
  if (corpTaxInput) {
    corpTaxInput.addEventListener('input', function () {
      corpTaxInput.dataset.userSet = '1';
    });
  }

  // ── Copy Results ──
  const copyBtn = document.getElementById('copyResults');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const country = countrySelect ? countrySelect.value : 'my';
      const info = countryTaxRates[country] || countryTaxRates['other'];
      const cost = parseFloat(costInput ? costInput.value : 0) || 0;
      const selling = parseFloat(sellingInput ? sellingInput.value : 0) || 0;

      const lines = [
        'Profit Margin Calculator (' + info.label + '):',
        'Country: ' + (countrySelect ? countrySelect.options[countrySelect.selectedIndex].text : country),
        'Cost Price: ' + fmt(cost),
        'Selling Price: ' + fmt(selling),
        'Profit Margin: ' + (kpiMargin ? kpiMargin.textContent : ''),
        'Profit Markup: ' + (kpiMarkup ? kpiMarkup.textContent : ''),
        'Profit Amount: ' + (kpiProfit ? kpiProfit.textContent : ''),
        'After Tax: ' + (kpiAfterTax ? kpiAfterTax.textContent : '')
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
