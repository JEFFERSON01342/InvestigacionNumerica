// Parser, solver and interface wiring for the linear programming page.

function $id(id){ return document.getElementById(id); }

class Rational {
  constructor(numerator, denominator = 1n){
    if(denominator === 0n) throw new Error('El denominador de una fracción no puede ser cero.');
    const sign = denominator < 0n ? -1n : 1n;
    const divisor = greatestCommonDivisor(numerator, denominator);
    this.numerator = sign * numerator / divisor;
    this.denominator = sign * denominator / divisor;
  }
  valueOf(){ return Number(this.numerator) / Number(this.denominator); }
}

function greatestCommonDivisor(left, right){
  left = left < 0n ? -left : left;
  right = right < 0n ? -right : right;
  while(right){ [left, right] = [right, left % right]; }
  return left || 1n;
}

function rational(value, denominator){
  if(value instanceof Rational) return value;
  if(denominator !== undefined){
    const left = rational(value);
    const right = rational(denominator);
    return new Rational(left.numerator * right.denominator, left.denominator * right.numerator);
  }
  if(typeof value === 'bigint') return new Rational(value);
  const text = String(value).trim();
  const parts = text.split('/');
  if(parts.length === 2) return rational(parts[0], parts[1]);
  if(parts.length !== 1 || !text) throw new Error('Número inválido: ' + value);
  const decimal = text.toLowerCase().match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/);
  if(!decimal || (!decimal[2] && !decimal[3])) throw new Error('Número inválido: ' + value);
  const sign = decimal[1] === '-' ? -1n : 1n;
  const fractionDigits = decimal[3] || '';
  const exponent = Number(decimal[4] || 0) - fractionDigits.length;
  let numerator = BigInt((decimal[2] || '0') + fractionDigits) * sign;
  if(exponent >= 0) numerator *= 10n ** BigInt(exponent);
  return exponent < 0 ? new Rational(numerator, 10n ** BigInt(-exponent)) : new Rational(numerator);
}

function rationalAdd(left, right){
  left = rational(left); right = rational(right);
  return new Rational(left.numerator * right.denominator + right.numerator * left.denominator, left.denominator * right.denominator);
}

function rationalSubtract(left, right){
  left = rational(left); right = rational(right);
  return new Rational(left.numerator * right.denominator - right.numerator * left.denominator, left.denominator * right.denominator);
}

function rationalMultiply(left, right){
  left = rational(left); right = rational(right);
  return new Rational(left.numerator * right.numerator, left.denominator * right.denominator);
}

function rationalDivide(left, right){
  left = rational(left); right = rational(right);
  return new Rational(left.numerator * right.denominator, left.denominator * right.numerator);
}

function rationalCompare(left, right){
  left = rational(left); right = rational(right);
  const difference = left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function rationalNegate(value){
  value = rational(value);
  return new Rational(-value.numerator, value.denominator);
}

function rationalIsZero(value){ return rational(value).numerator === 0n; }

// MathJax se carga de forma asíncrona. Durante DOMContentLoaded solo existe
// su objeto de configuración, por lo que typesetPromise aún puede no existir.
function typesetMath(elements){
  const render = () => {
    if(typeof window.MathJax?.typesetPromise === 'function'){
      window.MathJax.typesetPromise(elements).catch(error => console.warn('No se pudo renderizar MathJax:', error));
    }
  };
  if(typeof window.MathJax?.typesetPromise === 'function') render();
  else window.addEventListener('load', render, {once:true});
}

// --- Parser and solver (same logic as simplex) ---
function normalizeMathExpression(raw){
  let text = (raw || '').toString().trim();
  text = text.replace(/\$\$/g, '').replace(/\$/g, '');
  text = text.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1/$2)');
  text = text.replace(/\\(?:text|mathrm|mathbf|mathit|mathsf|mathtt)\s*\{([^{}]*)\}/g, '$1');
  text = text.replace(/\\left|\\right|\\text|\\mathrm|\\mathbf|\\mathit|\\mathsf|\\mathtt/g, ' ');
  text = text.replace(/\\([{}])/g, '$1').replace(/[{}]/g, '');
  text = text.replace(/\\cdot|\\times/g, '*');
  text = text.replace(/\\leq|\\le/g, ' <= ');
  text = text.replace(/\\geq|\\ge/g, ' >= ');
  text = text.replace(/≤|≥/g, m => m === '≤' ? ' <= ' : ' >= ');
  text = text.replace(/\s*<\s*=\s*/g, ' <= ');
  text = text.replace(/\s*>\s*=\s*/g, ' >= ');
  text = text.replace(/\s*:\s*/g, ' ');
  text = text.replace(/\s*\(\s*/g, ' ');
  text = text.replace(/\s*\)\s*/g, ' ');
  text = text.replace(/\s*\[\s*/g, ' ');
  text = text.replace(/\s*\]\s*/g, ' ');
  text = text.replace(/\s*(<=|>=|=)\s*/g, ' $1 ');
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/([A-Za-z])\s*_\s*\{\s*(\d+)\s*\}/ig, '$1$2');
  text = text.replace(/([A-Za-z])\s*_\s*(\d+)/ig, '$1$2');
  text = text.replace(/(\d)\s*([A-Za-z])/gi, '$1$2');
  text = text.replace(/([A-Za-z])\s*(\d)/g, '$1$2');
  text = text.replace(/^\s*[Zz]\s*=\s*/i, '');
  return text.replace(/\s+/g, ' ').trim();
}

function splitTerms(expr){
  const text = normalizeMathExpression(expr);
  if(!text) return [];
  return text.split(/(?=[+-])/).map(part => part.trim()).filter(Boolean);
}

