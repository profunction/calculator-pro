/* =====================================================
   Calculator Pro — app.js
   Equipment Lease Calculator - Main Application Logic
   ===================================================== */

'use strict';

// ─────────────────────────────────────────
// 1. DARK MODE
// ─────────────────────────────────────────
(function initDarkMode() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  // Check saved preference or system preference
  const saved = localStorage.getItem('theme');
  if (saved) {
    applyTheme(saved);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  }

  toggle.addEventListener('click', function() {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
})();
// ─────────────────────────────────────────
// 3. MOBILE MENU
// ─────────────────────────────────────────
(function initMobileMenu() {
  var btn = document.getElementById('mobileMenuBtn');
  var nav = document.getElementById('navLinks');

  if (!btn || !nav) return;

  btn.addEventListener('click', function() {
    nav.classList.toggle('open');
  });
})();

// ─────────────────────────────────────────
// 4. FAQ ACCORDION
// ─────────────────────────────────────────
(function initFAQ() {
  var items = document.querySelectorAll('.faq-item');

  items.forEach(function(item) {
    var q = item.querySelector('.faq-q');
    if (!q) return;

    q.addEventListener('click', function() {
      var isOpen = item.classList.contains('open');

      // Close all
      items.forEach(function(i) {
        i.classList.remove('open');
        var btn = i.querySelector('.faq-q');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });

      // Open clicked if not already open
      if (!isOpen) {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

// ─────────────────────────────────────────
// 5. CALCULATION ENGINE
// ─────────────────────────────────────────
function calculateLeaseVsBuy(inputs) {
  var cost = parseFloat(inputs.equipmentCost) || 0;
  var down = parseFloat(inputs.downPayment) || 0;
  var termMonths = parseInt(inputs.leaseTerm) || 60;
  var annualRate = parseFloat(inputs.interestRate) || 7.5;
  var lifespanYears = parseInt(inputs.lifespan) || 10;
  var residual = parseFloat(inputs.residualValue) || 0;
  var taxRate = parseFloat(inputs.taxRate) || 0;

  // Validate inputs
  if (cost <= 0 || termMonths <= 0 || annualRate < 0) {
    return null;
  }

  var monthlyRate = annualRate / 100 / 12;
  var financedAmount = cost - down;
  var lifespanMonths = lifespanYears * 12;

  // Lease calculation (standard amortization)
  var monthlyLease = 0;
  if (monthlyRate > 0) {
    var factor = Math.pow(1 + monthlyRate, termMonths);
    monthlyLease = financedAmount * monthlyRate * factor / (factor - 1);
  } else {
    monthlyLease = financedAmount / termMonths;
  }

  var totalLeaseCost = monthlyLease * termMonths;
  var totalLeaseInterest = totalLeaseCost - financedAmount;

  // Buy calculation (loan amortization for the same term, then owned)
  var monthlyBuy = 0;
  if (monthlyRate > 0) {
    var factor2 = Math.pow(1 + monthlyRate, termMonths);
    monthlyBuy = financedAmount * monthlyRate * factor2 / (factor2 - 1);
  } else {
    monthlyBuy = financedAmount / termMonths;
  }

  var totalBuyCost = monthlyBuy * termMonths;
  var totalBuyInterest = totalBuyCost - financedAmount;

  // After term ownership: equipment still has value if lifespan > term
  var remainingLife = Math.max(0, lifespanMonths - termMonths);
  var depreciationRate = 0.15; // 15% per year straight-line
  var estimatedValue = cost * Math.pow(1 - depreciationRate, lifespanYears);

  // Tax benefits (simplified)
  var annualTaxRate = taxRate / 100;
  var leaseTaxBenefit = totalLeaseInterest * annualTaxRate;
  var buyTaxBenefit = (totalBuyInterest + cost * 0.2) * annualTaxRate; // Interest + depreciation

  // After-tax costs
  var leaseAfterTax = totalLeaseCost - leaseTaxBenefit;
  var buyAfterTax = totalBuyCost - buyTaxBenefit + (cost * 0.1); // Plus opportunity cost

  // Savings comparison
  var savings = buyAfterTax - leaseAfterTax;
  var preferLease = savings > 0;

  return {
    monthlyLease: monthlyLease,
    monthlyBuy: monthlyBuy,
    totalLeaseCost: totalLeaseCost,
    totalBuyCost: totalBuyCost,
    totalLeaseInterest: totalLeaseInterest,
    totalBuyInterest: totalBuyInterest,
    leaseAfterTax: leaseAfterTax,
    buyAfterTax: buyAfterTax,
    leaseTaxBenefit: leaseTaxBenefit,
    buyTaxBenefit: buyTaxBenefit,
    estimatedValue: estimatedValue,
    savings: Math.abs(savings),
    preferLease: preferLease,
    termMonths: termMonths,
    lifespanYears: lifespanYears,
    cost: cost,
    down: down
  };
}

// ─────────────────────────────────────────
// 6. FORM HANDLING
// ─────────────────────────────────────────
(function initCalculator() {
  var form = document.getElementById('calcForm');
  var resetBtn = document.getElementById('resetBtn');
  var dashPrompt = document.getElementById('dashPrompt');
  var dashboard = document.getElementById('dashboard');
  var recBanner = document.getElementById('recBanner');
  var chartsGrid = document.getElementById('chartsGrid');
  var tableCard = document.getElementById('tableCard');
  var analysisGrid = document.getElementById('analysisGrid');

  // Action buttons
  var downloadPDFBtn = document.getElementById('downloadPDF');
  var copyResultsBtn = document.getElementById('copyResults');
  var shareResultsBtn = document.getElementById('shareResults');
  var saveRecordBtn = document.getElementById('saveRecord');

  if (!form) return;

  // Helper: show results sections, hide prompt
  function showResultsUI() {
    if (dashPrompt) dashPrompt.style.display = 'none';
    if (recBanner) recBanner.style.display = 'flex';
    if (chartsGrid) chartsGrid.style.display = '';
    if (tableCard) tableCard.style.display = '';
    if (analysisGrid) analysisGrid.style.display = '';
    // Enable action buttons
    if (downloadPDFBtn) downloadPDFBtn.disabled = false;
    if (copyResultsBtn) copyResultsBtn.disabled = false;
    if (shareResultsBtn) shareResultsBtn.disabled = false;
    if (saveRecordBtn) saveRecordBtn.disabled = false;
  }

  // Helper: show prompt, hide results sections, disable buttons
  function resetResultsUI() {
    if (dashPrompt) dashPrompt.style.display = '';
    if (recBanner) recBanner.style.display = 'none';
    if (chartsGrid) chartsGrid.style.display = 'none';
    if (tableCard) tableCard.style.display = 'none';
    if (analysisGrid) analysisGrid.style.display = 'none';
    // Disable action buttons
    if (downloadPDFBtn) downloadPDFBtn.disabled = true;
    if (copyResultsBtn) copyResultsBtn.disabled = true;
    if (shareResultsBtn) shareResultsBtn.disabled = true;
    if (saveRecordBtn) saveRecordBtn.disabled = true;
    // Reset KPI values to placeholder
    document.getElementById('kpiMonthlyLease').textContent = '\u2014';
    document.getElementById('kpiTotalLease').textContent = 'Total: \u2014';
    document.getElementById('kpiMonthlyBuy').textContent = '\u2014';
    document.getElementById('kpiTotalBuy').textContent = 'Total: \u2014';
    document.getElementById('kpiFinancingCost').textContent = '\u2014';
    document.getElementById('kpiTaxSaving').textContent = 'Tax Saving: \u2014';
    document.getElementById('kpiSavings').textContent = '\u2014';
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var inputs = {
      equipmentCost: document.getElementById('equipmentCost').value,
      downPayment: document.getElementById('downPayment').value,
      leaseTerm: document.getElementById('leaseTerm').value,
      interestRate: document.getElementById('interestRate').value,
      lifespan: document.getElementById('lifespan').value,
      residualValue: document.getElementById('residualValue').value,
      taxRate: document.getElementById('taxRate').value
    };

    var result = calculateLeaseVsBuy(inputs);
    if (!result) {
      showToast('Please enter valid values in all required fields.');
      return;
    }

    // Show all result UI elements
    showResultsUI();

    // Update KPIs
    updateKPIs(result);
    updateCharts(result);
    updateComparisonTable(result);
    updateAnalysis(result);
    updateRecommendation(result);

    // Scroll to results
    dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      form.reset();
      document.getElementById('downPayment').value = 0;
      document.getElementById('residualValue').value = 0;
      resetResultsUI();
    });
  }
})();

// ─────────────────────────────────────────
// 7. UPDATE KPI CARDS
// ─────────────────────────────────────────
function updateKPIs(r) {
  var fmt = function(val) {
    return '$' + Math.round(val).toLocaleString('en-US');
  };

  document.getElementById('kpiMonthlyLease').textContent = fmt(r.monthlyLease);
  document.getElementById('kpiTotalLease').textContent = 'Total: ' + fmt(r.totalLeaseCost);
  document.getElementById('kpiMonthlyBuy').textContent = fmt(r.monthlyBuy);
  document.getElementById('kpiTotalBuy').textContent = 'Total: ' + fmt(r.totalBuyCost);
  document.getElementById('kpiFinancingCost').textContent = fmt(Math.max(r.totalLeaseInterest, r.totalBuyInterest));
  document.getElementById('kpiTaxSaving').textContent = 'Tax Saving: ' + fmt(Math.max(r.leaseTaxBenefit, r.buyTaxBenefit));
  document.getElementById('kpiSavings').textContent = fmt(r.savings);

  var savingsLabel = document.getElementById('kpiSavingsLabel');
  if (savingsLabel) {
    savingsLabel.textContent = r.preferLease ? 'Lease saves more' : 'Buy saves more';
  }
}

// ─────────────────────────────────────────
// 8. UPDATE CHARTS
// ─────────────────────────────────────────
var barChartInstance = null;
var lineChartInstance = null;

function updateCharts(r) {
  var fmt = function(val) {
    return '$' + Math.round(val / 1000) + 'k';
  };

  // Bar Chart
  var barCtx = document.getElementById('barChart');
  if (barCtx) {
    if (barChartInstance) barChartInstance.destroy();

    barChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['Lease Total', 'Buy Total', 'Buy (after tax)'],
        datasets: [{
          label: 'Cost',
          data: [r.totalLeaseCost, r.totalBuyCost, r.buyAfterTax],
          backgroundColor: ['#2563EB', '#10B981', '#10B98180'],
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: function(val) { return fmt(val); } }
          }
        }
      }
    });
  }

  // Line Chart (cumulative cost over time)
  var lineCtx = document.getElementById('lineChart');
  if (lineCtx) {
    if (lineChartInstance) lineChartInstance.destroy();

    var labels = [];
    var leaseData = [];
    var buyData = [];
    var months = r.termMonths;

    for (var i = 0; i <= months; i += Math.max(1, Math.floor(months / 12))) {
      labels.push('Month ' + i);
      leaseData.push(r.monthlyLease * i);
      buyData.push(r.monthlyBuy * i);
    }

    lineChartInstance = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Lease',
            data: leaseData,
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Buy',
            data: buyData,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: function(val) { return fmt(val); } }
          }
        }
      }
    });
  }
}

