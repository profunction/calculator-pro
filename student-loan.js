/* =====================================================
   Calculator Pro -- student-loan.js
   Student Loan Calculator -- Calculation Logic
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
    (function() { var loan = parseFloat(document.getElementById('loanAmount').value) || 0; var rate = parseFloat(document.getElementById('interestRate').value) || 0; var termYears = parseInt(document.getElementById('termYears').value) || 10; if (loan <= 0 || termYears <= 0) { return { monthlyPayment: 0, totalInterest: 0, totalCost: 0 }; } var monthlyRate = rate / 100 / 12; var n = termYears * 12; var monthlyPayment; if (monthlyRate === 0) { monthlyPayment = loan / n; } else { monthlyPayment = loan * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1); } var totalCost = monthlyPayment * n; var totalInterest = totalCost - loan; return { monthlyPayment: Math.round(monthlyPayment * 100) / 100, totalInterest: Math.round(totalInterest * 100) / 100, totalCost: Math.round(totalCost * 100) / 100 }; })()
  }

  function updateKPIs(result) {
    document.getElementById('kpi_monthlyPayment').textContent = fmtCurrency(result.monthlyPayment);
document.getElementById('kpi_totalInterest').textContent = fmtCurrency(result.totalInterest);
document.getElementById('kpi_totalCost').textContent = fmtCurrency(result.totalCost);

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
