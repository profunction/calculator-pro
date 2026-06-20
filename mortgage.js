/* =====================================================
   Calculator Pro — mortgage.js (Enhanced with Country-Specific Logic)
   Supports: Malaysia BLR/BR, US APR, UK Base Rate, China LPR
   ===================================================== */
(function () {
  'use strict';

  function fmt(val, sym) {
    sym = sym || window.selectedCurrencySymbol || '$';
    return sym + ' ' + Math.round(val).toLocaleString('en-US');
  }

  function fmtDec(val, sym) {
    sym = sym || window.selectedCurrencySymbol || '$';
    return sym + ' ' + (Math.round(val * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ── Country-Specific Rate Info ──
  const countryInfo = {
    my: {
      label: 'BLR/BR',
      defaultRate: 4.5,
      defaultBR: 3.0,
      defaultSpread: 1.5,
      info: 'BR (Base Rate) + Spread = Lending Rate. Islamic loans use BFR.'
    },
    us: {
      label: 'APR',
      defaultRate: 7.0,
      info: 'APR includes interest + PMI + fees.'
    },
    uk: {
      label: 'Base Rate',
      defaultRate: 5.25,
      info: 'Bank of England Base Rate + Spread.'
    },
    cn: {
      label: 'LPR',
      defaultRate: 3.45,
      info: '5-year LPR for mortgages.'
    },
    sg: {
      label: 'SORA',
      defaultRate: 3.5,
      info: 'SORA (Singapore Overnight Rate Average) + Spread.'
    },
    other: {
      label: 'Rate',
      defaultRate: 5.0,
      info: ''
    }
  };

  // ── DOM References ──
  const form = document.getElementById('mortgageForm');
  const countrySelect = document.getElementById('mortgageCountry');
  const rateInput = document.getElementById('mortgageRate');
  const brInput = document.getElementById('mortgageBR');
  const spreadInput = document.getElementById('mortgageSpread');
  const priceInput = document.getElementById('homePrice');
  const downInput = document.getElementById('downPayment');
  const termInput = document.getElementById('mortgageTerm');
  const extraInput = document.getElementById('extraMortgage');

  const kpiMonthly = document.getElementById('kpiMonthly');
  const kpiTotal = document.getElementById('kpiTotal');
  const kpiInterest = document.getElementById('kpiInterest');
  const kpiLoanAmt = document.getElementById('kpiLoanAmt');
  const kpiEffectiveRate = document.getElementById('kpiEffectiveRate');
  const kpiSavings = document.getElementById('kpiSavings');

  const amortBody = document.getElementById('amortBody');
  const resultActions = document.getElementById('resultActions');
  const dashPrompt = document.getElementById('dashPrompt');

  // ── Country Changed ──
  function onCountryChange() {
    const country = countrySelect ? countrySelect.value : 'my';
    const info = countryInfo[country] || countryInfo['other'];

    // Update rate input
    if (rateInput && !rateInput.dataset.userSet) {
      rateInput.value = info.defaultRate;
    }

    // Show/hide Malaysia-specific fields
    const myFields = document.querySelectorAll('.field-my');
    myFields.forEach(function (el) { el.style.display = (country === 'my') ? '' : 'none'; });

    // Update rate label
    const rateLabel = document.querySelector('[for="mortgageRate"]');
    if (rateLabel) {
      rateLabel.textContent = (info.label || 'Interest Rate') + ' (%)';
    }
  }

  if (countrySelect) {
    countrySelect.addEventListener('change', onCountryChange);
    onCountryChange(); // Init
  }

  // ── Calculate Amortization Schedule ──
  function calcAmortization(amount, monthlyRate, monthlyPmt, extraPmt, totalMonths) {
    const schedule = [];
    let balance = amount;
    let totalInterest = 0;
    let month = 0;

    while (balance > 0.01 && month < totalMonths * 2) {
      month++;
      const interest = balance * monthlyRate;
      let principal = monthlyPmt - interest + extraPmt;
      if (principal > balance) principal = balance;
      balance -= principal;
      totalInterest += interest;
      schedule.push({
        month: month,
        payment: monthlyPmt + extraPmt,
        principal: principal,
        interest: interest,
        balance: balance
      });
      if (balance <= 0.01) break;
    }

    return { schedule: schedule, totalInterest: totalInterest, months: month };
  }

  // ── Calculate ──
  function calculate() {
    const country = countrySelect ? countrySelect.value : 'my';
    const price = parseFloat(priceInput ? priceInput.value : 0) || 0;
    let rate = parseFloat(rateInput ? rateInput.value : 0) || 0;
    const down = parseFloat(downInput ? downInput.value : 0) || 0;
    const term = parseInt(termInput ? termInput.value : 30) || 30;
    const extra = parseFloat(extraInput ? extraInput.value : 0) || 0;

    if (price <= 0) return;

    // Malaysia: calculate effective rate from BLR + Spread
    if (country === 'my') {
      const br = parseFloat(brInput ? brInput.value : 3.0) || 3.0;
      const spread = parseFloat(spreadInput ? spreadInput.value : 1.5) || 1.5;
      rate = br + spread;
      if (rateInput) rateInput.value = rate.toFixed(2);
    }

    const loanAmt = price - down;
    const totalMonths = term * 12;
    const monthlyRate = rate / 100 / 12;

    // Monthly payment (P&I)
    let monthlyPmt;
    if (monthlyRate === 0) {
      monthlyPmt = loanAmt / totalMonths;
    } else {
      monthlyPmt = loanAmt * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) /
                     (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    const result = calcAmortization(loanAmt, monthlyRate, monthlyPmt, extra, totalMonths);
    const totalPayment = result.schedule.reduce(function (sum, item) { return sum + item.payment; }, 0);

    // Update display
    if (kpiMonthly) kpiMonthly.textContent = fmtDec(monthlyPmt);
    if (kpiTotal) kpiTotal.textContent = fmt(totalPayment);
    if (kpiInterest) kpiInterest.textContent = fmt(result.totalInterest);
    if (kpiLoanAmt) kpiLoanAmt.textContent = fmt(loanAmt);

    // Malaysia-specific KPIs
    if (kpiEffectiveRate) {
      const effectiveRate = (result.totalInterest / loanAmt) / (result.months / 12) * 100;
      kpiEffectiveRate.textContent = effectiveRate.toFixed(2) + '%';
    }
    if (kpiSavings) {
      const withoutExtra = loanAmt * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) /
                         (Math.pow(1 + monthlyRate, totalMonths) - 1) * totalMonths;
      const savings = withoutExtra - totalPayment;
      kpiSavings.textContent = fmt(Math.max(0, savings));
    }

    // Render amortization table
    if (amortBody) {
      let html = '';
      const maxRows = 12;
      const step = Math.max(1, Math.floor(result.schedule.length / maxRows));

      for (let i = 0; i < result.schedule.length; i += step) {
        const item = result.schedule[i];
        if (!item) continue;
        html += '<tr>' +
          '<td>' + item.month + '</td>' +
          '<td>' + fmtDec(item.payment) + '</td>' +
          '<td>' + fmtDec(item.principal) + '</td>' +
          '<td>' + fmtDec(item.interest) + '</td>' +
          '<td>' + fmtDec(item.balance) + '</td>' +
          '</tr>';
      }

      // Always show last row
      if (result.schedule.length > 0) {
        const last = result.schedule[result.schedule.length - 1];
        if (last && last.month % step !== 0) {
          html += '<tr class="skip-row"><td colspan="5">...</td></tr>';
          html += '<tr>' +
            '<td>' + last.month + '</td>' +
            '<td>' + fmtDec(last.payment) + '</td>' +
            '<td>' + fmtDec(last.principal) + '</td>' +
            '<td>' + fmtDec(last.interest) + '</td>' +
            '<td>' + fmtDec(last.balance) + '</td>' +
            '</tr>';
        }
      }

      amortBody.innerHTML = html;
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
        if (amortBody) amortBody.innerHTML = '';
        document.querySelectorAll('.show-after-calc').forEach(function (el) { el.classList.remove('show-after-calc'); });
        if (rateInput) delete rateInput.dataset.userSet;
        onCountryChange();
      }, 10);
    });
  }

  // ── Rate input: mark as user-set ──
  if (rateInput) {
    rateInput.addEventListener('input', function () {
      rateInput.dataset.userSet = '1';
    });
  }

  // ── Copy Results ──
  const copyBtn = document.getElementById('copyResults');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const country = countrySelect ? countrySelect.value : 'my';
      const info = countryInfo[country] || countryInfo['other'];
      const price = parseFloat(priceInput ? priceInput.value : 0) || 0;
      const rate = parseFloat(rateInput ? rateInput.value : 0) || 0;

      const lines = [
        'Mortgage Calculator (' + info.label + '):',
        'Country: ' + (countrySelect ? countrySelect.options[countrySelect.selectedIndex].text : country),
        'Home Price: ' + fmt(price),
        'Rate: ' + rate + '%',
        'Monthly Payment: ' + (kpiMonthly ? kpiMonthly.textContent : ''),
        'Total Payment: ' + (kpiTotal ? kpiTotal.textContent : ''),
        'Total Interest: ' + (kpiInterest ? kpiInterest.textContent : '')
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
