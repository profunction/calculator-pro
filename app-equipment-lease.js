/* =====================================================
   Calculator Pro — app-equipment-lease.js
   Equipment Lease Calculator - Main Application Logic
   Supports: Malaysia Section 46A, US Section 179, and more
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
// 2. MOBILE MENU
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
// 3. COUNTRY-SPECIFIC CALCULATION ENGINE
// ─────────────────────────────────────────

/**
 * Calculate Equipment Lease vs Buy with country-specific tax benefits
 */
function calculateEquipmentLease(inputs) {
  var cost = parseFloat(inputs.equipCost) || 0;
  var down = parseFloat(inputs.equipDown) || 0;
  var termMonths = parseInt(inputs.equipTerm) || 36;
  var annualRate = parseFloat(inputs.equipRate) || 5.5;
  var lifespanYears = parseInt(inputs.equipLife) || 5;
  var taxRate = parseFloat(inputs.equipTaxRate) || 24;
  var country = inputs.equipCountry || 'my';
  var section46A = inputs.section46A === '1';

  // Validate inputs
  if (cost <= 0 || termMonths <= 0) {
    return null;
  }

  var monthlyRate = annualRate / 100 / 12;
  var financedAmount = cost - down;
  var lifespanMonths = lifespanYears * 12;

  // ─── Lease Calculation (standard amortization) ───
  var monthlyLease = 0;
  if (monthlyRate > 0) {
    var factor = Math.pow(1 + monthlyRate, termMonths);
    monthlyLease = financedAmount * monthlyRate * factor / (factor - 1);
  } else {
    monthlyLease = financedAmount / termMonths;
  }

  var totalLeaseCost = monthlyLease * termMonths;
  var totalLeaseInterest = totalLeaseCost - financedAmount;

  // ─── Buy Calculation (loan amortization) ───
  var monthlyBuy = 0;
  if (monthlyRate > 0) {
    var factor2 = Math.pow(1 + monthlyRate, termMonths);
    monthlyBuy = financedAmount * monthlyRate * factor2 / (factor2 - 1);
  } else {
    monthlyBuy = financedAmount / termMonths;
  }

  var totalBuyCost = monthlyBuy * termMonths;
  var totalBuyInterest = totalBuyCost - financedAmount;

  // ─── Country-Specific Tax Benefits ───
  var annualTaxRate = taxRate / 100;
  var leaseTaxBenefit = 0;
  var buyTaxBenefit = 0;
  var taxNote = '';
  var section46ASavings = 0;

  switch (country) {
    case 'my': // Malaysia
      // Lease: Full rental deductions
      leaseTaxBenefit = totalLeaseInterest * annualTaxRate;

      if (section46A) {
        // Section 46A: 100% capital allowance in Year 1
        var fullAllowance = cost;
        var standardAllowance = cost * 0.20 * lifespanYears; // 20% p.a.
        section46ASavings = (fullAllowance - standardAllowance) * annualTaxRate;
        buyTaxBenefit = (totalBuyInterest + fullAllowance) * annualTaxRate;
        taxNote = 'Section 46A: 100% capital allowance in Year 1. Savings: ' + fmt(section46ASavings);
      } else {
        // Standard: 20% p.a. capital allowance
        var annualAllowance = cost * 0.20;
        buyTaxBenefit = (totalBuyInterest + annualAllowance * lifespanYears) * annualTaxRate;
        taxNote = 'Standard: 20% p.a. capital allowance';
      }
      break;

    case 'us': // United States
      // Section 179: Immediate expensing up to $1,160,000 (2024)
      var section179Limit = 1160000;
      var section179Deduction = Math.min(cost, section179Limit);
      var bonusDepreciation = 0.60; // 60% in 2024

      if (cost <= section179Limit) {
        buyTaxBenefit = (totalBuyInterest + section179Deduction) * annualTaxRate;
        taxNote = 'Section 179: Full expense in Year 1 (up to $1.16M)';
      } else {
        var remaining = cost - section179Limit;
        var firstYear = section179Limit + (remaining * bonusDepreciation);
        buyTaxBenefit = (totalBuyInterest + firstYear) * annualTaxRate;
        taxNote = 'Section 179 + 60% bonus depreciation';
      }

      leaseTaxBenefit = totalLeaseInterest * annualTaxRate;
      break;

    case 'cn': // China
      // Standard depreciation: straight-line, min 3 years for equipment
      var minLife = Math.max(lifespanYears, 3);
      var annualDepreciation = cost / minLife;
      buyTaxBenefit = (totalBuyInterest + annualDepreciation * lifespanYears) * annualTaxRate;
      leaseTaxBenefit = totalLeaseInterest * annualTaxRate;
      taxNote = 'Straight-line depreciation, min 3 years';
      break;

    case 'sg': // Singapore
      // Capital allowance: 20% p.a. (same as MY standard)
      var annualAllowance = cost * 0.20;
      buyTaxBenefit = (totalBuyInterest + annualAllowance * lifespanYears) * annualTaxRate;
      leaseTaxBenefit = totalLeaseInterest * annualTaxRate;
      taxNote = 'Capital allowance: 20% p.a.';
      break;

    default: // Other
      buyTaxBenefit = (totalBuyInterest + cost * 0.20 * lifespanYears) * annualTaxRate;
      leaseTaxBenefit = totalLeaseInterest * annualTaxRate;
      taxNote = 'Standard depreciation';
      break;
  }

  // After-tax costs
  var leaseAfterTax = totalLeaseCost - leaseTaxBenefit;
  var buyAfterTax = totalBuyCost - buyTaxBenefit + (cost * 0.1); // Plus opportunity cost

  // Savings comparison
  var savings = buyAfterTax - leaseAfterTax;
  var preferLease = savings > 0;

  // Estimated residual value
  var depreciationRate = 0.15; // 15% per year
  var estimatedValue = cost * Math.pow(1 - depreciationRate, lifespanYears);

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
    section46ASavings: section46ASavings,
    taxNote: taxNote,
    estimatedValue: estimatedValue,
    savings: Math.abs(savings),
    preferLease: preferLease,
    termMonths: termMonths,
    lifespanYears: lifespanYears,
    cost: cost,
    down: down,
    country: country
  };
}

