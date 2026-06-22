/* =====================================================
   Calculator Pro -- capital-gains.js
   Capital Gains Tax Calculator -- Calculation Logic
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
    (function() { var purchase = parseFloat(document.getElementById('purchasePrice').value) || 0; var sale = parseFloat(document.getElementById('salePrice').value) || 0; var period = document.getElementById('holdingPeriod').value; var bracket = parseFloat(document.getElementById('taxBracket').value) || 0; var gain = sale - purchase; if (gain <= 0) { return { capitalGain: 0, taxOwed: 0, netProfit: 0 }; } var taxRate; if (period === 'short') { taxRate = bracket / 100; } else { if (bracket <= 12) taxRate = 0; else if (bracket <= 24) taxRate = 0.15; else taxRate = 0.20; } var taxOwed = gain * taxRate; var netProfit = gain - taxOwed; return { capitalGain: Math.round(gain * 100) / 100, taxOwed: Math.round(taxOwed * 100) / 100, netProfit: Math.round(netProfit * 100) / 100 }; })()
  }

  function updateKPIs(result) {
    document.getElementById('kpi_capitalGain').textContent = fmtCurrency(result.capitalGain);
document.getElementById('kpi_taxOwed').textContent = fmtCurrency(result.taxOwed);
document.getElementById('kpi_netProfit').textContent = fmtCurrency(result.netProfit);

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