function addTermToCoeffs(coeffs, token){
  const original = token.trim().replace(/\s+/g, '').replace(/\*/g, '');
  const sign = original.startsWith('-') ? -1 : 1;
  const term = original.replace(/^[+-]/, '');
  if(!term) return;
  const numericPattern = '(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:/(?:\\d+(?:\\.\\d*)?|\\.\\d+))?';
  const match = term.match(new RegExp(`^(${numericPattern})?([A-Za-z][A-Za-z0-9]*)?$`, 'i'));
  if(!match) {
    const spaced = term.match(new RegExp(`^([+-]?${numericPattern})?\\s*([A-Za-z][A-Za-z0-9]*)$`, 'i'));
    if(spaced){
      const coefficient = parseNumericInput(spaced[1] || '1');
      const variable = spaced[2].toLowerCase();
      coeffs[variable] = rationalAdd(coeffs[variable] || rational(0), rationalMultiply(sign, coefficient));
      return;
    }
    throw new Error('Término inválido: ' + token);
  }
  const numPart = match[1] || '1';
  const variable = (match[2] || '').toLowerCase();
  if(!variable){
    return;
  }
  coeffs[variable] = rationalAdd(coeffs[variable] || rational(0), rationalMultiply(sign, parseNumericInput(numPart)));
}

function parseNumericInput(value){
  const parts = String(value).split('/');
  if(parts.length > 2) throw new Error('Número inválido: ' + value);
  return parts.length === 2 ? rational(parts[0], parts[1]) : rational(parts[0]);
}

function parseObjective(text){
  const cleaned = normalizeMathExpression(text);
  let sense = null;
  let body = cleaned;
  // El signo menos puede ser parte del primer coeficiente; no debe consumirse
  // como separador de "max" o "min".
  const prefix = body.match(/^\s*(max|min)\s*(?::\s*)?(.*)$/i);
  if(prefix){
    sense = prefix[1].toLowerCase();
    body = prefix[2].trim();
  }
  const coeffs = {};
  for(const term of splitTerms(body)){
    if(term === '+') continue;
    const signed = term.replace(/^\+/, '');
    let token = signed;
    if(token.startsWith('-')){
      token = '-'+token.slice(1);
    }
    addTermToCoeffs(coeffs, token);
  }
  return {sense, coeffs, vars: Object.keys(coeffs)};
}

function parseConstraints(linesText){
  const lines = linesText.split('\n').map(l => l.trim()).filter(Boolean);
  const constraints = [];
  for(const line of lines){
    const expr = normalizeMathExpression(line);
    const match = expr.match(/^(.*?)(<=|>=|=)(.*)$/);
    if(!match) throw new Error('Restricción inválida: ' + line);
    const lhs = match[1].trim();
    const op = match[2].trim();
    const rhsText = match[3].trim();
    const rhs = parseNumericInput(rhsText);
    const coeffs = {};
    for(const term of splitTerms(lhs)){
      addTermToCoeffs(coeffs, term);
    }
    constraints.push({coeffs, op, rhs});
  }
  return constraints;
}

function collectVars(obj, constraints){
  const seen = new Set(); const vars = [];
  for(const v of (obj.vars || [])){ if(!seen.has(v)){ seen.add(v); vars.push(v); } }
  for(const c of constraints){ for(const v of Object.keys(c.coeffs)){ if(!seen.has(v)){ seen.add(v); vars.push(v); } } }
  return vars;
}