// ─────────────────────────────────────────
// 4. FORM HANDLING
// ─────────────────────────────────────────
(function initCalculator() {
  var form = document.getElementById('equipForm');
  var resetBtn = document.getElementById('resetBtn');
  var dashPrompt = document.getElementById('dashPrompt');
  var dashboard = document.getElementById('dashboard');
  var resultActions = document.getElementById('resultActions');

  // Action buttons
  var downloadPDFBtn = document.getElementById('downloadPDFBtn');
  var copyResultsBtn = document.getElementById('copyResultsBtn');
  var shareResultsBtn = document.getElementById('shareResultsBtn');
  var saveRecordBtn = document.getElementById('saveRecordBtn');

  if (!form) return;

  // Show/hide country-specific fields
  var countrySelect = document.getElementById('equipCountry');
  if (countrySelect) {
    countrySelect.addEventListener('change', function() {
      updateCountryFields(this.value);
    });
    // Initial state
    updateCountryFields(countrySelect.value);
  }

  // Helper: show results sections, hide prompt
  function showResultsUI() {
    if (dashPrompt) dashPrompt.style.display = 'none';
    var kpiGrid = document.querySelector('.kpi-grid');
    if (kpiGrid) kpiGrid.style.display = '';
    if (resultActions) resultActions.style.display = '';
    // Enable action buttons
    if (downloadPDFBtn) downloadPDFBtn.disabled = false;
    if (copyResultsBtn) copyResultsBtn.disabled = false;
    if (shareResultsBtn) shareResultsBtn.disabled = false;
    if (saveRecordBtn) saveRecordBtn.disabled = false;
  }

  // Helper: show prompt, hide results sections, disable buttons
  function resetResultsUI() {
    if (dashPrompt) dashPrompt.style.display = '';
    var kpiGrid = document.querySelector('.kpi-grid');
    if (kpiGrid) kpiGrid.style.display = 'none';
    if (resultActions) resultActions.style.display = 'none';
    // Disable action buttons
    if (downloadPDFBtn) downloadPDFBtn.disabled = true;
    if (copyResultsBtn) copyResultsBtn.disabled = true;
    if (shareResultsBtn) shareResultsBtn.disabled = true;
    if (saveRecordBtn) saveRecordBtn.disabled = true;
    // Reset KPI values to placeholder
    var kpiMonthly = document.getElementById('kpiMonthly');
    if (kpiMonthly) kpiMonthly.textContent = '\u2014';
    var kpiTotal = document.getElementById('kpiTotal');
    if (kpiTotal) kpiTotal.textContent = '\u2014';
    var kpiBuyCost = document.getElementById('kpiBuyCost');
    if (kpiBuyCost) kpiBuyCost.textContent = '\u2014';
    var kpiTaxSaving = document.getElementById('kpiTaxSaving');
    if (kpiTaxSaving) kpiTaxSaving.textContent = '\u2014';
    var kpiLeaseVsBuy = document.getElementById('kpiLeaseVsBuy');
    if (kpiLeaseVsBuy) kpiLeaseVsBuy.textContent = '\u2014';
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var countryEl = document.getElementById('equipCountry');
    var section46AEl = document.getElementById('section46A');

    var inputs = {
      equipCost: document.getElementById('equipCost').value,
      equipDown: document.getElementById('equipDown').value,
      equipTerm: document.getElementById('equipTerm').value,
      equipRate: document.getElementById('equipRate').value,
      equipLife: document.getElementById('equipLife').value,
      equipTaxRate: document.getElementById('equipTaxRate').value,
      equipCountry: countryEl ? countryEl.value : 'my',
      section46A: section46AEl ? section46AEl.value : '1'
    };

    var result = calculateEquipmentLease(inputs);
    if (!result) {
      showToast('Please enter valid values in all required fields.');
      return;
    }

    // Show all result UI elements
    showResultsUI();

    // Update KPIs
    updateKPIs(result);

    // Scroll to results
    if (dashboard) dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      form.reset();
      document.getElementById('equipDown').value = 0;
      resetResultsUI();
      // Reset country fields
      var countryEl = document.getElementById('equipCountry');
      if (countryEl) updateCountryFields(countryEl.value);
    });
  }

  // Initial UI state
  resetResultsUI();
})();

