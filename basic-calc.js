/* =====================================================
   Calculator Pro — basic-calc.js
   Scientific Calculator Logic
   ===================================================== */

(function () {
  'use strict';

  // ── State ─
  let currentInput = '0';
  let previousInput = '';
  let operation = null;
  let resetInput = false;
  let expression = '';
  let history = JSON.parse(localStorage.getItem('calcHistory') || '[]');

  // Memory
  let memory = 0;

  // Angle mode: 'deg' or 'rad'
  let angleMode = 'deg';

  // 2nd function mode
  let secondMode = false;

  // Scientific mode
  let scientificMode = false;

  // ── DOM ─
  const resultEl = document.getElementById('calcResult');
  const expressionEl = document.getElementById('calcExpression');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const memIndicator = document.getElementById('memIndicator');
  const sciFnRow = document.getElementById('sciFnRow');
  const sciBtnsGrid = document.getElementById('sciBtnsGrid');

  // ── Helpers ─
  function toRad(deg) { return deg * Math.PI / 180; }
  function toDeg(rad) { return rad * 180 / Math.PI; }

  function roundResult(n) {
    if (!isFinite(n)) return n;
    return Math.round((n + Number.EPSILON) * 1e12) / 1e12;
  }

  function formatNum(n) {
    if (n === 'Error' || n === undefined) return 'Error';
    const num = parseFloat(n);
    if (isNaN(num)) return 'Error';
    if (!isFinite(num)) return num > 0 ? '∞' : '-∞';
    const str = num.toString();
    if (str.includes('e')) return str;
    if (str.length > 14) return num.toPrecision(10);
    return parseFloat(num.toPrecision(12)).toString();
  }

  function updateDisplay() {
    resultEl.textContent = formatNum(currentInput);
    expressionEl.textContent = expression;
    // Memory indicator
    if (memIndicator) {
      memIndicator.textContent = memory !== 0 ? 'M' : '';
    }
  }

  function setMode(mode) {
    scientificMode = (mode === 'scientific');
    if (sciFnRow) sciFnRow.style.display = scientificMode ? 'flex' : 'none';
    if (sciBtnsGrid) sciBtnsGrid.style.display = scientificMode ? 'grid' : 'none';
    // Update mode buttons
    document.querySelectorAll('.sci-mode-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-mode') === mode);
    });
  }

  // ── Input digit ─
  function inputDigit(digit) {
    if (currentInput === 'Error') clearAll();
    if (resetInput) {
      currentInput = digit === '.' ? '0.' : digit;
      resetInput = false;
    } else {
      if (digit === '.' && currentInput.includes('.')) return;
      if (currentInput === '0' && digit !== '.') {
        currentInput = digit;
      } else {
        if (currentInput.length >= 16) return;
        currentInput += digit;
      }
    }
    updateDisplay();
  }

  // ── Basic operations ─
  function inputOperation(op) {
    const inputVal = parseFloat(currentInput);
    if (isNaN(inputVal)) return;

    document.querySelectorAll('.sci-btn.op').forEach(b => b.classList.remove('active-op'));

    if (previousInput !== '' && !resetInput) {
      calculate();
    }

    operation = op;
    previousInput = currentInput;
    resetInput = true;
    expression = `${formatNum(previousInput)} ${getOpSymbol(op)}`;
    expressionEl.textContent = expression;
  }

  function getOpSymbol(op) {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default: return '';
    }
  }

  function calculate() {
    if (operation === null || previousInput === '') return;

    const prev = parseFloat(previousInput);
    const current = parseFloat(currentInput);
    if (isNaN(prev) || isNaN(current)) return;

    let result;
    switch (operation) {
      case '+': result = prev + current; break;
      case '-': result = prev - current; break;
      case '*': result = prev * current; break;
      case '/':
        if (current === 0) {
          currentInput = 'Error';
          previousInput = '';
          operation = null;
          expression = '';
          updateDisplay();
          return;
        }
        result = prev / current;
        break;
      default: return;
    }

    result = roundResult(result);
    const exprStr = `${formatNum(prev)} ${getOpSymbol(operation)} ${formatNum(current)} =`;

    currentInput = result.toString();
    previousInput = '';
    operation = null;
    resetInput = true;
    expression = exprStr;

    addHistory(exprStr, currentInput);
    updateDisplay();
    document.querySelectorAll('.sci-btn.op').forEach(b => b.classList.remove('active-op'));
  }

  // ── Scientific functions ─

  function sciSqrt() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    if (val < 0) { currentInput = 'Error'; updateDisplay(); return; }
    currentInput = roundResult(Math.sqrt(val)).toString();
    expression = `√(${formatNum(val)})`;
    addHistory(expression, currentInput);
    resetInput = true;
    updateDisplay();
  }

  function sciNthRoot() {
    // Prompts for n, then computes n-th root of current input
    // For simplicity: if previousInput is set, use it as n
    const val = parseFloat(currentInput);
    if (isNaN(val) || val < 0) { currentInput = 'Error'; updateDisplay(); return; }
    // Use previousInput as the root degree; default to 3 if not set
    const n = previousInput !== '' ? parseFloat(previousInput) : 3;
    if (n === 0) { currentInput = 'Error'; updateDisplay(); return; }
    currentInput = roundResult(Math.pow(val, 1 / n)).toString();
    expression = `ⁿ√(${formatNum(val)}) [n=${formatNum(n)}]`;
    addHistory(expression, currentInput);
    previousInput = '';
    resetInput = true;
    updateDisplay();
  }

  function sciSquare() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    currentInput = roundResult(val * val).toString();
    expression = `sqr(${formatNum(val)})`;
    addHistory(expression, currentInput);
    resetInput = true;
    updateDisplay();
  }

  function sciCube() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    currentInput = roundResult(val * val * val).toString();
    expression = `cube(${formatNum(val)})`;
    addHistory(expression, currentInput);
    resetInput = true;
    updateDisplay();
  }

  function sciPower() {
    // Use previousInput as base, currentInput as exponent
    if (previousInput !== '') {
      const base = parseFloat(previousInput);
      const exp = parseFloat(currentInput);
      if (isNaN(base) || isNaN(exp)) return;
      currentInput = roundResult(Math.pow(base, exp)).toString();
      expression = `${formatNum(base)}^${formatNum(exp)}`;
      addHistory(expression, currentInput);
      previousInput = '';
      resetInput = true;
      updateDisplay();
    } else {
      // Set up for power operation
      inputOperation('*');
      operation = 'pow';
    }
  }

  function sciInv() {
    const val = parseFloat(currentInput);
    if (isNaN(val) || val === 0) { currentInput = 'Error'; updateDisplay(); return; }
    currentInput = roundResult(1 / val).toString();
    expression = `1/(${formatNum(val)})`;
    addHistory(expression, currentInput);
    resetInput = true;
    updateDisplay();
  }

  function sciFactorial() {
    const val = parseInt(currentInput, 10);
    if (isNaN(val) || val < 0 || val > 170) { currentInput = 'Error'; updateDisplay(); return; }
    let result = 1;
    for (let i = 2; i <= val; i++) result *= i;
    currentInput = roundResult(result).toString();
    expression = `fact(${val})`;
    addHistory(expression, currentInput);
    resetInput = true;
    updateDisplay();
  }

  function sciTenPow() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    currentInput = roundResult(Math.pow(10, val)).toString();
    expression = `10^${formatNum(val)}`;
    addHistory(expression, currentInput);
    resetInput = true;
    updateDisplay();
  }

  function sciEPow() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    currentInput = roundResult(Math.exp(val)).toString();
    expression = `e^${formatNum(val)}`;
    addHistory(expression, currentInput);
    resetInput = true;
    updateDisplay();
  }

  function sciLog() {
    const val = parseFloat(currentInput);
    if (isNaN(val) || val <= 0) { currentInput = 'Error'; updateDisplay(); return; }
    currentInput = roundResult(Math.log10(val)).toString();
    expression = `log(${formatNum(val)})`;
    addHistory(expression, currentInput);
    resetInput = true;
    updateDisplay();
  }

  function sciLn() {
    const val = parseFloat(currentInput);
    if (isNaN(val) || val <= 0) { currentInput = 'Error'; updateDisplay(); return; }
    currentInput = roundResult(Math.log(val)).toString();
    expression = `ln(${formatNum(val)})`;
    addHistory(expression, currentInput);
    resetInput = true;
    updateDisplay();
  }

  function sciSin() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    const rad = angleMode === 'deg' ? toRad(val) : val;
    currentInput = roundResult(Math.sin(rad)).toString();
    expression = `sin(${formatNum(val)}°)`;
    addHistory(expression, currentInput);
    resetInput = true;
    updateDisplay();
  }

  function sciCos() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    const rad = angleMode === 'deg' ? toRad(val) : val;
    currentInput = roundResult(Math.cos(rad)).toString();
    expression = `cos(${formatNum(val)}°)`;
    addHistory(expression, currentInput);
    resetInput = true;
    updateDisplay();
  }

  function sciTan() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    const rad = angleMode === 'deg' ? toRad(val) : val;
    currentInput = roundResult(Math.tan(rad)).toString();
    expression = `tan(${formatNum(val)}°)`;
    addHistory(expression, currentInput);
    resetInput = true;
    updateDisplay();
  }

  function sciPi() {
    currentInput = Math.PI.toString();
    resetInput = true;
    updateDisplay();
  }

  function sciE() {
    currentInput = Math.E.toString();
    resetInput = true;
    updateDisplay();
  }

  function sciDeg2Rad() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    currentInput = roundResult(toRad(val)).toString();
    expression = `${formatNum(val)}° → rad`;
    addHistory(expression, currentInput);
    resetInput = true;
    updateDisplay();
  }

  function sciRad2Deg() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    currentInput = roundResult(toDeg(val)).toString();
    expression = `${formatNum(val)} rad → °`;
    addHistory(expression, currentInput);
    resetInput = true;
    updateDisplay();
  }

  function sciAbs() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    currentInput = Math.abs(val).toString();
    expression = `|${formatNum(val)}|`;
    addHistory(expression, currentInput);
    resetInput = true;
    updateDisplay();
  }

  function sciRand() {
    currentInput = Math.random().toString();
    resetInput = true;
    updateDisplay();
  }

  // ── Memory functions ─
  function memClear() { memory = 0; updateDisplay(); }
  function memRecall() { currentInput = memory.toString(); resetInput = true; updateDisplay(); }
  function memAdd() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    memory += val;
    resetInput = true;
    updateDisplay();
  }
  function memSubtract() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    memory -= val;
    resetInput = true;
    updateDisplay();
  }
  function memStore() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    memory = val;
    resetInput = true;
    updateDisplay();
  }

  // ── Basic functions ─
  function clearAll() {
    currentInput = '0';
    previousInput = '';
    operation = null;
    resetInput = false;
    expression = '';
    document.querySelectorAll('.sci-btn.op').forEach(b => b.classList.remove('active-op'));
    updateDisplay();
  }

  function clearEntry() {
    currentInput = '0';
    updateDisplay();
  }

  function backspace() {
    if (currentInput === 'Error') { clearAll(); return; }
    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
    } else {
      currentInput = '0';
    }
    updateDisplay();
  }

  function percent() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    currentInput = (val / 100).toString();
    updateDisplay();
  }

  function negate() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    currentInput = (-val).toString();
    updateDisplay();
  }

  // ── History ─
  function addHistory(expr, result) {
    history.unshift({ expr, result });
    if (history.length > 30) history.pop();
    localStorage.setItem('calcHistory', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    if (!historyList) return;
    if (history.length === 0) {
      historyList.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:8px 0;">No history yet</div>';
      return;
    }
    historyList.innerHTML = history.map(h =>
      `<div class="history-item" data-expr="${h.expr}" data-result="${h.result}">
        <div class="history-expr">${h.expr}</div>
        <div class="history-result">${h.result}</div>
      </div>`
    ).join('');

    historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', function () {
        currentInput = this.getAttribute('data-result');
        expression = this.getAttribute('data-expr');
        resetInput = true;
        updateDisplay();
      });
    });
  }

  function clearHistory() {
    history = [];
    localStorage.removeItem('calcHistory');
    renderHistory();
  }

  // ── Button click handler ─
  document.querySelectorAll('.sci-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const action = this.getAttribute('data-action');
      const value = this.getAttribute('data-value');

      if (value !== null) {
        inputDigit(value);
        return;
      }

      switch (action) {
        // Basic
        case 'clear': clearAll(); break;
        case 'clear-entry': clearEntry(); break;
        case 'backspace': backspace(); break;
        case 'percent': percent(); break;
        case 'negate': negate(); break;
        case 'equals': calculate(); break;
        // Operations
        case 'add': inputOperation('+'); break;
        case 'subtract': inputOperation('-'); break;
        case 'multiply': inputOperation('*'); break;
        case 'divide': inputOperation('/'); break;
        // Scientific
        case 'sqrt': sciSqrt(); break;
        case 'nth-root': sciNthRoot(); break;
        case 'square': sciSquare(); break;
        case 'cube': sciCube(); break;
        case 'power': sciPower(); break;
        case 'inv': sciInv(); break;
        case 'factorial': sciFactorial(); break;
        case 'ten-pow': sciTenPow(); break;
        case 'e-pow': sciEPow(); break;
        case 'log': sciLog(); break;
        case 'ln': sciLn(); break;
        case 'sin': sciSin(); break;
        case 'cos': sciCos(); break;
        case 'tan': sciTan(); break;
        case 'pi': sciPi(); break;
        case 'e': sciE(); break;
        case 'deg2rad': sciDeg2Rad(); break;
        case 'rad2deg': sciRad2Deg(); break;
        case 'abs': sciAbs(); break;
        case 'rand': sciRand(); break;
        // Memory
        case 'mc': memClear(); break;
        case 'mr': memRecall(); break;
        case 'mplus': memAdd(); break;
        case 'mminus': memSubtract(); break;
        case 'ms': memStore(); break;
        // Mode
        case 'deg':
          angleMode = (angleMode === 'deg') ? 'rad' : 'deg';
          const degBtn = document.querySelector('[data-action="deg"]');
          if (degBtn) degBtn.textContent = angleMode.toUpperCase();
          break;
        case 'sci-2nd':
          secondMode = !secondMode;
          const sndBtn = document.querySelector('[data-action="sci-2nd"]');
          if (sndBtn) sndBtn.classList.toggle('active-2nd', secondMode);
          break;
        default:
          break;
      }
    });
  });

  // Mode toggle buttons
  document.querySelectorAll('.sci-mode-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const mode = this.getAttribute('data-mode');
      setMode(mode);
    });
  });

  // ── Keyboard support ─
  document.addEventListener('keydown', function (e) {
    if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
    else if (e.key === '.') inputDigit('.');
    else if (e.key === '+') inputOperation('+');
    else if (e.key === '-') inputOperation('-');
    else if (e.key === '*') inputOperation('*');
    else if (e.key === '/') { e.preventDefault(); inputOperation('/'); }
    else if (e.key === 'Enter' || e.key === '=') calculate();
    else if (e.key === 'Escape') clearAll();
    else if (e.key === 'Backspace') backspace();
    else if (e.key === '%') percent();
    else if (e.key === 'p' || e.key === 'P') sciPi();
    else if (e.key === 'e' || e.key === 'E') sciE();
  });

  // ── Clear history button ─
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', clearHistory);
  }

  // ── Init ─
  updateDisplay();
  renderHistory();
  setMode('basic');

})();