function buildTableau(obj, constraints){
  const zero = rational(0);
  const one = rational(1);
  const originalVars = collectVars(obj, constraints);
  const variableDomains = obj.variableDomains || {};
  const defaultDomain = obj.variableDomain === 'free' ? 'free' : 'nonnegative';
  const vars = [];
  const freeVariableNames = ['m', 'n', 'p', 'q'];
  const reservedNames = new Set(originalVars);
  let freeVariableIndex = 0;
  const variableMap = Object.fromEntries(originalVars.map(variable => {
    const domain = variableDomains[variable] || defaultDomain;
    if(domain === 'zero') return [variable, { positive: null, negative: null }];
    if(domain === 'nonpositive'){
      const negative = vars.length;
      vars.push(`${variable}-`);
      return [variable, { positive: null, negative }];
    }
    if(domain === 'free'){
      const positive = vars.length;
      const negative = positive + 1;
      const preferredNames = freeVariableNames.slice(freeVariableIndex * 2, freeVariableIndex * 2 + 2);
      const hasAvailableNames = preferredNames.length === 2 &&
        preferredNames.every(name => !reservedNames.has(name) && !vars.includes(name));
      const [positiveName, negativeName] = hasAvailableNames
        ? preferredNames
        : [`${variable}+`, `${variable}-`];
      freeVariableIndex++;
      vars.push(positiveName, negativeName);
      return [variable, { positive, negative }];
    }
    const positive = vars.length;
    vars.push(variable);
    return [variable, { positive, negative: null }];
  }));
  const m = constraints.length;
  const n = vars.length;
  const slackNames = [];
  const rows = [];
  const artificialColumns = [];
  let slackCount = 0;
  let excessCount = 0;
  let artificialCount = 0;
  const normalizedConstraints = constraints.map(constraint => {
    if(rationalCompare(constraint.rhs, 0) >= 0) return {...constraint, coeffs: {...constraint.coeffs}};
    const reversed = { '<=': '>=', '>=': '<=', '=': '=' }[constraint.op];
    return {
      op: reversed,
      rhs: rationalNegate(constraint.rhs),
      coeffs: Object.fromEntries(Object.entries(constraint.coeffs).map(([variable, coefficient]) => [variable, rationalNegate(coefficient)]))
    };
  });

  normalizedConstraints.forEach((constraint, rowIndex) => {
    const row = new Array(n).fill(zero);
    originalVars.forEach(variable => {
      const coefficient = constraint.coeffs[variable] || zero;
      const mapping = variableMap[variable];
      if(mapping.positive !== null) row[mapping.positive] = coefficient;
      if(mapping.negative !== null) row[mapping.negative] = rationalNegate(coefficient);
    });
    let basic;
    if(constraint.op === '<='){
      basic = `S${++slackCount}`;
      slackNames.push(basic);
      rows.push({ coeffs: row, extra: [{name: basic, value: one}], rhs: constraint.rhs, basic });
    } else if(constraint.op === '>='){
      const excess = `E${++excessCount}`;
      const artificial = `A${++artificialCount}`;
      slackNames.push(excess, artificial);
      artificialColumns.push(slackNames.length - 1);
      rows.push({
        coeffs: row,
        extra: [{name: excess, value: rational(-1)}, {name: artificial, value: one}],
        rhs: constraint.rhs,
        basic: artificial
      });
    } else {
      const artificial = `A${++artificialCount}`;
      slackNames.push(artificial);
      artificialColumns.push(slackNames.length - 1);
      rows.push({ coeffs: row, extra: [{name: artificial, value: one}], rhs: constraint.rhs, basic: artificial });
    }
  });

  const extraCount = slackNames.length;
  const tableau = rows.map(row => {
    const slack = new Array(extraCount).fill(zero);
    row.extra.forEach(item => { slack[slackNames.indexOf(item.name)] = item.value; });
    return { coeffs: row.coeffs.slice(), slack, rhs: row.rhs, basic: row.basic };
  });

  const objectiveDirection = obj.sense === 'min' ? -1 : 1;
  const cvec = new Array(vars.length).fill(zero);
  originalVars.forEach(variable => {
    const coefficient = rationalMultiply(objectiveDirection, obj.coeffs[variable] || zero);
    const mapping = variableMap[variable];
    if(mapping.positive !== null) cvec[mapping.positive] = coefficient;
    if(mapping.negative !== null) cvec[mapping.negative] = rationalNegate(coefficient);
  });
  const bigM = rational(1000000);
  const objRow = {
    coeffs: cvec.map(rationalNegate),
    slack: new Array(extraCount).fill(zero),
    rhs: zero,
    basic: 'Z'
  };
  artificialColumns.forEach(column => { objRow.slack[column] = bigM; });
  return {
    vars,
    slackNames,
    tableau,
    objRow,
    bigM,
    objectiveDirection,
    objectiveSense: obj.sense || 'max',
    objectiveCoeffs: {...obj.coeffs},
    originalVars,
    variableMap,
    variableDomains: Object.fromEntries(originalVars.map(variable => [
      variable,
      variableDomains[variable] || defaultDomain
    ])),
    freeVariables: originalVars.some(variable => (variableDomains[variable] || defaultDomain) === 'free'),
    objectiveVector: Object.fromEntries(vars.map((variable, index) => [variable, cvec[index]]))
  };
}

function cloneTableauState(vars, slackNames, tableau, objRow, metadata = {}){ return { vars: vars.slice(), slackNames: slackNames.slice(), tableau: tableau.map(r=>({coeffs:r.coeffs.slice(), slack:r.slack.slice(), rhs:r.rhs, basic:r.basic})), objRow: {coeffs: objRow.coeffs.slice(), slack: objRow.slack.slice(), rhs: objRow.rhs, basic: objRow.basic}, ...metadata }; }

function findEntering(objRow){ for(let j=0;j<objRow.coeffs.length;j++){ if(rationalCompare(objRow.coeffs[j], 0) < 0) return j; } return -1; }
function findLeaving(tableau, enteringIndex){ let bestRatio=null, rowIdx=-1; for(let i=0;i<tableau.length;i++){ const aij=tableau[i].coeffs[enteringIndex]; if(rationalCompare(aij, 0)>0){ const ratio=rationalDivide(tableau[i].rhs,aij); if(rationalCompare(ratio, 0)>=0 && (bestRatio===null || rationalCompare(ratio,bestRatio)<0)){ bestRatio=ratio; rowIdx=i; } } } return rowIdx; }
function pivotOn(state, enteringIndex, leavingRowIdx){ const T=state.tableau; const row=T[leavingRowIdx]; const pivot=row.coeffs[enteringIndex]; // prepare op info
  const opInfo = { enteringIndex, leavingRowIdx, pivot: pivot, normalizedRow: null, factors: [] };
  // normalize pivot row
  const normCoeffs = row.coeffs.map(v=> rationalDivide(v, pivot));
  const normSlack = row.slack.map(v=> rationalDivide(v, pivot));
  const normRhs = rationalDivide(row.rhs, pivot);
  opInfo.normalizedRow = { coeffs: normCoeffs.slice(), slack: normSlack.slice(), rhs: normRhs };
  // replace pivot row with normalized
  for(let j=0;j<row.coeffs.length;j++) row.coeffs[j]=normCoeffs[j];
  for(let j=0;j<row.slack.length;j++) row.slack[j]=normSlack[j];
  row.rhs = normRhs;
  // eliminate other rows
  for(let i=0;i<T.length;i++){ if(i===leavingRowIdx) continue; const factor=T[i].coeffs[enteringIndex]; opInfo.factors[i]=factor; if(rationalIsZero(factor)) continue; for(let j=0;j<T[i].coeffs.length;j++) T[i].coeffs[j]=rationalSubtract(T[i].coeffs[j],rationalMultiply(factor,row.coeffs[j])); for(let j=0;j<T[i].slack.length;j++) T[i].slack[j]=rationalSubtract(T[i].slack[j],rationalMultiply(factor,row.slack[j])); T[i].rhs=rationalSubtract(T[i].rhs,rationalMultiply(factor,row.rhs)); }
  // update objective row
  const f=state.objRow.coeffs[enteringIndex]; if(!rationalIsZero(f)){ for(let j=0;j<state.objRow.coeffs.length;j++) state.objRow.coeffs[j]=rationalSubtract(state.objRow.coeffs[j],rationalMultiply(f,row.coeffs[j])); for(let j=0;j<state.objRow.slack.length;j++) state.objRow.slack[j]=rationalSubtract(state.objRow.slack[j],rationalMultiply(f,row.slack[j])); state.objRow.rhs=rationalSubtract(state.objRow.rhs,rationalMultiply(f,row.rhs)); }
  state.tableau[leavingRowIdx].basic = state.vars[enteringIndex];
  opInfo.newBasic = state.tableau[leavingRowIdx].basic;
  return opInfo;
}