// ─────────────────────────────────────────
// 5. UPDATE COUNTRY-SPECIFIC FIELDS
// ─────────────────────────────────────────
function updateCountryFields(country) {
  // Hide all country fields
  var allCountryFields = document.querySelectorAll('.country-fields');
  allCountryFields.forEach(function(el) {
    el.style.display = 'none';
  });

  // Show selected country fields
  var targetFields = document.querySelector('.field-' + country);
  if (targetFields) {
    targetFields.style.display = '';
  }

  // Update tax rate placeholder based on country
  var taxRateInput = document.getElementById('equipTaxRate');
  if (taxRateInput) {
    switch (country) {
      case 'my': taxRateInput.value = 24; break;
      case 'us': taxRateInput.value = 21; break;
      case 'cn': taxRateInput.value = 25; break;
      case 'sg': taxRateInput.value = 17; break;
      default: taxRateInput.value = 24; break;
    }
  }
}

// ─────────────────────────────────────────
// 6. UPDATE KPI CARDS
// ─────────────────────────────────────────
function updateKPIs(r) {
  var fmt = function(val) {
    var sym = window.selectedCurrencySymbol || '$';
    return sym + Math.round(val).toLocaleString('en-US');
  };

  var kpiMonthly = document.getElementById('kpiMonthly');
  if (kpiMonthly) kpiMonthly.textContent = fmt(r.monthlyLease) + '/mo';

  var kpiTotal = document.getElementById('kpiTotal');
  if (kpiTotal) kpiTotal.textContent = fmt(r.totalLeaseCost);

  var kpiBuyCost = document.getElementById('kpiBuyCost');
  if (kpiBuyCost) kpiBuyCost.textContent = fmt(r.totalBuyCost);

  var kpiTaxSaving = document.getElementById('kpiTaxSaving');
  if (kpiTaxSaving) {
    if (r.country === 'my' && r.section46ASavings > 0) {
      kpiTaxSaving.textContent = fmt(r.section46ASavings);
    } else {
      kpiTaxSaving.textContent = fmt(Math.max(r.leaseTaxBenefit, r.buyTaxBenefit));
    }
  }

  var kpiLeaseVsBuy = document.getElementById('kpiLeaseVsBuy');
  if (kpiLeaseVsBuy) {
    var diff = Math.abs(r.leaseAfterTax - r.buyAfterTax);
    kpiLeaseVsBuy.textContent = fmt(diff);
    kpiLeaseVsBuy.style.color = r.preferLease ? 'var(--success)' : 'var(--primary)';
  }

  // Update tax note if exists
  var taxNoteEl = document.getElementById('taxNote');
  if (taxNoteEl) {
    taxNoteEl.textContent = r.taxNote;
  }
}

