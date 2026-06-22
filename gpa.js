/* =====================================================
   Calculator Pro -- gpa.js
   GPA Calculator -- Calculation Logic
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
    (function() { var grades = { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0 }; var totalPoints = 0; var totalCredits = 0; for (var i = 1; i <= 5; i++) { var gradeEl = document.getElementById('grade' + i); var creditEl = document.getElementById('credit' + i); if (gradeEl && creditEl) { var grade = gradeEl.value; var credits = parseFloat(creditEl.value) || 0; if (grade && credits > 0) { totalPoints += (grades[grade] || 0) * credits; totalCredits += credits; } } } var gpa = totalCredits > 0 ? totalPoints / totalCredits : 0; var letter = 'N/A'; if (gpa >= 3.7) letter = 'A'; else if (gpa >= 3.3) letter = 'B+'; else if (gpa >= 3.0) letter = 'B'; else if (gpa >= 2.7) letter = 'B-'; else if (gpa >= 2.3) letter = 'C+'; else if (gpa >= 2.0) letter = 'C'; else if (gpa >= 1.7) letter = 'C-'; else if (gpa >= 1.0) letter = 'D'; else if (totalCredits > 0) letter = 'F'; return { gpa: Math.round(gpa * 100) / 100, totalCredits: totalCredits, letterGrade: letter }; })()
  }

  function updateKPIs(result) {
    document.getElementById('kpi_gpa').textContent = fmtCurrency(result.gpa);
document.getElementById('kpi_totalCredits').textContent = fmtCurrency(result.totalCredits);
document.getElementById('kpi_letterGrade').textContent = result.letterGrade || '--';

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
