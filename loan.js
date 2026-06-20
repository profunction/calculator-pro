/* =====================================================
   Calculator Pro — loan.js (Enhanced with Country-Specific Logic)
   Supports: Malaysia BLR/BFR, China LPR, US APR, and more
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
      defaultBLR: 3.0,
      defaultSpread: 1.5,
      info: 'BR (Base Rate) + Spread = Lending Rate. Islamic loans use BFR.'
    },
    cn: {
      label: 'LPR',
      defaultRate: 3.45,
      info: '1-year LPR (Loan Prime Rate) as of 2024.'
    },
    sg: {
      label: 'SORA',
      defaultRate: 3.5,
      info: 'SORA (Singapore Overnight Rate Average) + Spread.'
    },
    us: {
      label: 'APR',
      defaultRate: 7.5,
      info: 'APR includes interest + fees. Use 700-800 credit score for best rates.'
    },
    eu: {
      label: 'Euribor',
      defaultRate: 4.0,
      info: 'Euribor-based variable rate loans.'
    },
    other: {
      label: 'Rate',
      defaultRate: 5.0,
      info: ''
    }
  };

  // ── DOM References ──
  const form = document.getElementById('loanForm');
  const countrySelect = document.getElementById('loanCountry');
  const rateInput = document.getElementById('loanRate');
  const blrInput = document.getElementById('blrRate');
  const spreadInput = document.getElementById('loanSpread');
  const amountInput = document.getElementById('loanAmount');
  const termInput = document.getElementById('loanTerm');
  const termUnitSelect = document.getElementById('loanTermUnit');
  const extraInput = document.getElementById('extraPayment');

  const kpiMonthly = document.getElementById('kpiMonthly');
  const kpiTotal = document.getElementById('kpiTotal');
  const kpiInterest = document.getElementById('kpiInterest');
  const kpiPayoff = document.getElementById('kpiPayoff');
  const kpiEffectiveRate = document.getElementById('kpiEffectiveRate');
  const kpiSavings = document.getElementById('kpiSavings');

  const amortBody = document.getElementById('amortBody');
  const amortSection = document.getElementById('amortSection');
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
    const rateLabel = document.querySelector('[for="loanRate"]');
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
    const amount = parseFloat(amountInput ? amountInput.value : 0) || 0;
    let rate = parseFloat(rateInput ? rateInput.value : 0) || 0;
    const term = parseInt(termInput ? termInput.value : 5) || 5;
    const termUnit = termUnitSelect ? termUnitSelect.value : 'years';
    const extra = parseFloat(extraInput ? extraInput.value : 0) || 0;

    if (amount <= 0) return;

    // Malaysia: calculate effective rate from BLR + Spread
    if (country === 'my') {
      const blr = parseFloat(blrInput ? blrInput.value : 3.0) || 3.0;
      const spread = parseFloat(spreadInput ? spreadInput.value : 1.5) || 1.5;
      rate = blr + spread; // Effective lending rate
      if (rateInput) rateInput.value = rate.toFixed(2);
    }

    const totalMonths = termUnit === 'years' ? term * 12 : term;
    const monthlyRate = rate / 100 / 12;

    // Monthly payment (standard amortization)
    let monthlyPmt;
    if (monthlyRate === 0) {
      monthlyPmt = amount / totalMonths;
    } else {
      monthlyPmt = amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) /
                     (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    const result = calcAmortization(amount, monthlyRate, monthlyPmt, extra, totalMonths);
    const totalPayment = result.schedule.reduce(function (sum, item) { return sum + item.payment; }, 0);

    // Update display
    if (kpiMonthly) kpiMonthly.textContent = fmtDec(monthlyPmt);
    if (kpiTotal) kpiTotal.textContent = fmt(totalPayment);
    if (kpiInterest) kpiInterest.textContent = fmt(result.totalInterest);
    if (kpiPayoff) {
      const payoffDate = new Date();
      payoffDate.setMonth(payoffDate.getMonth() + result.months);
      kpiPayoff.textContent = payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    // Malaysia-specific KPIs
    if (kpiEffectiveRate) {
      const effectiveRate = (result.totalInterest / amount) / (result.months / 12) * 100;
      kpiEffectiveRate.textContent = effectiveRate.toFixed(2) + '%';
    }
    if (kpiSavings) {
      const withoutExtra = amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) /
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

    // ─── Render Chart ───
    renderLoanChart(result.schedule, totalPayment, amount);
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
      const amount = parseFloat(amountInput ? amountInput.value : 0) || 0;
      const rate = parseFloat(rateInput ? rateInput.value : 0) || 0;

      const lines = [
        'Loan Calculator (' + info.label + '):',
        'Country: ' + (countrySelect ? countrySelect.options[countrySelect.selectedIndex].text : country),
        'Amount: ' + fmt(amount),
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

  // ─── Render Chart ───
  function renderLoanChart(schedule, totalPayment, amount) {
    var canvas = document.getElementById('loanChart');
    if (!canvas || !window.Chart) return;

    // Destroy existing chart
    if (window._loanChart) {
      window._loanChart.destroy();
    }

    var ctx = canvas.getContext('2d');

    // Prepare data: Principal vs Interest over time
    var labels = [];
    var principalData = [];
    var interestData = [];
    var balanceData = [];

    // Sample data (every N months to avoid too many points)
    var step = Math.max(1, Math.floor(schedule.length / 20));
    for (var i = 0; i < schedule.length; i += step) {
      var item = schedule[i];
      labels.push('Month ' + item.month);
      principalData.push(item.principal);
      interestData.push(item.interest);
      balanceData.push(item.balance);
    }

    // Add last point
    var last = schedule[schedule.length - 1];
    if (last && schedule.length > 0 && (schedule.length - 1) % step !== 0) {
      labels.push('Month ' + last.month);
      principalData.push(last.principal);
      interestData.push(last.interest);
      balanceData.push(last.balance);
    }

    window._loanChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Balance',
            data: balanceData,
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Principal',
            data: principalData,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Interest',
            data: interestData,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Loan Balance Over Time',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return (window.selectedCurrencySymbol || '$') + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  // ── Init ──
  if (window._t) {
    applyTranslation(window.currentLang || 'en');
  }

})();