// ─────────────────────────────────────────
// 7. DOWNLOAD PDF
// ─────────────────────────────────────────
(function initPDF() {
  var btn = document.getElementById('downloadPDFBtn');
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

    var kpiMonthly = document.getElementById('kpiMonthly').textContent;
    var kpiTotal = document.getElementById('kpiTotal').textContent;
    var kpiBuyCost = document.getElementById('kpiBuyCost').textContent;
    var kpiTaxSaving = document.getElementById('kpiTaxSaving').textContent;

    var rows = [
      ['Monthly Lease Payment', kpiMonthly],
      ['Total Lease Cost', kpiTotal],
      ['Total Buy Cost', kpiBuyCost],
      ['Tax Savings', kpiTaxSaving]
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
// 8. COPY RESULTS
// ─────────────────────────────────────────
(function initCopy() {
  var btn = document.getElementById('copyResultsBtn');
  if (!btn) return;

  btn.addEventListener('click', function() {
    var sym = window.selectedCurrencySymbol || '$';
    var text = 'Equipment Lease vs Buy Analysis\n';
    text += 'Monthly Lease: ' + document.getElementById('kpiMonthly').textContent + '\n';
    text += 'Total Lease Cost: ' + document.getElementById('kpiTotal').textContent + '\n';
    text += 'Total Buy Cost: ' + document.getElementById('kpiBuyCost').textContent + '\n';
    text += 'Tax Savings: ' + document.getElementById('kpiTaxSaving').textContent + '\n';

    navigator.clipboard.writeText(text).then(function() {
      showToast('Results copied to clipboard!');
    }).catch(function() {
      showToast('Could not copy results.');
    });
  });
})();

// ─────────────────────────────────────────
// 9. SHARE RESULTS
// ─────────────────────────────────────────
(function initShare() {
  var btn = document.getElementById('shareResultsBtn');
  if (!btn) return;

  btn.addEventListener('click', function() {
    var params = new URLSearchParams();

    var cost = document.getElementById('equipCost').value;
    if (cost) params.set('cost', cost);

    var term = document.getElementById('equipTerm').value;
    if (term) params.set('term', term);

    var rate = document.getElementById('equipRate').value;
    if (rate) params.set('rate', rate);

    var country = document.getElementById('equipCountry');
    if (country) params.set('country', country.value);

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
// 10. SAVE RECORD
// ─────────────────────────────────────────
(function initSave() {
  var btn = document.getElementById('saveRecordBtn');
  if (!btn) return;

  btn.addEventListener('click', function() {
    var record = {
      id: Date.now(),
      cost: document.getElementById('equipCost').value,
      term: document.getElementById('equipTerm').value,
      rate: document.getElementById('equipRate').value,
      monthlyLease: document.getElementById('kpiMonthly').textContent,
      totalLease: document.getElementById('kpiTotal').textContent,
      taxSaving: document.getElementById('kpiTaxSaving').textContent,
      date: new Date().toLocaleDateString()
    };

    var records = JSON.parse(localStorage.getItem('equipRecords') || '[]');
    records.unshift(record);
    if (records.length > 10) records = records.slice(0, 10);
    localStorage.setItem('equipRecords', JSON.stringify(records));

    showToast('Calculation saved!');
  });
})();

// ─────────────────────────────────────────
// 11. TOAST NOTIFICATION
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
// 12. FORMAT CURRENCY
// ─────────────────────────────────────────
function fmt(val) {
  var sym = window.selectedCurrencySymbol || '$';
  return sym + Math.round(val).toLocaleString('en-US');
}

// ─────────────────────────────────────────
// 13. SMOOTH SCROLL
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
// 14. HEADER SCROLL EFFECT
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
