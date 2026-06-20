/* =====================================================
   Calculator Pro — rental-yield.js (Enhanced with Country-Specific Logic)
   Supports: Malaysia (RPGT), US, China, Singapore, UK
   ===================================================== */
(function () {
  'use strict';

  function fmt(val, sym) {
    sym = sym || window.selectedCurrencySymbol || '$';
    return sym + ' ' + Math.round(val).toLocaleString('en-US');
  }

  // ── Malaysia RPGT (Real Property Gains Tax) ──
  // Simplified: Rate depends on holding period and citizenship
  function calcMYRPGT(gain, holdingYears, isCitizen) {
    let rate = 0;
    if (isCitizen) {
      if (holdingYears <= 2) rate = 0.30;
      else if (holdingYears <= 5) rate = 0.20;
      else rate = 0.05; // >5 years
    } else {
      // Non-citizen
      if (holdingYears <= 5) rate = 0.30;
      else rate = 0.10; // >5 years
    }
    return gain * rate;
  }

  // ── DOM References ──
  const form = document.getElementById('rentalForm');
  const countrySelect = document.getElementById('rentalCountry');
  const valueInput = document.getElementById('propertyValue');
  const rentInput = document.getElementById('monthlyRent');
  const vacancyInput = document.getElementById('vacancyRate');
  const expensesInput = document.getElementById('monthlyExpenses');
  const holdingInput = document.getElementById('holdingYears');
  const rpggtInput = document.getElementById('rpggtRate');

  const kpiGrossYield = document.getElementById('kpiGrossYield');
  const kpiNetYield = document.getElementById('kpiNetYield');
  const kpiAnnualIncome = document.getElementById('kpiAnnualIncome');
  const kpiROI = document.getElementById('kpiROI');
  const kpiRPGT = document.getElementById('kpiRPGT');
  const kpiAfterTax = document.getElementById('kpiAfterTax');

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
    const value = parseFloat(valueInput ? valueInput.value : 0) || 0;
    const monthlyRent = parseFloat(rentInput ? rentInput.value : 0) || 0;
    const vacancy = parseFloat(vacancyInput ? vacancyInput.value : 5) || 5;
    const expenses = parseFloat(expensesInput ? expensesInput.value : 0) || 0;

    if (value <= 0 || monthlyRent <= 0) return;

    // Calculate yields
    const annualIncome = monthlyRent * 12 * (1 - vacancy / 100);
    const netAnnualIncome = annualIncome - (expenses * 12);
    const grossYield = (annualIncome / value) * 100;
    const netYield = (netAnnualIncome / value) * 100;
    const roi = netYield; // Simplified ROI = net yield

    // Update display
    if (kpiGrossYield) kpiGrossYield.textContent = grossYield.toFixed(2) + '%';
    if (kpiNetYield) kpiNetYield.textContent = netYield.toFixed(2) + '%';
    if (kpiAnnualIncome) kpiAnnualIncome.textContent = fmt(annualIncome);
    if (kpiROI) kpiROI.textContent = roi.toFixed(2) + '%';

    // Malaysia-specific: RPGT calculation
    if (country === 'my') {
      const holding = parseInt(holdingInput ? holdingInput.value : 5) || 5;
      const isCitizen = !(document.getElementById('nonCitizenRental') && document.getElementById('nonCitizenRental').checked);
      
      // Estimate potential gain (simplified: 5% annual appreciation)
      const potentialGain = value * Math.pow(1.05, holding) - value;
      const rpggt = calcMYRPGT(potentialGain, holding, isCitizen);
      
      if (kpiRPGT) kpiRPGT.textContent = fmt(rpggt);
      if (kpiAfterTax) kpiAfterTax.textContent = fmt(netAnnualIncome - rpggt / holding);
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
      const value = parseFloat(valueInput ? valueInput.value : 0) || 0;
      const rent = parseFloat(rentInput ? rentInput.value : 0) || 0;

      const lines = [
        'Rental Yield Calculator:',
        'Country: ' + (countrySelect ? countrySelect.options[countrySelect.selectedIndex].text : country),
        'Property Value: ' + fmt(value),
        'Monthly Rent: ' + fmt(rent),
        'Gross Yield: ' + (kpiGrossYield ? kpiGrossYield.textContent : ''),
        'Net Yield: ' + (kpiNetYield ? kpiNetYield.textContent : ''),
        'Annual Income: ' + (kpiAnnualIncome ? kpiAnnualIncome.textContent : '')
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