function simplexSteps(obj, constraints){ const built=buildTableau(obj,constraints); let vars=built.vars, slackNames=built.slackNames, tableau=built.tableau, objRow=built.objRow; const metadata = {
  objectiveDirection: built.objectiveDirection,
  bigM: built.bigM,
  objectiveSense: built.objectiveSense,
  objectiveCoeffs: built.objectiveCoeffs
}; const fullSteps=[]; // push initial
  fullSteps.push({type:'initial', state: cloneTableauState(vars, slackNames, tableau, objRow, metadata)});
  for(let iter=0;iter<200;iter++){
    const entering=findEntering(objRow);
    if(entering===-1) break; // optimal
    const leaving=findLeaving(tableau, entering);
    if(leaving===-1) throw new Error('Problema no acotado (unbounded)');
    const before = cloneTableauState(vars, slackNames, tableau, objRow, metadata);
    const opInfo = pivotOn({vars, slackNames, tableau, objRow}, entering, leaving);
    const after = cloneTableauState(vars, slackNames, tableau, objRow, metadata);
    fullSteps.push({type:'pivot', before: before, op: opInfo, after: after});
  }
  return fullSteps;
}

// --- Rendering helpers (LaTeX via MathJax) ---
function formatNum(value){
  if(value instanceof Rational){
    if(value.numerator === 0n) return '0';
    const sign = value.numerator < 0n ? '-' : '';
    const numerator = value.numerator < 0n ? -value.numerator : value.numerator;
    return value.denominator === 1n
      ? `${sign}${numerator}`
      : `${sign}\\frac{${numerator}}{${value.denominator}}`;
  }
  if(!Number.isFinite(value)) return String(value);
  if(Math.abs(value) < 1e-9) return '0';
  const sign = value < 0 ? '-' : '';
  let remainder = Math.abs(value);
  let previousNumerator = 0, numerator = 1;
  let previousDenominator = 1, denominator = 0;
  let bestNumerator = Math.round(remainder), bestDenominator = 1;

  for(let iteration = 0; iteration < 32; iteration++){
    const whole = Math.floor(remainder);
    const nextNumerator = whole * numerator + previousNumerator;
    const nextDenominator = whole * denominator + previousDenominator;
    if(nextDenominator > 1000000) break;
    previousNumerator = numerator;
    numerator = nextNumerator;
    previousDenominator = denominator;
    denominator = nextDenominator;
    bestNumerator = numerator;
    bestDenominator = denominator;
    if(Math.abs(numerator / denominator - Math.abs(value)) < 1e-10) break;
    const fractionalPart = remainder - whole;
    if(fractionalPart < 1e-14) break;
    remainder = 1 / fractionalPart;
  }

  const formattedNumerator = sign + bestNumerator;
  return bestDenominator === 1
    ? formattedNumerator
    : `${sign}\\frac{${bestNumerator}}{${bestDenominator}}`;
}

function formatDecimal(value){
  const decimal = Number(value);
  if(Math.abs(decimal) < 1e-9) return '0';
  return String(Number(decimal.toFixed(8)));
}
function tableToLatex(st){
  const columns = ['c', ...Array(st.vars.length + st.slackNames.length + 1).fill('r')].join('');
  const headers = ['\\mathrm{BV}', ...st.vars.map(v => `$${v}$`), ...st.slackNames.map(name => `$${name}$`), '$\\mathrm{RHS}$'];
  const formatRow = row => [
    `$${row.basic}$`,
    ...row.coeffs.map(formatNum),
    ...row.slack.map(formatNum),
    formatNum(row.rhs)
  ].join(' & ');
  const rows = [
    formatRow(st.objRow),
    ...st.tableau.map(formatRow)
  ];
  return `\\[\\begin{array}{${columns}}${headers.join(' & ')} \\\\ \\hline ${rows.join(' \\\\ ')} \\\\ \\end{array}\\]`;
}

// Convert LaTeX input to ASCII for parser
function latexToAscii(s){ if(!s) return ''; let t=s; t=t.replace(/\\leq|\\le/g,' <= '); t=t.replace(/\\geq|\\ge/g,' >= '); t=t.replace(/<=|>=|=/g,m => ` ${m} `); t=t.replace(/\\cdot/g,'*'); t=t.replace(/\\times/g,'*'); t=t.replace(/\u2264/g,' <= '); t=t.replace(/\u2265/g,' >= '); t=t.replace(/([A-Za-z])\s*_\s*\{\s*(\d+)\s*\}/ig,'$1$2'); t=t.replace(/([A-Za-z])\s*_\s*(\d+)/ig,'$1$2'); t=t.replace(/(\d)([A-Za-z]\w*)/ig,'$1 $2'); t=t.replace(/\$/g,''); t=t.replace(/\s+/g,' '); return t.trim(); }

// UI: store constraints as LaTeX strings
const constraintsLatex = []; // LaTeX strings
const variableDomainsPL = Object.create(null);

