/* =====================================================
   Calculator Pro -- income-tax.js
   Income Tax Calculator -- Calculation Logic
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
    (function() { var income = parseFloat(document.getElementById('income').value) || 0; var status = document.getElementById('filingStatus').value; var deductions = parseFloat(document.getElementById('deductions').value) || 0; var taxableIncome = Math.max(0, income - deductions); var brackets; if (status === 'single') { brackets = [{limit: 11000, rate: 0.10}, {limit: 44725, rate: 0.12}, {limit: 95375, rate: 0.22}, {limit: 182100, rate: 0.24}, {limit: 231250, rate: 0.32}, {limit: 578125, rate: 0.35}, {limit: Infinity, rate: 0.37}]; } else if (status === 'married_joint') { brackets = [{limit: 22000, rate: 0.10}, {limit: 89450, rate: 0.12}, {limit: 190750, rate: 0.22}, {limit: 364200, rate: 0.24}, {limit: 462500, rate: 0.32}, {limit: 693750, rate: 0.35}, {limit: Infinity, rate: 0.37}]; } else { brackets = [{limit: 15700, rate: 0.10}, {limit: 59850, rate: 0.12}, {limit: 95350, rate: 0.22}, {limit: 182100, rate: 0.24}, {limit: 231250, rate: 0.32}, {limit: 578100, rate: 0.35}, {limit: Infinity, rate: 0.37}]; } var tax = 0; var prevLimit = 0; for (var i = 0; i < brackets.length; i++) { var bracket = brackets[i]; if (taxableIncome > prevLimit) { var taxableInBracket = Math.min(taxableIncome, bracket.limit) - prevLimit; tax += taxableInBracket * bracket.rate; } prevLimit = bracket.limit; } var effectiveRate = income > 0 ? (tax / income) * 100 : 0; return { taxableIncome: Math.round(taxableIncome * 100) / 100, estimatedTax: Math.round(tax * 100) / 100, effectiveTaxRate: Math.round(effectiveRate * 100) / 100 }; })()
  }

  function updateKPIs(result) {
    document.getElementById('kpi_taxableIncome').textContent = fmtCurrency(result.taxableIncome);
document.getElementById('kpi_estimatedTax').textContent = fmtCurrency(result.estimatedTax);
document.getElementById('kpi_effectiveTaxRate').textContent = result.effectiveTaxRate || '--';

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
