/* =====================================================
   Calculator Pro — car-lease.js (Enhanced with Country-Specific Logic)
   Supports: Malaysia (road tax by engine CC), US, China, Singapore
   ===================================================== */
(function () {
  'use strict';

  function fmt(val, sym) {
    sym = sym || window.selectedCurrencySymbol || '$';
    return sym + ' ' + Math.round(val).toLocaleString('en-US');
  }

  // ── Malaysia Road Tax (by engine capacity CC) ──
  // Tiered rates (peninsular Malaysia, private cars)
  function calcMYRoadTax(cc) {
    if (cc <= 1000) return 20;
    if (cc <= 1200) return 55;
    if (cc <= 1400) return 70;
    if (cc <= 1600) return 90;
    if (cc <= 1800) return 125;
    if (cc <= 2000) return 195;
    if (cc <= 2500) return 410;
    if (cc <= 3000) return 850;
    return 2120; // >3000CC
  }

  // ── Malaysia Insurance (typical rates by car price) ──
  function calcMYInsurance(price) {
    // Simplified: ~1.5-3% of car price annually
    const rate = price > 150000 ? 0.025 : price > 80000 ? 0.022 : 0.02;
    return Math.round(price * rate);
  }

  // ── DOM References ──
  const form = document.getElementById('carForm');
  const countrySelect = document.getElementById('carCountry');
  const priceInput = document.getElementById('carPrice');
  const downInput = document.getElementById('carDown');
  const termInput = document.getElementById('carTerm');
  const rateInput = document.getElementById('carRate');
  const residualInput = document.getElementById('carResidual');
  const milesInput = document.getElementById('carMiles');
  const engineCCInput = document.getElementById('engineCC');
  const insuranceInput = document.getElementById('insuranceValue');

  const kpiMonthly = document.getElementById('kpiMonthly');
  const kpiTotal = document.getElementById('kpiTotal');
  const kpiRoadTax = document.getElementById('kpiRoadTax');
  const kpiInsurance = document.getElementById('kpiInsurance');

  const resultActions = document.getElementById('resultActions');
  const dashPrompt = document.getElementById('dashPrompt');

  // ── Country Changed ──
  function onCountryChange() {
    const country = countrySelect ? countrySelect.value : 'my';
    const isMY = country === 'my';

    // Show/hide Malaysia-specific fields
    const myFields = document.querySelectorAll('.field-my');
    myFields.forEach(function (el) { el.style.display = isMY ? '' : 'none'; });
  }

  if (countrySelect) {
    countrySelect.addEventListener('change', onCountryChange);
    onCountryChange(); // Init
  }

  // ── Calculate ──
  function calculate() {
    const country = countrySelect ? countrySelect.value : 'my';
    const price = parseFloat(priceInput ? priceInput.value : 0) || 0;
    const down = parseFloat(downInput ? downInput.value : 0) || 0;
    const term = parseInt(termInput ? termInput.value : 36) || 36;
    const rate = parseFloat(rateInput ? rateInput.value : 5.5) || 5.5;
    const residual = parseFloat(residualInput ? residualInput.value : 0) || 0;

    if (price <= 0) return;

    // Lease payment calculation (same as before)
    const netCap = price - down;
    const monthlyRate = rate / 100 / 12;
    let monthly;
    if (monthlyRate === 0) {
      monthly = (netCap - residual) / term;
    } else {
      const factor = monthlyRate * Math.pow(1 + monthlyRate, term) /
                    (Math.pow(1 + monthlyRate, term) - 1);
      monthly = (netCap - residual) * factor + (residual * monthlyRate);
    }
    const totalCost = monthly * term;

    // Update display
    if (kpiMonthly) kpiMonthly.textContent = fmt(monthly);
    if (kpiTotal) kpiTotal.textContent = fmt(totalCost);

    // Malaysia-specific: Road Tax + Insurance
    if (country === 'my') {
      const cc = parseInt(engineCCInput ? engineCCInput.value : 2000) || 2000;
      const roadTax = calcMYRoadTax(cc);
      if (kpiRoadTax) kpiRoadTax.textContent = fmt(roadTax);

      const insValue = parseFloat(insuranceInput ? insuranceInput.value : price) || price;
      const insurance = calcMYInsurance(insValue);
      if (kpiInsurance) kpiInsurance.textContent = fmt(insurance);
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
      }, 10);
    });
  }

  // ── Copy Results ──
  const copyBtn = document.getElementById('copyResults');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const country = countrySelect ? countrySelect.value : 'my';
      const price = parseFloat(priceInput ? priceInput.value : 0) || 0;
      const term = parseInt(termInput ? termInput.value : 36) || 36;

      const lines = [
        'Car Lease Calculator:',
        'Country: ' + (countrySelect ? countrySelect.options[countrySelect.selectedIndex].text : country),
        'Car Price: ' + fmt(price),
        'Term: ' + term + ' months',
        'Monthly Payment: ' + (kpiMonthly ? kpiMonthly.textContent : ''),
        'Total Cost: ' + (kpiTotal ? kpiTotal.textContent : '')
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