function updateVariableDomainControls(){
  const container = $id('variable-domains-pl');
  if(!container) return;
  const objectiveField = $id('objective-field');
  const objective = { vars: [] };
  if(objectiveField && objectiveField.value.trim()){
    try { objective.vars = parseObjective(latexToAscii(objectiveField.value)).vars; }
    catch(error){ console.debug('La función objetivo aún está incompleta:', error.message); }
  }
  const constraints = [];
  constraintsLatex.forEach(line => {
    try { constraints.push(...parseConstraints(latexToAscii(line))); }
    catch(error){ console.debug('La restricción aún está incompleta:', error.message); }
  });
  updateSimplexMethodOptions(constraints);
  const variables = collectVars(objective, constraints);
  container.replaceChildren();
  if(!variables.length){
    container.textContent = 'Escribe la función objetivo o añade restricciones para detectar las variables.';
    return;
  }
  const options = [
    ['nonnegative', '≥ 0 (no negativa)'],
    ['nonpositive', '≤ 0 (no positiva)'],
    ['zero', '= 0 (fija)'],
    ['free', 'Libre (sin restricción de signo)']
  ];
  variables.forEach(variable => {
    const row = document.createElement('div');
    row.className = 'variable-domain-row';
    const label = document.createElement('label');
    const select = document.createElement('select');
    const id = `variable-domain-${variable}`;
    label.htmlFor = id;
    label.textContent = variable;
    select.id = id;
    select.setAttribute('aria-label', `Signo de ${variable}`);
    options.forEach(([value, text]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      select.appendChild(option);
    });
    select.value = variableDomainsPL[variable] || 'nonnegative';
    variableDomainsPL[variable] = select.value;
    select.addEventListener('change', () => {
      variableDomainsPL[variable] = select.value;
      if(typeof updatePlotFromInputs === 'function') updatePlotFromInputs();
    });
    row.append(label, select);
    container.appendChild(row);
  });
}

function isStandardSimplexModel(constraints){
  return constraints.every(constraint => {
    const operator = rationalCompare(constraint.rhs, 0) < 0
      ? {'<=': '>=', '>=': '<=', '=': '='}[constraint.op]
      : constraint.op;
    return operator === '<=';
  });
}

function updateSimplexMethodOptions(constraints){
  const select = $id('method-pl');
  if(!select) return;
  const standardModel = isStandardSimplexModel(constraints);
  const selected = select.value;
  const options = Array.from(select.options);
  options.forEach(option => {
    const available = standardModel
      ? ['simplex', 'revised', 'big-m', 'two-phase', 'graphical'].includes(option.value)
      : ['revised', 'big-m', 'two-phase', 'graphical'].includes(option.value);
    option.disabled = !available;
    option.hidden = !available;
  });
  const availableValues = standardModel
    ? ['simplex', 'revised', 'big-m', 'two-phase', 'graphical']
    : ['revised', 'big-m', 'two-phase', 'graphical'];
  select.value = availableValues.includes(selected)
    ? selected
    : standardModel ? 'simplex' : 'big-m';
}

function updateMethodControls(){
  const method = $id('method-pl')?.value;
  const calculateButton = $id('btn-calc-pl');
  if(calculateButton){
    calculateButton.textContent = {
      simplex: 'Calcular Símplex',
      revised: 'Calcular Símplex revisado',
      'big-m': 'Calcular Gran M',
      'two-phase': 'Calcular Dos Fases',
      graphical: 'Resolver método gráfico'
    }[method] || 'Calcular método';
  }
  refreshExampleOptions();
}

const simplexExamples = [
  {
    method: 'simplex',
    label: 'Símplex estándar — mezcla de productos',
    objective: '3x+2y',
    constraints: ['x+y<=4', 'x<=2', 'y<=3']
  },
  {
    method: 'revised',
    label: 'Símplex revisado — costos reducidos y pivotes',
    objective: '5x+4y',
    constraints: ['6x+4y<=24', 'x+2y<=6', 'x<=3']
  },
  {
    method: 'big-m',
    label: 'Gran M — restricción mayor o igual',
    objective: '3x+2y',
    constraints: ['x+y>=4', 'x<=3', 'y<=3']
  },
  {
    method: 'two-phase',
    label: 'Dos Fases — base artificial inicial',
    objective: '5x+4y',
    constraints: ['6x+4y>=12', 'x+y<=5', 'x<=4', 'y<=3']
  },
  {
    method: 'graphical',
    label: 'Método gráfico — región de dos variables',
    objective: '3x+2y',
    constraints: ['x+y<=4', 'x<=3', 'y<=2']
  }
];

function refreshExampleOptions(){
  const select = $id('example-pl');
  const runButton = $id('run-example-pl');
  const method = $id('method-pl')?.value;
  if(!select || !runButton) return;
  const examples = simplexExamples.filter(example => example.method === method);
  select.replaceChildren(new Option('Elige un ejemplo para el método seleccionado', ''));
  examples.forEach((example, index) => select.add(new Option(example.label, String(index))));
  runButton.disabled = examples.length === 0 || !select.value;
}

function runSelectedExample(){
  const selectedValue = $id('example-pl')?.value;
  if(!selectedValue){
    $id('status').textContent = 'Selecciona un ejemplo para el método actual.';
    return;
  }
  const selectedIndex = Number(selectedValue);
  const example = simplexExamples.filter(item => item.method === $id('method-pl')?.value)[selectedIndex];
  if(!example){
    $id('status').textContent = 'Selecciona un ejemplo para el método actual.';
    return;
  }

  const objectiveField = $id('objective-field');
  const constraintField = $id('constraint-field');
  objectiveField.value = example.objective;
  objectiveField.dispatchEvent(new Event('input', {bubbles:true}));
  constraintField.value = '';
  constraintsLatex.splice(0, constraintsLatex.length, ...example.constraints);
  for(const variable of Object.keys(variableDomainsPL)) delete variableDomainsPL[variable];
  collectVars(
    parseObjective(latexToAscii(example.objective)),
    parseConstraints(example.constraints.map(latexToAscii).join('\n'))
  ).forEach(variable => { variableDomainsPL[variable] = 'nonnegative'; });
  document.querySelector('input[name="sense-pl"][value="max"]').checked = true;
  $id('dual-mode-pl').value = 'off';
  $id('dual-focus-item').hidden = true;
  $id('method-pl').value = example.method;
  renderConstraintBracket(constraintsLatex);
  updateVariableDomainControls();
  updateMethodControls();
  $id('preflight').scrollIntoView({behavior:'smooth', block:'center'});
  $id('btn-calc-pl').click();
  window.setTimeout(() => {
    $id('steps').scrollIntoView({behavior:'smooth', block:'start'});
    typesetMath();
  }, 150);
}