// ─────────────────────────────────────────
// 9. UPDATE COMPARISON TABLE
// ─────────────────────────────────────────
function updateComparisonTable(r) {
  var fmt = function(val) {
    return '$' + Math.round(val).toLocaleString('en-US');
  };

  var rows = [
    ['Monthly Payment', fmt(r.monthlyLease), fmt(r.monthlyBuy)],
    ['Total Payments', fmt(r.totalLeaseCost), fmt(r.totalBuyCost)],
    ['Total Interest', fmt(r.totalLeaseInterest), fmt(r.totalBuyInterest)],
    ['After-Tax Cost', fmt(r.leaseAfterTax), fmt(r.buyAfterTax)],
    ['Tax Benefit', fmt(r.leaseTaxBenefit), fmt(r.buyTaxBenefit)],
    ['Est. Residual Value', fmt(r.estimatedValue), fmt(r.estimatedValue)]
  ];

  var tbody = document.getElementById('comparisonBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  rows.forEach(function(row) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + row[0] + '</td><td>' + row[1] + '</td><td>' + row[2] + '</td>';
    tbody.appendChild(tr);
  });
}

// ─────────────────────────────────────────
// 10. UPDATE ANALYSIS
// ─────────────────────────────────────────
function updateAnalysis(r) {
  var cashFlowList = document.getElementById('cashFlowList');
  var insightsList = document.getElementById('insightsList');

  if (cashFlowList) {
    cashFlowList.innerHTML = '';
    var cashItems = [
      'Monthly lease payment: ' + fmt(r.monthlyLease) + '/mo',
      'Monthly buy payment: ' + fmt(r.monthlyBuy) + '/mo',
      'Cash preserved (down payment saved): ' + fmt(r.down),
      'Tax benefit (lease): ' + fmt(r.leaseTaxBenefit) + '/yr'
    ];
    cashItems.forEach(function(item) {
      var li = document.createElement('li');
      li.textContent = item;
      cashFlowList.appendChild(li);
    });
  }

  if (insightsList) {
    insightsList.innerHTML = '';
    var insightItems = [
      r.preferLease ? 'Leasing is recommended for this scenario' : 'Buying is recommended for this scenario',
      'Potential savings: ' + fmt(r.savings),
      'Equipment lifespan: ' + r.lifespanYears + ' years',
      'Estimated residual value: ' + fmt(r.estimatedValue)
    ];
    insightItems.forEach(function(item) {
      var li = document.createElement('li');
      li.textContent = item;
      insightsList.appendChild(li);
    });
  }
}

