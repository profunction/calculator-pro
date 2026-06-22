/* =====================================================
   Calculator Pro -- calorie.js
   Calorie Calculator -- Calculation Logic
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
    (function() { var age = parseInt(document.getElementById('age').value) || 0; var gender = document.getElementById('gender').value; var weight = parseFloat(document.getElementById('weight').value) || 0; var height = parseFloat(document.getElementById('height').value) || 0; var activity = document.getElementById('activityLevel').value; var bmr; if (gender === 'male') { bmr = 10 * weight + 6.25 * height - 5 * age + 5; } else { bmr = 10 * weight + 6.25 * height - 5 * age - 161; } var multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, extreme: 1.9 }; var dailyCalories = bmr * (multipliers[activity] || 1.2); var protein = Math.round(dailyCalories * 0.25 / 4); var carbs = Math.round(dailyCalories * 0.50 / 4); var fat = Math.round(dailyCalories * 0.25 / 9); return { bmr: Math.round(bmr), dailyCalories: Math.round(dailyCalories), proteinGrams: protein, carbsGrams: carbs, fatGrams: fat }; })()
  }

  function updateKPIs(result) {
    document.getElementById('kpi_bmr').textContent = fmtCurrency(result.bmr);
document.getElementById('kpi_dailyCalories').textContent = fmtCurrency(result.dailyCalories);
document.getElementById('kpi_proteinGrams').textContent = fmtCurrency(result.proteinGrams);
document.getElementById('kpi_carbsGrams').textContent = fmtCurrency(result.carbsGrams);
document.getElementById('kpi_fatGrams').textContent = fmtCurrency(result.fatGrams);

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
