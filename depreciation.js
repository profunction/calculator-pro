/* =====================================================
   Calculator Pro -- depreciation.js
   Depreciation Calculator -- Calculation Logic
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
    (function() { var cost = parseFloat(document.getElementById('assetCost').value) || 0; var salvage = parseFloat(document.getElementById('salvageValue').value) || 0; var life = parseInt(document.getElementById('usefulLife').value) || 1; var method = document.getElementById('method').value; var annualDepreciation; var bookValue; if (method === 'straight-line') { annualDepreciation = (cost - salvage) / life; bookValue = cost - annualDepreciation; } else if (method === 'double-declining') { var rate = 2 / life; var firstYear = cost * rate; annualDepreciation = firstYear; bookValue = cost - firstYear; } else { var sumYears = life * (life + 1) / 2; var firstYearSOYD = (cost - salvage) * (life / sumYears); annualDepreciation = firstYearSOYD; bookValue = cost - firstYearSOYD; } return { annualDepreciation: Math.round(annualDepreciation * 100) / 100, accumulatedDepreciation: Math.round(annualDepreciation * 100) / 100, bookValue: Math.round(Math.max(bookValue, salvage) * 100) / 100 }; })()
  }

  function updateKPIs(result) {
    document.getElementById('kpi_annualDepreciation').textContent = fmtCurrency(result.annualDepreciation);
document.getElementById('kpi_accumulatedDepreciation').textContent = fmtCurrency(result.accumulatedDepreciation);
document.getElementById('kpi_bookValue').textContent = fmtCurrency(result.bookValue);

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