function fmt(val) {
  var sym = window.selectedCurrencySymbol || '$';
  return sym + Math.round(val).toLocaleString('en-US');
}

// ─────────────────────────────────────────
// 11. UPDATE RECOMMENDATION
// ─────────────────────────────────────────
function updateRecommendation(r) {
  var recBadge = document.getElementById('recBadge');
  var recSavingsVal = document.getElementById('recSavingsVal');

  if (recBadge) {
    var action = recBadge.querySelector('#recAction');
    if (action) {
      action.textContent = r.preferLease ? 'Lease' : 'Buy';
    }
  }

  if (recSavingsVal) {
    recSavingsVal.textContent = fmt(r.savings);
  }

  // Update banner color
  var banner = document.getElementById('recBanner');
  if (banner) {
    if (r.preferLease) {
      banner.style.background = 'linear-gradient(135deg, #D1FAE5, #DBEAFE)';
      banner.style.borderColor = '#10B981';
    } else {
      banner.style.background = 'linear-gradient(135deg, #DBEAFE, #D1FAE5)';
      banner.style.borderColor = '#2563EB';
    }
  }
}

// ─────────────────────────────────────────
// 12. DOWNLOAD PDF
// ─────────────────────────────────────────
(function initPDF() {
  var btn = document.getElementById('downloadPDF');
  if (!btn) return;

  btn.addEventListener('click', function() {
    if (typeof window.jsPDF === 'undefined') {
      showToast('PDF library loading, please try again in a moment.');
      return;
    }

    var jsPDF = window.jsPDF.jsPDF;
    var doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('Equipment Lease vs Buy Analysis', 20, 30);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Generated by Calculator Pro', 20, 38);

    // Results
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Results Summary', 20, 55);

    var kpiMonthlyLease = document.getElementById('kpiMonthlyLease').textContent;
    var kpiMonthlyBuy = document.getElementById('kpiMonthlyBuy').textContent;
    var kpiSavings = document.getElementById('kpiSavings').textContent;

    var rows = [
      ['Monthly Lease Payment', kpiMonthlyLease],
      ['Monthly Buy Payment', kpiMonthlyBuy],
      ['Potential Savings', kpiSavings]
    ];

    doc.autoTable({
      startY: 62,
      head: [['Metric', 'Value']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save('equipment-lease-analysis.pdf');
    showToast('PDF report downloaded successfully!');
  });
})();

// ─────────────────────────────────────────
// 13. COPY RESULTS
// ─────────────────────────────────────────
(function initCopy() {
  var btn = document.getElementById('copyResults');
  if (!btn) return;

  btn.addEventListener('click', function() {
    var text = 'Equipment Lease vs Buy Analysis\n';
    text += 'Monthly Lease: ' + document.getElementById('kpiMonthlyLease').textContent + '\n';
    text += 'Monthly Buy: ' + document.getElementById('kpiMonthlyBuy').textContent + '\n';
    text += 'Potential Savings: ' + document.getElementById('kpiSavings').textContent + '\n';
    text += 'Recommended: ' + document.getElementById('recAction').textContent + '\n';

    navigator.clipboard.writeText(text).then(function() {
      showToast('Results copied to clipboard!');
    }).catch(function() {
      showToast('Could not copy results.');
    });
  });
})();

// ─────────────────────────────────────────
// 14. SHARE RESULTS
// ─────────────────────────────────────────
(function initShare() {
  var btn = document.getElementById('shareResults');
  if (!btn) return;

  btn.addEventListener('click', function() {
    var params = new URLSearchParams();

    var cost = document.getElementById('equipmentCost').value;
    if (cost) params.set('cost', cost);

    var term = document.getElementById('leaseTerm').value;
    if (term) params.set('term', term);

    var rate = document.getElementById('interestRate').value;
    if (rate) params.set('rate', rate);

    var lang = localStorage.getItem('lang') || 'en';
    params.set('lang', lang);

    var url = window.location.origin + window.location.pathname + '?' + params.toString();

    if (navigator.share) {
      navigator.share({
        title: 'Equipment Lease vs Buy Analysis',
        text: 'Check out this equipment financing analysis',
        url: url
      }).catch(function() {});
    } else {
      navigator.clipboard.writeText(url).then(function() {
        showToast('Share link copied to clipboard!');
      }).catch(function() {
        showToast('Could not copy link.');
      });
    }
  });
})();

// ─────────────────────────────────────────
// 15. SAVE RECORD
// ─────────────────────────────────────────
(function initSave() {
  var btn = document.getElementById('saveRecord');
  if (!btn) return;

  btn.addEventListener('click', function() {
    var record = {
      id: Date.now(),
      cost: document.getElementById('equipmentCost').value,
      term: document.getElementById('leaseTerm').value,
      rate: document.getElementById('interestRate').value,
      monthlyLease: document.getElementById('kpiMonthlyLease').textContent,
      monthlyBuy: document.getElementById('kpiMonthlyBuy').textContent,
      savings: document.getElementById('kpiSavings').textContent,
      recommendation: document.getElementById('recAction').textContent,
      date: new Date().toLocaleDateString()
    };

    var records = JSON.parse(localStorage.getItem('calcRecords') || '[]');
    records.unshift(record);
    if (records.length > 10) records = records.slice(0, 10);
    localStorage.setItem('calcRecords', JSON.stringify(records));

    renderSavedRecords();
    showToast('Calculation saved!');
  });
})();

function renderSavedRecords() {
  var section = document.getElementById('savedSection');
  var grid = document.getElementById('savedGrid');
  if (!section || !grid) return;

  var records = JSON.parse(localStorage.getItem('calcRecords') || '[]');
  if (records.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  grid.innerHTML = '';

  records.forEach(function(rec) {
    var card = document.createElement('div');
    card.className = 'saved-card';
    card.innerHTML = '<h4>' + rec.cost + ' — ' + rec.term + 'mo</h4>' +
                     '<p>Lease: ' + rec.monthlyLease + ' | Buy: ' + rec.monthlyBuy + '</p>' +
                     '<p>Savings: ' + rec.savings + '</p>' +
                     '<p>Recommended: ' + rec.recommendation + '</p>' +
                     '<small>' + rec.date + '</small>';
    grid.appendChild(card);
  });
}

// Clear saved
(function initClearSaved() {
  var btn = document.getElementById('clearSaved');
  if (!btn) return;

  btn.addEventListener('click', function() {
    localStorage.removeItem('calcRecords');
    renderSavedRecords();
    showToast('All saved records cleared.');
  });
})();

// ─────────────────────────────────────────
// 16. TOAST NOTIFICATION
// ─────────────────────────────────────────
function showToast(msg) {
  var existing = document.querySelector('.toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(function() {
    if (toast.parentNode) toast.remove();
  }, 3000);
}

// ─────────────────────────────────────────
// 17. PREFILL FROM URL
// ─────────────────────────────────────────
(function prefillFromUrl() {
  var params = new URLSearchParams(window.location.search);
  if (params.has('cost')) {
    document.getElementById('equipmentCost').value = params.get('cost');
  }
  if (params.has('term')) {
    document.getElementById('leaseTerm').value = params.get('term');
  }
  if (params.has('rate')) {
    document.getElementById('interestRate').value = params.get('rate');
  }
})();

// ─────────────────────────────────────────
// 18. LEAD FORM
// ─────────────────────────────────────────
(function initLeadForm() {
  var form = document.getElementById('leadFormEl');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    showToast('Thank you! We will connect you with financing providers soon.');
    form.reset();
  });
})();

// ─────────────────────────────────────────
// 19. SMOOTH SCROLL
// ─────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
  anchor.addEventListener('click', function(e) {
    var target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ─────────────────────────────────────────
// 20. HEADER SCROLL EFFECT
// ─────────────────────────────────────────
(function initHeaderScroll() {
  var header = document.getElementById('header');
  if (!header) return;

  window.addEventListener('scroll', function() {
    if (window.scrollY > 20) {
      header.style.boxShadow = 'var(--shadow)';
    } else {
      header.style.boxShadow = 'none';
    }
  });
})();

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
renderSavedRecords();
