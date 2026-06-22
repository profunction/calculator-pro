/* =====================================================
   Calculator Pro -- retirement.js
   Retirement Calculator -- Calculation Logic
   ===================================================== */
(function () {
  "use strict";

  const sym = window.selectedCurrencySymbol || '$';

  function fmtCurrency(val) {
    if (typeof val === 'string') return val;
    if (isNaN(val) || val === null) return '--';
    return sym + ' ' + Math.round(val).toLocaleString('en-US');
  }

  const form = document.getElementById('calcForm');
  const dashPrompt = document.getElementById('dashPrompt');
  const kpiGrid = document.getElementById('kpiGrid');
  const chartSection = document.getElementById('chartSection');
  let chartInstance = null;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const result = calculate();
    if (result.error) {
      dashPrompt.textContent = result.error;
      dashPrompt.style.display = 'block';
      kpiGrid.classList.add('hidden-until-calc');
      chartSection.classList.add('hidden-until-calc');
      return;
    }
    dashPrompt.style.display = 'none';
    kpiGrid.classList.remove('hidden-until-calc');
    chartSection.classList.remove('hidden-until-calc');
    updateKPIs(result);
    if (result.chartData) {
      renderChart(result.chartData);
    } else {
      chartSection.classList.add('hidden-until-calc');
    }
  });

  form.addEventListener('reset', function () {
    dashPrompt.textContent = 'Enter values and click Calculate.';
    dashPrompt.style.display = 'block';
    kpiGrid.classList.add('hidden-until-calc');
    chartSection.classList.add('hidden-until-calc');
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    document.querySelectorAll('.kpi-value').forEach(el => el.textContent = '--');
  });

  function calculate() {
    (function() { var currentAge = parseInt(document.getElementById('currentAge').value) || 0; var retirementAge = parseInt(document.getElementById('retirementAge').value) || 0; var currentSavings = parseFloat(document.getElementById('currentSavings').value) || 0; var monthly = parseFloat(document.getElementById('monthlyContribution').value) || 0; var rate = parseFloat(document.getElementById('rate').value) || 0; var desiredMonthly = parseFloat(document.getElementById('desiredMonthlyIncome').value) || 0; var years = retirementAge - currentAge; if (years <= 0) { return { savingsAtRetirement: currentSavings, monthlyRetirementIncome: 0, shortfall: 0 }; } var r = rate / 100 / 12; var n = years * 12; var futureValue = currentSavings * Math.pow(1 + r, n); var annuityFV = monthly > 0 ? monthly * ((Math.pow(1 + r, n) - 1) / r) : 0; var savingsAtRetirement = futureValue + annuityFV; var monthlyRetirementIncome = (savingsAtRetirement * 0.04) / 12; var shortfall = desiredMonthly - monthlyRetirementIncome; return { savingsAtRetirement: Math.round(savingsAtRetirement * 100) / 100, monthlyRetirementIncome: Math.round(monthlyRetirementIncome * 100) / 100, shortfall: Math.round(shortfall * 100) / 100 }; })()
  }

  function updateKPIs(result) {
    document.getElementById('kpi_savingsAtRetirement').textContent = fmtCurrency(result.savingsAtRetirement);
document.getElementById('kpi_monthlyRetirementIncome').textContent = fmtCurrency(result.monthlyRetirementIncome);
document.getElementById('kpi_shortfall').textContent = fmtCurrency(result.shortfall);

  }

  function renderChart(data) {
    if (chartInstance) chartInstance.destroy();
    const ctx = document.getElementById('calcChart').getContext('2d');
    const keys = Object.keys(data[0]);
    const xKey = keys[0];
    const datasets = [];
    const colors = ['#2563EB', '#10B981', '#EF4444', '#F59E0B'];
    for (let i = 1; i < keys.length && i < 4; i++) {
      datasets.push({
        label: keys[i].charAt(0).toUpperCase() + keys[i].slice(1),
        data: data.map(d => d[keys[i]]),
        backgroundColor: colors[i-1] + '20',
        borderColor: colors[i-1],
        borderWidth: 2,
        fill: i === 1
      });
    }
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d[xKey]),
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: v => sym + ' ' + v.toLocaleString() }
          }
        }
      }
    });
  }
})();
