/* =====================================================
   Calculator Pro — investment.js (Enhanced with Country-Specific Logic)
   Supports: Malaysia (3% inflation), US (3.5%), China (1.5%), EU (2.5%)
   ===================================================== */
(function () {
  'use strict';

  function fmt(val, sym) {
    sym = sym || window.selectedCurrencySymbol || '$';
    return sym + ' ' + Math.round(val).toLocaleString('en-US');
  }

  // ── Country-Specific Inflation Rates (2024 averages) ──
  const countryRates = {
    my: { inflation: 3.0, label: 'Malaysia', flag: '🇲🇾' },
    us: { inflation: 3.5, label: 'United States', flag: '🇺🇸' },
    cn: { inflation: 1.5, label: 'China', flag: '🇨🇳' },
    eu: { inflation: 2.5, label: 'Europe', flag: '🇪🇺' },
    sg: { inflation: 3.0, label: 'Singapore', flag: '🇸🇬' },
    other: { inflation: 3.0, label: 'Other', flag: '🌐' }
  };

  // ── DOM References ──
  const form = document.getElementById('investForm');
  const countrySelect = document.getElementById('investCountry');
  const inflationInput = document.getElementById('investInflation');
  const initialInput = document.getElementById('investInitial');
  const monthlyInput = document.getElementById('investMonthly');
  const returnInput = document.getElementById('investReturn');
  const yearsInput = document.getElementById('investYears');
  const compoundingSelect = document.getElementById('investCompounding');

  const kpiFuture = document.getElementById('kpiFuture');
  const kpiInvested = document.getElementById('kpiInvested');
  const kpiReturn = document.getElementById('kpiReturn');
  const kpiROI = document.getElementById('kpiROI');
  const kpiReal = document.getElementById('kpiReal');
  const kpiPowerLoss = document.getElementById('kpiPowerLoss');

  const resultActions = document.getElementById('resultActions');
  const dashPrompt = document.getElementById('dashPrompt');

  // ── Country Changed ──
  function onCountryChange() {
    const country = countrySelect ? countrySelect.value : 'my';
    const info = countryRates[country] || countryRates['other'];

    // Update inflation rate input
    if (inflationInput && !inflationInput.dataset.userSet) {
      inflationInput.value = info.inflation;
    }
  }

  if (countrySelect) {
    countrySelect.addEventListener('change', onCountryChange);
    onCountryChange(); // Init
  }

  // ── Calculate ──
  function calculate() {
    const country = countrySelect ? countrySelect.value : 'my';
    const initial = parseFloat(initialInput ? initialInput.value : 0) || 0;
    const monthly = parseFloat(monthlyInput ? monthlyInput.value : 0) || 0;
    const annualReturn = parseFloat(returnInput ? returnInput.value : 8) || 8;
    const years = parseInt(yearsInput ? yearsInput.value : 10) || 10;
    const compounding = parseInt(compoundingSelect ? compoundingSelect.value : 12) || 12;
    const inflation = parseFloat(inflationInput ? inflationInput.value : 3) || 3;

    if (initial <= 0 && monthly <= 0) return;

    // Calculate future value with compounding
    const n = compounding; // compounding periods per year
    const r = annualReturn / 100 / n; // rate per period
    const totalPeriods = years * n;

    // Future value of initial investment
    const fvInitial = initial * Math.pow(1 + r, totalPeriods);

    // Future value of monthly contributions (annuity)
    let fvMonthly = 0;
    if (monthly > 0 && r > 0) {
      const periodsPerYear = n;
      const contributionPerPeriod = monthly * (12 / n);
      fvMonthly = contributionPerPeriod * (Math.pow(1 + r, totalPeriods) - 1) / r;
    } else if (monthly > 0) {
      fvMonthly = monthly * 12 * years;
    }

    const futureValue = fvInitial + fvMonthly;
    const totalInvested = initial + (monthly * 12 * years);
    const totalReturn = futureValue - totalInvested;
    const roi = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    // Real value (inflation-adjusted)
    const realValue = futureValue / Math.pow(1 + inflation / 100, years);
    const purchasingPowerLoss = futureValue - realValue;

    // Update display
    if (kpiFuture) kpiFuture.textContent = fmt(futureValue);
    if (kpiInvested) kpiInvested.textContent = fmt(totalInvested);
    if (kpiReturn) kpiReturn.textContent = fmt(totalReturn);
    if (kpiROI) kpiROI.textContent = roi.toFixed(2) + '%';
    if (kpiReal) kpiReal.textContent = fmt(realValue);
    if (kpiPowerLoss) kpiPowerLoss.textContent = fmt(purchasingPowerLoss);

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
        if (inflationInput) delete inflationInput.dataset.userSet;
        onCountryChange();
      }, 10);
    });
  }

  // ── Inflation input: mark as user-set ──
  if (inflationInput) {
    inflationInput.addEventListener('input', function () {
      inflationInput.dataset.userSet = '1';
    });
  }

  // ── Copy Results ──
  const copyBtn = document.getElementById('copyResults');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const country = countrySelect ? countrySelect.value : 'my';
      const info = countryRates[country] || countryRates['other'];
      const initial = parseFloat(initialInput ? initialInput.value : 0) || 0;
      const years = parseInt(yearsInput ? yearsInput.value : 10) || 10;

      const lines = [
        'Investment Calculator:',
        'Country: ' + info.label,
        'Initial: ' + fmt(initial),
        'Period: ' + years + ' years',
        'Future Value: ' + (kpiFuture ? kpiFuture.textContent : ''),
        'Total Invested: ' + (kpiInvested ? kpiInvested.textContent : ''),
        'Total Return: ' + (kpiReturn ? kpiReturn.textContent : ''),
        'ROI: ' + (kpiROI ? kpiROI.textContent : ''),
        'Real Value (inflation-adjusted): ' + (kpiReal ? kpiReal.textContent : '')
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
