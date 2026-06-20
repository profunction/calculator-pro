/* =====================================================
   Calculator Pro — salary.js (Enhanced with Country-Specific Logic)
   Supports: Malaysia, China, Singapore, US, EU
   ===================================================== */
(function () {
  'use strict';

  function fmt(val, sym) {
    sym = sym || window.selectedCurrencySymbol || '$';
    return sym + ' ' + Math.round(val).toLocaleString('en-US');
  }

  // ── Malaysia EPF Rates (2024) ──
  // Employee: 9% (citizens opt 9% or 11%), non-citizens 11%
  // Employer: 12% (<=5000), 13% (>5000)
  function calcMalaysiaSalary(grossAnnual, isCitizen, isEPFOptional) {
    const grossMonthly = grossAnnual / 12;
    const employeeRate = (isCitizen && isEPFOptional) ? 0.09 : 0.11;
    const employerRate = grossMonthly <= 5000 ? 0.13 : 0.12;

    // EPF (capped at RM7000 salary)
    const epfEligible = Math.min(grossMonthly, 7000);
    const epfEmployee = Math.round(epfEligible * employeeRate);
    const epfEmployer = Math.round(epfEligible * employerRate);

    // SOCSO (capped at RM4000)
    const socsoEligible = Math.min(grossMonthly, 4000);
    const socsoEmployee = Math.round(socsoEligible * 0.005); // 0.5%
    const socsoEmployer = Math.round(socsoEligible * 0.0175); // 1.75%

    // EIS (capped at RM5000)
    const eisEligible = Math.min(grossMonthly, 5000);
    const eisEmployee = Math.round(eisEligible * 0.002); // 0.2%
    const eisEmployer = Math.round(eisEligible * 0.002); // 0.2%

    const totalDeductions = epfEmployee + socsoEmployee + eisEmployee;
    const netMonthly = grossMonthly - totalDeductions;
    const netAnnual = netMonthly * 12;

    return {
      epfEmployee, epfEmployer, socsoEmployee, socsoEmployer,
      eisEmployee, eisEmployer, totalDeductions,
      netMonthly, netAnnual, grossMonthly
    };
  }

  // ── China Social Security ──
  function calcChinaSalary(grossAnnual) {
    const grossMonthly = grossAnnual / 12;
    // Simplified: Pension 8%, Medical 2%, Unemployment 0.5%
    const pension = Math.round(grossMonthly * 0.08);
    const medical = Math.round(grossMonthly * 0.02);
    const unemployment = Math.round(grossMonthly * 0.005);
    // Housing fund 5-12% (use 7%)
    const housingFund = Math.round(grossMonthly * 0.07);

    const totalDeductions = pension + medical + unemployment + housingFund;
    const netMonthly = grossMonthly - totalDeductions;
    const netAnnual = netMonthly * 12;

    return {
      pension, medical, unemployment, housingFund, totalDeductions,
      netMonthly, netAnnual, grossMonthly
    };
  }

  // ── US Federal Tax (Simplified 2024 brackets - single) ──
  function calcUSSalary(grossAnnual) {
    const grossMonthly = grossAnnual / 12;
    // Simplified federal tax
    let federalTax = 0;
    const taxable = Math.max(0, grossAnnual - 14600); // Standard deduction 2024
    if (taxable <= 11600) federalTax = taxable * 0.10;
    else if (taxable <= 47150) federalTax = 11600 * 0.10 + (taxable - 11600) * 0.12;
    else federalTax = 11600 * 0.10 + (47150 - 11600) * 0.12 + (taxable - 47150) * 0.22;

    // FICA: Social Security 6.2% (capped 168600), Medicare 1.45%
    const ssWage = Math.min(grossAnnual, 168600);
    const socialSecurity = ssWage * 0.062;
    const medicare = grossAnnual * 0.0145;
    const fica = socialSecurity + medicare;

    const totalDeductions = (federalTax + fica) / 12;
    const netMonthly = grossMonthly - totalDeductions;
    const netAnnual = netMonthly * 12;

    return {
      federalTax: federalTax / 12, socialSecurity: socialSecurity / 12,
      medicare: medicare / 12, fica: fica / 12,
      totalDeductions, netMonthly, netAnnual, grossMonthly
    };
  }

  // ── Generic/Other Countries ──
  function calcGenericSalary(grossAnnual, taxRate) {
    const grossMonthly = grossAnnual / 12;
    const annualTax = grossAnnual * (taxRate / 100);
    const monthlyTax = annualTax / 12;
    const netMonthly = grossMonthly - monthlyTax;
    const netAnnual = netMonthly * 12;
    return { monthlyTax, annualTax, netMonthly, netAnnual, grossMonthly };
  }

  // ── DOM References ──
  const form = document.getElementById('salaryForm');
  const countrySelect = document.getElementById('salaryCountry');
  const epfOptCheck = document.getElementById('epfOptional');
  const nonCitizenCheck = document.getElementById('nonCitizen');
  
  const grossInput = document.getElementById('grossSalary');
  const taxRateInput = document.getElementById('taxRate');
  const deductionsInput = document.getElementById('deductions');
  const workHoursInput = document.getElementById('workHours');
  const overtimeHoursInput = document.getElementById('overtimeHours');
  const overtimeRateInput = document.getElementById('overtimeRate');
  const bonusInput = document.getElementById('bonus');

  // Result displays
  const kpiNetAnnual = document.getElementById('kpiNetAnnual');
  const kpiNetMonthly = document.getElementById('kpiNetMonthly');
  const kpiHourly = document.getElementById('kpiHourly');
  const kpiTaxPaid = document.getElementById('kpiTaxPaid');
  const kpiOvertime = document.getElementById('kpiOvertime');
  const kpiBonus = document.getElementById('kpiBonus');
  const kpiEpf = document.getElementById('kpiEpf');
  const kpiSocso = document.getElementById('kpiSocso');

  const resultActions = document.getElementById('resultActions');
  const dashPrompt = document.getElementById('dashPrompt');

  // ── Country changed ──
  function onCountryChange() {
    const country = countrySelect ? countrySelect.value : 'my';
    const isMY = country === 'my';
    const isCN = country === 'cn';
    const isUS = country === 'us';

    // Show/hide country-specific fields
    const myFields = document.querySelectorAll('.field-my');
    const cnFields = document.querySelectorAll('.field-cn');
    const usFields = document.querySelectorAll('.field-us');
    const genericFields = document.querySelectorAll('.field-generic');

    myFields.forEach(el => el.style.display = isMY ? '' : 'none');
    cnFields.forEach(el => el.style.display = isCN ? '' : 'none');
    usFields.forEach(el => el.style.display = isUS ? '' : 'none');
    genericFields.forEach(el => el.style.display = (isMY || isCN || isUS) ? 'none' : '');

    // Update tax rate label
    const taxRateLabel = document.querySelector('[for="taxRate"]');
    if (taxRateLabel) {
      if (isMY) taxRateLabel.textContent = _t('salary.label.epf') || 'EPF Rate';
      else if (isCN) taxRateLabel.textContent = _t('salary.label.social') || 'Social Security Rate';
      else if (isUS) taxRateLabel.textContent = _t('salary.label.federal') || 'Federal Tax Rate';
      else taxRateLabel.textContent = _t('salary.label.taxRate') || 'Tax Rate (%)';
    }
  }

  if (countrySelect) {
    countrySelect.addEventListener('change', onCountryChange);
    onCountryChange(); // Init
  }

  // ── Calculate ──
  function calculate() {
    const country = countrySelect ? countrySelect.value : 'my';
    const gross = parseFloat(grossInput ? grossInput.value : 0) || 0;
    const bonus = parseFloat(bonusInput ? bonusInput.value : 0) || 0;
    const hours = parseFloat(workHoursInput ? workHoursInput.value : 40) || 40;
    const otHours = parseFloat(overtimeHoursInput ? overtimeHoursInput.value : 0) || 0;
    const otRate = parseFloat(overtimeRateInput ? overtimeRateInput.value : 150) || 150;

    if (gross <= 0) return;

    let result = {};

    if (country === 'my') {
      // Malaysia
      const isCitizen = !(nonCitizenCheck && nonCitizenCheck.checked);
      const isEPFOpt = epfOptCheck && epfOptCheck.checked;
      result = calcMalaysiaSalary(gross, isCitizen, isEPFOpt);
      
      if (kpiEpf) kpiEpf.textContent = fmt(result.epfEmployee);
      if (kpiSocso) kpiSocso.textContent = fmt(result.socsoEmployee + result.eisEmployee);
      if (kpiNetMonthly) kpiNetMonthly.textContent = fmt(result.netMonthly);
      if (kpiNetAnnual) kpiNetAnnual.textContent = fmt(result.netAnnual + bonus);
      if (kpiTaxPaid) kpiTaxPaid.textContent = fmt(result.totalDeductions * 12);

    } else if (country === 'cn') {
      // China
      result = calcChinaSalary(gross);
      if (kpiNetMonthly) kpiNetMonthly.textContent = fmt(result.netMonthly);
      if (kpiNetAnnual) kpiNetAnnual.textContent = fmt(result.netAnnual + bonus);
      if (kpiTaxPaid) kpiTaxPaid.textContent = fmt(result.totalDeductions * 12);

    } else if (country === 'us') {
      // US
      result = calcUSSalary(gross);
      if (kpiNetMonthly) kpiNetMonthly.textContent = fmt(result.netMonthly);
      if (kpiNetAnnual) kpiNetAnnual.textContent = fmt(result.netAnnual + bonus);
      if (kpiTaxPaid) kpiTaxPaid.textContent = fmt(result.federalTax * 12 + result.fica * 12);

    } else {
      // Generic
      const taxRate = parseFloat(taxRateInput ? taxRateInput.value : 0) || 0;
      result = calcGenericSalary(gross, taxRate);
      if (kpiNetMonthly) kpiNetMonthly.textContent = fmt(result.netMonthly);
      if (kpiNetAnnual) kpiNetAnnual.textContent = fmt(result.netAnnual + bonus);
      if (kpiTaxPaid) kpiTaxPaid.textContent = fmt(result.annualTax);
    }

    // Overtime
    const grossMonthly = gross / 12;
    const hourlyRate = grossMonthly / (hours * 4.33);
    const otMultiplier = otRate / 100;
    const otPay = hourlyRate * otHours * otMultiplier * 4.33;
    
    if (kpiOvertime) kpiOvertime.textContent = fmt(otPay);
    if (kpiBonus) kpiBonus.textContent = fmt(bonus * (1 - (country === 'my' ? 0.11 : country === 'cn' ? 0.105 : 0.12)));
    if (kpiHourly) kpiHourly.textContent = fmt(hourlyRate) + '/hr';

    // Show results
    if (dashPrompt) dashPrompt.style.display = 'none';
    if (resultActions) {
      resultActions.querySelectorAll('button').forEach(b => b.disabled = false);
    }
    document.querySelectorAll('.hidden-until-calc').forEach(el => el.classList.remove('hidden-until-calc'));
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
          resultActions.querySelectorAll('button').forEach(b => b.disabled = true);
        }
        document.querySelectorAll('.show-after-calc').forEach(el => el.classList.remove('show-after-calc'));
      }, 10);
    });
  }

  // ── Copy Results ──
  const copyBtn = document.getElementById('copyResults');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const country = countrySelect ? countrySelect.value : 'my';
      const gross = parseFloat(grossInput ? grossInput.value : 0) || 0;
      const lines = [
        _t('salary.hero.title') + ':',
        'Country: ' + (countrySelect ? countrySelect.options[countrySelect.selectedIndex].text : country),
        _t('salary.label.gross') + ': ' + fmt(gross),
        _t('salary.result.netMonthly') + ': ' + (kpiNetMonthly ? kpiNetMonthly.textContent : ''),
        _t('salary.result.netAnnual') + ': ' + (kpiNetAnnual ? kpiNetAnnual.textContent : ''),
        _t('salary.result.hourly') + ': ' + (kpiHourly ? kpiHourly.textContent : ''),
        _t('salary.result.taxPaid') + ': ' + (kpiTaxPaid ? kpiTaxPaid.textContent : '')
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
