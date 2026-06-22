/* =====================================================
   Calculator Pro -- refinance.js
   Refinance Calculator -- Calculation Logic
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
    (function() { var balance = parseFloat(document.getElementById('currentBalance').value) || 0; var currentRate = parseFloat(document.getElementById('currentRate').value) || 0; var newRate = parseFloat(document.getElementById('newRate').value) || 0; var closingCosts = parseFloat(document.getElementById('closingCosts').value) || 0; var remainingTerm = parseInt(document.getElementById('remainingTerm').value) || 1; var newTerm = parseInt(document.getElementById('newTerm').value) || 30; var cr = currentRate / 100 / 12; var nr = newRate / 100 / 12; var curN = remainingTerm * 12; var newN = newTerm * 12; var curMonthly; if (cr === 0) { curMonthly = balance / curN; } else { curMonthly = balance * (cr * Math.pow(1 + cr, curN)) / (Math.pow(1 + cr, curN) - 1); } var newMonthly; if (nr === 0) { newMonthly = balance / newN; } else { newMonthly = balance * (nr * Math.pow(1 + nr, newN)) / (Math.pow(1 + nr, newN) - 1); } var monthlySavings = curMonthly - newMonthly; var breakEvenMonths = monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : 0; var curTotal = curMonthly * curN; var newTotal = newMonthly * newN + closingCosts; var totalSavings = curTotal - newTotal; return { currentMonthlyPayment: Math.round(curMonthly * 100) / 100, newMonthlyPayment: Math.round(newMonthly * 100) / 100, monthlySavings: Math.round(monthlySavings * 100) / 100, breakEvenMonths: breakEvenMonths, totalSavings: Math.round(totalSavings * 100) / 100 }; })()
  }

  function updateKPIs(result) {
    document.getElementById('kpi_currentMonthlyPayment').textContent = fmtCurrency(result.currentMonthlyPayment);
document.getElementById('kpi_newMonthlyPayment').textContent = fmtCurrency(result.newMonthlyPayment);
document.getElementById('kpi_monthlySavings').textContent = fmtCurrency(result.monthlySavings);
document.getElementById('kpi_breakEvenMonths').textContent = fmtCurrency(result.breakEvenMonths);
document.getElementById('kpi_totalSavings').textContent = fmtCurrency(result.totalSavings);

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
