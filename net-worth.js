/* =====================================================
   Calculator Pro -- net-worth.js
   Net Worth Calculator -- Calculation Logic
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
    (function() { var cash = parseFloat(document.getElementById('cashAndBank').value) || 0; var investment = parseFloat(document.getElementById('investments').value) || 0; var property = parseFloat(document.getElementById('realEstate').value) || 0; var otherAssets = parseFloat(document.getElementById('otherAssets').value) || 0; var mortgage = parseFloat(document.getElementById('mortgage').value) || 0; var loans = parseFloat(document.getElementById('loans').value) || 0; var creditCards = parseFloat(document.getElementById('creditCardDebt').value) || 0; var otherLiab = parseFloat(document.getElementById('otherLiabilities').value) || 0; var totalAssets = cash + investment + property + otherAssets; var totalLiabilities = mortgage + loans + creditCards + otherLiab; var netWorth = totalAssets - totalLiabilities; var debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0; return { totalAssets: Math.round(totalAssets * 100) / 100, totalLiabilities: Math.round(totalLiabilities * 100) / 100, netWorth: Math.round(netWorth * 100) / 100, debtToAssetRatio: Math.round(debtToAssetRatio * 100) / 100 }; })()
  }

  function updateKPIs(result) {
    document.getElementById('kpi_totalAssets').textContent = fmtCurrency(result.totalAssets);
document.getElementById('kpi_totalLiabilities').textContent = fmtCurrency(result.totalLiabilities);
document.getElementById('kpi_netWorth').textContent = fmtCurrency(result.netWorth);
document.getElementById('kpi_debtToAssetRatio').textContent = result.debtToAssetRatio || '--';

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
