/* =====================================================
   Calculator Pro -- age.js
   Age Calculator -- Calculation Logic
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
    (function() { var birthStr = document.getElementById('birthDate').value; var refStr = document.getElementById('referenceDate').value || new Date().toISOString().split('T')[0]; var birth = new Date(birthStr + 'T00:00:00'); var ref = new Date(refStr + 'T00:00:00'); if (isNaN(birth.getTime()) || isNaN(ref.getTime())) { return { years: 0, months: 0, days: 0, totalDays: 0 }; } var years = ref.getFullYear() - birth.getFullYear(); var months = ref.getMonth() - birth.getMonth(); var days = ref.getDate() - birth.getDate(); if (days < 0) { months--; var prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0); days += prevMonth.getDate(); } if (months < 0) { years--; months += 12; } if (ref < birth) { years = 0; months = 0; days = 0; } var diffTime = ref.getTime() - birth.getTime(); var totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); return { years: years, months: months, days: days, totalDays: totalDays }; })()
  }

  function updateKPIs(result) {
    document.getElementById('kpi_years').textContent = fmtCurrency(result.years);
document.getElementById('kpi_months').textContent = fmtCurrency(result.months);
document.getElementById('kpi_days').textContent = fmtCurrency(result.days);
document.getElementById('kpi_totalDays').textContent = fmtCurrency(result.totalDays);

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