// helper to create step cards in #steps
function appendStepCard(html){ const container = $id('steps'); const card = document.createElement('div'); card.className='step-card'; card.innerHTML = html; container.appendChild(card); }

function displayVariableMap(objectiveLatex = $id('objective-field')?.value || '', constraintLines = constraintsLatex){
  let objective = {vars: []};
  try {
    objective = parseObjective(latexToAscii(objectiveLatex));
  } catch(error) {
    console.debug('No se pudieron detectar todas las variables de la función para mostrar subíndices:', error.message);
  }
  const constraints = [];
  constraintLines.forEach(line => {
    try {
      constraints.push(...parseConstraints(latexToAscii(line)));
    } catch(error) {
      console.debug('No se pudieron detectar todas las variables de una restricción para mostrar subíndices:', error.message);
    }
  });
  return new Map(collectVars(objective, constraints).map((variable, index) => [variable, index + 1]));
}

function formatVariablesForDisplay(latex, variableIndexes){
  return latex.replace(/\\[A-Za-z]+|[A-Za-z][A-Za-z0-9]*(?:_\{?\d+\}?)?/g, token => {
    if(token.startsWith('\\')) return token;
    const variable = token.toLowerCase().replace(/_\{?(\d+)\}?/, '$1');
    const index = variableIndexes.get(variable);
    return index ? `x_{${index}}` : token;
  });
}

function renderConstraintBracket(constraintsLatexLocal){
  const el = $id('constraintBracket');
  if(!constraintsLatexLocal.length){
    el.innerHTML = '\\(\\left\\{\\begin{array}{l} \\text{(vacío)}\\\\\\end{array}\\right.\\)';
    typesetMath();
    return;
  }
  const variables = displayVariableMap(undefined, constraintsLatexLocal);
  const body = constraintsLatexLocal
    .map(constraint => formatVariablesForDisplay(constraint.replace(/\$/g, ''), variables))
    .join(' \\\\ ');
  el.innerHTML = `\\(\\left\\{\\begin{array}{l} ${body} \\\\ \\end{array}\\right.\\)`;
  typesetMath();
}
function renderInputDisplay(sense,objLatex,constraintsLatexLocal){
  const el = $id('render-input');
  const variables = displayVariableMap(objLatex, constraintsLatexLocal);
  el.innerHTML = '';
  const senseText = sense === 'max' ? 'Maximizar' : 'Minimizar';
  const objective = document.createElement('div');
  objective.innerHTML = `<strong>${senseText} Z = </strong> $${formatVariablesForDisplay(objLatex || '', variables)}$`;
  el.appendChild(objective);
  const heading = document.createElement('div');
  heading.innerHTML = '<strong>Restricciones:</strong>';
  el.appendChild(heading);
  const list = document.createElement('div');
  list.innerHTML = constraintsLatexLocal
    .map(constraint => `$${formatVariablesForDisplay(constraint, variables)}$`)
    .join('<br>');
  el.appendChild(list);
  typesetMath();
}

function renderStepsLatex(steps){ const container=$id('steps'); container.innerHTML=''; if(!steps || steps.length===0) return; const initial=steps[0]; const title0=document.createElement('h3'); title0.textContent='Tabla inicial'; container.appendChild(title0); const pre0=document.createElement('div'); pre0.innerHTML = tableToLatex(initial); container.appendChild(pre0); typesetMath(); for(let s=1;s<steps.length;s++){ const st=steps[s]; const title=document.createElement('h3'); title.textContent = `Tabla ${s}`; container.appendChild(title); const beforeDiv=document.createElement('div'); beforeDiv.innerHTML = tableToLatex(steps[s-1]); container.appendChild(beforeDiv); const ops=document.createElement('div'); ops.innerHTML = `<strong>Operación:</strong> pivot aplicado.`; container.appendChild(ops); const afterDiv=document.createElement('div'); afterDiv.innerHTML = tableToLatex(st); container.appendChild(afterDiv); typesetMath(); }
  // solution
  const last = steps[steps.length-1]; const sol = computeSolutionFromTable(last); const vdiv=document.createElement('div'); vdiv.innerHTML = '<h4>Solución</h4>' + sol.vars.map(s=>`$${s.var} = ${formatNum(s.value)}$`).join('<br>') + `<br> $Z = ${formatNum(sol.Z)}$`; container.appendChild(vdiv); typesetMath(); }

function computeSolutionFromTable(st){
  const res=[];
  const originalVars = st.originalVars || st.vars;
  for(const variable of originalVars){
    const mapping = st.variableMap && st.variableMap[variable];
    const positiveColumn = mapping && mapping.positive !== null ? st.vars[mapping.positive] : null;
    const negativeColumn = mapping && mapping.negative !== null ? st.vars[mapping.negative] : null;
    const positiveRow = positiveColumn && st.tableau.find(item => item.basic === positiveColumn);
    const negativeRow = negativeColumn && st.tableau.find(item => item.basic === negativeColumn);
    res.push({
      var: variable,
      value: rationalSubtract(positiveRow ? positiveRow.rhs : rational(0), negativeRow ? negativeRow.rhs : rational(0))
    });
  }
  const direction = st.objectiveDirection || 1;
  const infeasible = st.tableau.some(row => /^A\d+$/.test(row.basic) && !rationalIsZero(row.rhs));
  return {vars: res, Z: rationalMultiply(st.objRow.rhs, direction), infeasible};
}

