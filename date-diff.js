/* =====================================================
   Calculator Pro -- date-diff.js
   Date Difference Calculator -- Calculation Logic
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
    (function() { var startStr = document.getElementById('startDate').value; var endStr = document.getElementById('endDate').value; var start = new Date(startStr + 'T00:00:00'); var end = new Date(endStr + 'T00:00:00'); if (isNaN(start.getTime()) || isNaN(end.getTime())) { return { diffDays: 0, diffWeeks: 0, diffMonths: 0, diffYears: 0 }; } if (end < start) { var temp = start; start = end; end = temp; } var diffTime = end.getTime() - start.getTime(); var diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); var diffWeeks = (diffDays / 7).toFixed(1); var yearDiff = end.getFullYear() - start.getFullYear(); var monthDiff = end.getMonth() - start.getMonth(); var diffMonths = yearDiff * 12 + monthDiff; if (end.getDate() < start.getDate()) diffMonths--; var diffYears = (diffMonths / 12).toFixed(1); return { diffDays: diffDays, diffWeeks: parseFloat(diffWeeks), diffMonths: diffMonths, diffYears: parseFloat(diffYears) }; })()
  }

  function updateKPIs(result) {
    document.getElementById('kpi_diffDays').textContent = fmtCurrency(result.diffDays);
document.getElementById('kpi_diffWeeks').textContent = fmtCurrency(result.diffWeeks);
document.getElementById('kpi_diffMonths').textContent = fmtCurrency(result.diffMonths);
document.getElementById('kpi_diffYears').textContent = fmtCurrency(result.diffYears);

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