// wire buttons to math-field inputs
function initPLUI(){ const objField = $id('objective-field'); const consField = $id('constraint-field'); const addBtn = $id('btn-add-constraint'); const clearConsBtn = $id('btn-clear-constraints'); const calcBtn = $id('btn-calc-pl'); const clearAllBtn = $id('btn-clear-all'); const status = $id('status'); const methodSelect = $id('method-pl'); renderConstraintBracket(constraintsLatex);

  objField.addEventListener('input', updateVariableDomainControls);
  methodSelect.addEventListener('change', updateMethodControls);
  $id('example-pl').addEventListener('change', event=>{
    $id('run-example-pl').disabled = !event.currentTarget.value;
  });
  $id('run-example-pl').addEventListener('click', runSelectedExample);
  updateVariableDomainControls();
  updateMethodControls();
  addBtn.addEventListener('click', ()=>{ const raw = consField.value.trim(); if(!raw) return; constraintsLatex.push(raw); renderConstraintBracket(constraintsLatex); updateVariableDomainControls(); consField.value = ''; consField.focus(); if(typeof updatePlotFromInputs === 'function') updatePlotFromInputs(); });
  clearConsBtn.addEventListener('click', ()=>{ constraintsLatex.length = 0; renderConstraintBracket(constraintsLatex); updateVariableDomainControls(); $id('preflight').className='verification-box'; $id('preflight').textContent='Añade la función objetivo y las restricciones para comprobar el modelo.'; if(typeof simplexDesmos !== 'undefined' && simplexDesmos) simplexDesmos.setBlank(); });
  calcBtn.addEventListener('click', ()=>{ // calculate simplex
    // clear previous output and show processing
    $id('steps').innerHTML = '';
    // No vaciar #plot: Desmos conserva una instancia ligada a este elemento.
    status.textContent = 'Procesando...';
    try{
      const sense = document.querySelector('input[name="sense-pl"]:checked').value;
      updateVariableDomainControls();
      const variableDomains = {...variableDomainsPL};
      const objLatex = objField.value.trim();
      console.log('Calcular Simplex triggered, objective:', objLatex, 'sense:', sense, 'constraints:', constraintsLatex);
      if(!objLatex) throw new Error('Ingrese la función objetivo.');
      const consL = constraintsLatex.slice();
      const objAscii = latexToAscii(objLatex);
      console.log('Objective ASCII:', objAscii);
      let obj = parseObjective((sense? sense+': ':'') + objAscii);
      obj.variableDomains = variableDomains;
      const consAsciiLines = consL.map(l=> latexToAscii(l));
      console.log('Constraints ASCII lines:', consAsciiLines);
      let parsedConstraints = parseConstraints(consAsciiLines.join('\n'));
      const dualMode = $id('dual-mode-pl')?.value || 'off';
      const dualFocus = $id('dual-focus-pl')?.value || 'primal';
      let dualContext = null;
      if(dualMode === 'enabled'){
        obj.vars = collectVars(obj, parsedConstraints);
        const primalModel = {objective: obj, constraints: parsedConstraints};
        const dualModel = buildDualModel(obj, parsedConstraints);
        dualContext = {primal: primalModel, dual: dualModel, focus: dualFocus};
        $id('dual-results-card').hidden = false;
        $id('dual-results').replaceChildren();
        $id('dual-results-title').textContent = dualFocus === 'dual'
          ? 'Modelo primal y comparación'
          : 'Modelo dual y comparación';
        if(dualFocus === 'dual'){
          obj = dualModel.objective;
          parsedConstraints = dualModel.constraints;
          updateSimplexMethodOptions(parsedConstraints);
          if($id('method-pl').value === 'graphical' && collectVars(obj, parsedConstraints).length !== 2){
            $id('method-pl').value = isStandardSimplexModel(parsedConstraints) ? 'simplex' : 'big-m';
            updateMethodControls();
          }
        }
      } else {
        $id('dual-results-card').hidden = true;
        $id('dual-results').replaceChildren();
      }
      const method = $id('method-pl') ? $id('method-pl').value : 'big-m';
      const workingSense = obj.sense || sense;
      if(method === 'graphical'){
        obj.vars = collectVars(obj, parsedConstraints);
        if(obj.vars.length !== 2) throw new Error('El método gráfico solo se puede aplicar a modelos con exactamente dos variables.');
        if(dualFocus !== 'dual') obj.variableDomains = variableDomains;
        const report = validateSimplexModel(obj, parsedConstraints, workingSense, method);
        renderPreflightReport(report);
        if(!report.ok) throw new Error('El modelo gráfico necesita al menos una restricción válida.');
        const result = solveGraphicalModel(obj, parsedConstraints);
        renderGraphicalResult(result, obj, parsedConstraints);
        renderGraphicalVerification(result, obj);
        plotGraphicalModel(obj, parsedConstraints, result);
        if(dualContext){
          if(dualFocus === 'dual') prependDualTransformation(dualContext, $id('steps'));
          completeDualWorkflow(dualContext, {
            objective: obj,
            constraints: parsedConstraints,
            variables: obj.vars,
            type: 'graphical',
            result,
            value: result.optimum?.objective || null,
            unbounded: result.unbounded,
            infeasible: result.feasibleVertices.length === 0
          });
        }
        status.textContent = result.unbounded
          ? `La región factible es no acotada en la dirección de mejora de ${obj.objectiveName || 'Z'}.`
          : result.optimum ? 'Método gráfico completado.' : 'No se encontró una región factible.';
        return;
      }
      // x ≥ 0, y ≥ 0, ... ya son condiciones propias del simplex estándar;
      // no se agregan como filas artificiales de tipo ≥ al tableau.
      const implicitNonNegative = parsedConstraints.filter(constraint =>
        typeof isImplicitNonNegativity === 'function' &&
        isImplicitNonNegativity(constraint) &&
        variableDomains[Object.keys(constraint.coeffs).find(variable => !rationalIsZero(constraint.coeffs[variable]))] === 'nonnegative'
      );
      const implicitConstraints = new Set(implicitNonNegative);
      const cons = parsedConstraints.filter(constraint => !implicitConstraints.has(constraint));
      console.log('Parsed constraints:', cons);
      const preflight = validateSimplexModel(obj, cons, workingSense, method);
      if(implicitNonNegative.length) preflight.notes.push(`Se reconocieron ${implicitNonNegative.length} condición(es) de no negatividad implícita(s).`);
      renderPreflightReport(preflight);
      if(!preflight.ok) throw new Error('El modelo no puede resolverse con el simplex estándar. Revisa la comprobación previa.');
      const steps = method === 'revised'
        ? revisedSimplexSteps(obj, cons)
        : method === 'two-phase' ? twoPhaseSteps(obj, cons) : simplexSteps(obj, cons, method);
      console.log('Simplex produced steps count:', steps.length);
      if(!steps || steps.length===0){ status.textContent='No se generaron pasos (revisar entrada).'; return; }
      if(method === 'revised') renderRevisedSteps(steps);
      else renderStepsLatex(steps, obj, cons);
      const lastState = steps[steps.length - 1].after || steps[steps.length - 1].state;
      if(steps[steps.length - 1].type === 'unbounded') {
        renderUnboundedVerification(obj.objectiveName || 'Z');
      } else {
        const solution = computeSolutionFromTable({...lastState, variableDomains: obj.variableDomains});
        if(solution.infeasible) renderInfeasibleVerification();
        else renderResultVerification(solution, obj, cons);
      }
      const built = buildTableau(obj, cons);
      obj.vars = built.originalVars || built.vars;
      plot2vars(obj, cons);
      if(dualContext){
        if(dualFocus === 'dual') prependDualTransformation(dualContext, $id('steps'));
        const solution = steps[steps.length - 1].type === 'unbounded'
          ? null
          : computeSolutionFromTable({...lastState, variableDomains: obj.variableDomains});
        completeDualWorkflow(dualContext, {
          objective: obj,
          constraints: cons,
          variables: obj.vars,
          type: 'simplex',
          solution,
          value: solution && !solution.infeasible ? solution.Z : null,
          unbounded: steps[steps.length - 1].type === 'unbounded',
          infeasible: Boolean(solution?.infeasible)
        });
      }
      status.textContent = steps[steps.length - 1].type === 'unbounded' ? 'Proceso terminado: el problema no está acotado.' : 'Proceso completado.';
    }catch(e){
      console.error('Error during simplex calculation:', e);
      if(e.message.includes('no acotado') && typeof renderPreflightReport === 'function'){
        renderPreflightReport({ ok:false, issues:['El método detectó que Z puede crecer indefinidamente: no existe una fila saliente para el pivote.'], notes:[] });
      }
      status.textContent = 'Error: '+e.message + ' (ver consola para más detalles)';
    }
  });
  clearAllBtn.addEventListener('click', ()=>{ objField.value=''; consField.value=''; constraintsLatex.length=0; renderConstraintBracket(constraintsLatex); updateVariableDomainControls(); $id('preflight').textContent='Añade la función objetivo y las restricciones para comprobar el modelo.'; $id('verification').textContent='Aquí se verificará la solución al finalizar el método.'; $id('steps').innerHTML=''; $id('dual-results').replaceChildren(); $id('dual-results-card').hidden=true; if(typeof simplexDesmos !== 'undefined' && simplexDesmos) simplexDesmos.setBlank(); status.innerText=''; }); }

// small plot function (2 vars support)
function plot2vars(obj, constraints){ const plotDiv=$id('plot'); plotDiv.innerHTML=''; if(!obj.vars || obj.vars.length!==2){ plotDiv.innerText='La gráfica solo está disponible para 2 variables.'; return; } const vx=obj.vars[0], vy=obj.vars[1]; const xRange=[0, Math.max(10, ...constraints.map(c=>c.rhs))]; const yRange=[0, Math.max(10, ...constraints.map(c=>c.rhs))]; const pts=[]; const step=(Math.max(xRange[1], yRange[1]))/200; for(let xv=0;xv<=xRange[1]; xv+=step){ for(let yv=0; yv<=yRange[1]; yv+=step){ let ok=true; for(const c of constraints){ const val=(c.coeffs[vx]||0)*xv + (c.coeffs[vy]||0)*yv; if(c.op==='<'+'=' && val>c.rhs+1e-6){ ok=false; break; } if(c.op==='>=' && val<c.rhs-1e-6){ ok=false; break; } if(c.op==='=' && Math.abs(val-c.rhs)>1e-6){ ok=false; break; } } if(ok) pts.push([xv,yv]); } }
  if(pts.length===0){ plotDiv.innerText='No hay región factible (según el muestreo).'; return; } const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]); const trace={x:xs,y:ys,mode:'markers',marker:{size:3,color:'rgba(0,100,200,0.6)'}}; Plotly.newPlot(plotDiv,[trace],{xaxis:{title:obj.vars[0]}, yaxis:{title:obj.vars[1]}}); }

// initialize when script loads (after DOMContentLoaded in page sets up math-field)
document.addEventListener('DOMContentLoaded', ()=>{ initPLUI(); });
