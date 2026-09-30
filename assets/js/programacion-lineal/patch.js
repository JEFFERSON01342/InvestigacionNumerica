// Mejoras de la interfaz de programación lineal.
// Se carga después de render.js y reemplaza el renderizado de pasos y la gráfica.

function tableauValue(row, columnIndex){
  return columnIndex < row.coeffs.length ? row.coeffs[columnIndex] : row.slack[columnIndex - row.coeffs.length];
}

function tableauColumnName(state, columnIndex){
  return columnIndex < state.vars.length ? state.vars[columnIndex] : state.slackNames[columnIndex - state.vars.length];
}

function tableauColumnIndex(state, name){
  const variableIndex = state.vars.indexOf(name);
  return variableIndex >= 0 ? variableIndex : state.vars.length + state.slackNames.indexOf(name);
}

// Regla de Bland: elegir la primera columna elegible y desempatar la razón
// mínima por el índice de la variable básica para evitar ciclos.
function findEnteringBland(state, excludeArtificial = false){
  const basicVariables = new Set(state.tableau.map(row => row.basic));
  const values = [...state.objRow.coeffs, ...state.objRow.slack];
  for(let column = 0; column < values.length; column++){
    const name = tableauColumnName(state, column);
    if(basicVariables.has(name) || (excludeArtificial && /^A\d+$/.test(name))) continue;
    if(rationalCompare(values[column], 0) < 0) return column;
  }
  return -1;
}

function findLeaving(tableau, enteringIndex, state){
  let bestRatio = null, rowIndex = -1, bestBasicIndex = Infinity;
  tableau.forEach((row, index) => {
    const coefficient = tableauValue(row, enteringIndex);
    if(rationalCompare(coefficient, 0) <= 0) return;
    const ratio = rationalDivide(row.rhs, coefficient);
    if(rationalCompare(ratio, 0) < 0) return;
    const basicIndex = state ? tableauColumnIndex(state, row.basic) : index;
    const comparison = bestRatio === null ? -1 : rationalCompare(ratio, bestRatio);
    if(bestRatio === null || comparison < 0 || (comparison === 0 && basicIndex < bestBasicIndex)){
      bestRatio = ratio;
      bestBasicIndex = basicIndex;
      rowIndex = index;
    }
  });
  return rowIndex;
}

function pivotOn(state, enteringIndex, leavingRowIdx){
  const pivotRow = state.tableau[leavingRowIdx];
  const pivot = tableauValue(pivotRow, enteringIndex);
  const operation = { enteringIndex, leavingRowIdx, pivot, factors: [] };

  pivotRow.coeffs = pivotRow.coeffs.map(value => rationalDivide(value, pivot));
  pivotRow.slack = pivotRow.slack.map(value => rationalDivide(value, pivot));
  pivotRow.rhs = rationalDivide(pivotRow.rhs, pivot);

  state.tableau.forEach((row, index) => {
    if(index === leavingRowIdx) return;
    const factor = tableauValue(row, enteringIndex);
    operation.factors[index] = factor;
    if(rationalIsZero(factor)) return;
    row.coeffs = row.coeffs.map((value, column) => rationalSubtract(value, rationalMultiply(factor, pivotRow.coeffs[column])));
    row.slack = row.slack.map((value, column) => rationalSubtract(value, rationalMultiply(factor, pivotRow.slack[column])));
    row.rhs = rationalSubtract(row.rhs, rationalMultiply(factor, pivotRow.rhs));
  });

  const objectiveFactor = tableauValue(state.objRow, enteringIndex);
  operation.objectiveFactor = objectiveFactor;
  if(!rationalIsZero(objectiveFactor)){
    state.objRow.coeffs = state.objRow.coeffs.map((value, column) => rationalSubtract(value, rationalMultiply(objectiveFactor, pivotRow.coeffs[column])));
    state.objRow.slack = state.objRow.slack.map((value, column) => rationalSubtract(value, rationalMultiply(objectiveFactor, pivotRow.slack[column])));
    state.objRow.rhs = rationalSubtract(state.objRow.rhs, rationalMultiply(objectiveFactor, pivotRow.rhs));
  }
  pivotRow.basic = tableauColumnName(state, enteringIndex);
  return operation;
}

function simplexSteps(obj, constraints, method = 'big-m'){
  const built = buildTableau(obj, constraints);
  const state = { vars: built.vars, slackNames: built.slackNames, tableau: built.tableau, objRow: built.objRow };
  const metadata = {
    method,
    objectiveDirection: built.objectiveDirection,
    bigM: method === 'big-m' ? built.bigM : null,
    objectiveSense: built.objectiveSense,
    objectiveCoeffs: built.objectiveCoeffs,
    originalVars: built.originalVars,
    variableMap: built.variableMap,
    variableDomains: built.variableDomains,
    freeVariables: built.freeVariables
  };
  const steps = [{ type: 'initial', state: cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, metadata) }];

  for(let iteration = 0; iteration < 200; iteration++){
    const enteringIndex = findEnteringBland(state);
    if(enteringIndex === -1) return steps;
    const leavingRowIdx = findLeaving(state.tableau, enteringIndex, state);
    // No se detiene antes de renderizar: se conserva la tabla que evidencia
    // que la variable entrante no posee una razón positiva para salir.
    if(leavingRowIdx === -1){
      steps.push({ type: 'unbounded', state: cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, metadata), enteringIndex });
      return steps;
    }
    const before = cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, metadata);
    const operation = pivotOn(state, enteringIndex, leavingRowIdx);
    const after = cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, metadata);
    steps.push({ type: 'pivot', before, operation, after });
  }
  throw new Error('Se alcanzó el límite de 200 iteraciones.');
}

function setObjectiveRow(state, variableCoeffs, slackCoeffs, rhs){
  state.objRow = {
    coeffs: state.vars.map(variable => variableCoeffs[variable] || rational(0)),
    slack: state.slackNames.map(name => slackCoeffs[name] || rational(0)),
    rhs: rhs || rational(0),
    basic: 'Z'
  };
  state.tableau.forEach(row => {
    const basicIndex = state.vars.indexOf(row.basic);
    const slackIndex = state.slackNames.indexOf(row.basic);
    const factor = basicIndex >= 0 ? state.objRow.coeffs[basicIndex] : state.objRow.slack[slackIndex];
    if(rationalIsZero(factor || 0)) return;
    state.objRow.coeffs = state.objRow.coeffs.map((value, index) => rationalSubtract(value, rationalMultiply(factor, row.coeffs[index])));
    state.objRow.slack = state.objRow.slack.map((value, index) => rationalSubtract(value, rationalMultiply(factor, row.slack[index])));
    state.objRow.rhs = rationalSubtract(state.objRow.rhs, rationalMultiply(factor, row.rhs));
  });
}

function appendSimplexPhaseSteps(state, metadata, steps, phase){
  for(let iteration = 0; iteration < 200; iteration++){
    const enteringIndex = phase === 2
      ? findEnteringBland(state, true)
      : findEnteringBland(state);
    if(enteringIndex === -1) return;
    const leavingRowIdx = findLeaving(state.tableau, enteringIndex, state);
    if(leavingRowIdx === -1){
      steps.push({ type: 'unbounded', phase, state: cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, {...metadata, phase}) , enteringIndex });
      return;
    }

    const before = cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, {...metadata, phase});
    const operation = pivotOn(state, enteringIndex, leavingRowIdx);
    const after = cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, {...metadata, phase});
    steps.push({ type: 'pivot', phase, before, operation, after });
  }
  throw new Error('Se alcanzó el límite de 200 iteraciones en la Fase ' + phase + '.');
}

function twoPhaseSteps(obj, constraints){
  const built = buildTableau(obj, constraints);
  const state = { vars: built.vars, slackNames: built.slackNames, tableau: built.tableau, objRow: built.objRow };
  const artificialNames = state.slackNames.filter(name => /^A\d+$/.test(name));
  const artificialCoeffs = Object.fromEntries(artificialNames.map(name => [name, rational(1)]));
  const metadata = {
    method: 'two-phase',
    objectiveDirection: built.objectiveDirection,
    objectiveSense: built.objectiveSense,
    objectiveCoeffs: built.objectiveCoeffs,
    originalVars: built.originalVars,
    variableMap: built.variableMap,
    variableDomains: built.variableDomains,
    freeVariables: built.freeVariables
  };
  setObjectiveRow(state, {}, artificialCoeffs, rational(0));
  const steps = [{ type: 'initial', phase: 1, state: cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, {...metadata, phase: 1}) }];
  appendSimplexPhaseSteps(state, metadata, steps, 1);
  const phaseOneState = steps[steps.length - 1];
  const phaseOneTableau = phaseOneState.after || phaseOneState.state;
  if(phaseOneState.type === 'unbounded' || rationalCompare(phaseOneTableau.objRow.rhs, 0) < 0){
    return steps;
  }

  steps.push({
    type: 'phase',
    phase: 2,
    state: cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, {...metadata, phase: 2})
  });
  const objectiveCoeffs = Object.fromEntries(state.vars.map(variable => [
    variable,
    rationalNegate(built.objectiveVector[variable] || rational(0))
  ]));
  setObjectiveRow(state, objectiveCoeffs, {}, rational(0));
  const phaseTwoInitial = cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, {...metadata, phase: 2});
  steps[steps.length - 1].state = phaseTwoInitial;
  appendSimplexPhaseSteps(state, metadata, steps, 2);
  return steps;
}

function validateSimplexModel(obj, constraints, sense, method = 'big-m'){
  const issues = [];
  const notes = [];
  if(!constraints.length) issues.push('Debes añadir al menos una restricción.');
  constraints.forEach((constraint, index) => {
    if(!['<=', '>=', '='].includes(constraint.op)) issues.push(`R${index + 1} usa un operador no válido.`);
    if(!(constraint.rhs instanceof Rational) && !Number.isFinite(constraint.rhs)) issues.push(`R${index + 1} tiene un lado derecho inválido.`);
  });
  const variables = collectVars(obj, constraints);
  if(!variables.length) issues.push('La función objetivo no contiene variables.');
  const direction = sense === 'min' ? -1 : 1;
  variables.forEach(variable => {
    const improves = rationalCompare(rationalMultiply(direction, obj.coeffs[variable] || 0), 0) > 0;
    const limitsVariable = constraints.some(constraint => rationalCompare(constraint.coeffs[variable] || 0, 0) > 0);
    if(improves && !limitsVariable) notes.push(`${variable} puede mejorar Z sin un límite superior aparente; el simplex lo comprobará mostrando sus iteraciones.`);
  });
  if(!issues.length){
    if(method === 'simplex'){
      notes.push('Se aplicará Símplex estándar: las restricciones proporcionan una base inicial de holguras y no se necesitan variables artificiales.');
    } else {
      notes.push(method === 'two-phase'
        ? 'Se aplicará Dos Fases: la Fase I encuentra una solución básica factible y la Fase II optimiza la función original.'
        : 'Se aplicará Gran M: ≤ agrega holgura, ≥ agrega exceso y artificial, e igual agrega artificial.');
    }
  }
  if(!issues.length && !notes.length) notes.push('Cada dirección que mejora Z tiene al menos una restricción que la limita inicialmente.');
  return { ok: !issues.length, issues, notes };
}

function isImplicitNonNegativity(constraint){
  if(constraint.op !== '>=' || !rationalIsZero(constraint.rhs)) return false;
  const terms = Object.entries(constraint.coeffs).filter(([, coefficient]) => !rationalIsZero(coefficient));
  return terms.length === 1 && rationalCompare(terms[0][1], 1) === 0;
}

function renderPreflightReport(report){
  const target = $id('preflight');
  if(!target) return;
  target.className = `verification-box ${report.ok ? 'ok' : 'error'}`;
  const messages = report.ok ? report.notes : report.issues;
  target.innerHTML = `<strong>${report.ok ? 'Modelo listo para iterar.' : 'El modelo necesita corrección.'}</strong><ul>${messages.map(message => `<li>${message}</li>`).join('')}</ul>`;
}

function renderResultVerification(solution, obj, constraints){
  const target = $id('verification');
  if(!target) return;
  const zero = rational(0);
  const values = Object.fromEntries(solution.vars.map(item => [item.var, item.value]));
  const checks = constraints.map((constraint, index) => {
    const lhs = Object.entries(constraint.coeffs).reduce((total, [variable, coefficient]) =>
      rationalAdd(total, rationalMultiply(coefficient, values[variable] || zero)), zero);
    const comparison = rationalCompare(lhs, constraint.rhs);
    const valid = constraint.op === '<=' ? comparison <= 0 : constraint.op === '>=' ? comparison >= 0 : comparison === 0;
    const substitution = Object.entries(constraint.coeffs)
      .filter(([, coefficient]) => !rationalIsZero(coefficient))
      .map(([variable, coefficient]) => `${formatNum(coefficient)}(${formatNum(values[variable] || 0)})`)
      .join(' + ')
      .replace(/\+\s-(?=\\frac|\d|\()/g, '- ');
    return { index, lhs, valid, substitution };
  });
  const z = Object.entries(obj.coeffs).reduce((total, [variable, coefficient]) =>
    rationalAdd(total, rationalMultiply(coefficient, values[variable] || zero)), zero);
  const domainChecks = solution.vars.map(item => {
    const domain = obj.variableDomains?.[item.var] || 'nonnegative';
    if(domain === 'nonpositive') return rationalCompare(item.value, 0) <= 0;
    if(domain === 'zero') return rationalIsZero(item.value);
    if(domain === 'free') return true;
    return rationalCompare(item.value, 0) >= 0;
  });
  const valid = domainChecks.every(Boolean) && checks.every(check => check.valid);
  target.className = `verification-box ${valid ? 'ok' : 'error'}`;
  const domainText = solution.vars.map(item => {
    const domain = obj.variableDomains?.[item.var] || 'nonnegative';
    const symbol = { nonnegative: '\\ge 0', nonpositive: '\\le 0', zero: '= 0', free: '\\in\\mathbb{R}' }[domain];
    return `\\(${item.var} ${symbol}\\)`;
  }).join(', ');
  const variableChecks = solution.vars.map((item, index) => {
    const domain = obj.variableDomains?.[item.var] || 'nonnegative';
    const symbol = { nonnegative: '\\ge 0', nonpositive: '\\le 0', zero: '= 0', free: '\\in\\mathbb{R}' }[domain];
    const signCheck = domainChecks[index];
    return `<li>\\(${item.var} = ${formatNum(item.value)}\\), ${symbol} \\;\\Rightarrow\\; ${signCheck ? '\\text{cumple}' : '\\text{no cumple}'}</li>`;
  }).join('');
  const objectiveSubstitution = Object.entries(obj.coeffs)
    .filter(([, coefficient]) => !rationalIsZero(coefficient))
    .map(([variable, coefficient]) => `${formatNum(coefficient)}(${formatNum(values[variable] || 0)})`)
    .join(' + ')
    .replace(/\+\s-(?=\\frac|\d|\()/g, '- ');
  target.innerHTML = `<strong>${valid ? 'Solución verificada.' : 'La solución no pasó la verificación.'}</strong>
    <p><strong>Dominio:</strong> ${domainText || 'sin variables'}.</p>
    <ul>${variableChecks}</ul>
    <p><strong>Sustitución en restricciones:</strong></p>
    <ul>${checks.map(check => `<li>R${check.index + 1}: \\(${check.substitution || '0'} ${constraintOperatorLatex(constraints[check.index].op)} ${formatNum(constraints[check.index].rhs)} \\;\\Rightarrow\\; ${formatNum(check.lhs)} ${constraintOperatorLatex(constraints[check.index].op)} ${formatNum(constraints[check.index].rhs)}\\) — ${check.valid ? 'cumple' : 'no cumple'}.</li>`).join('')}</ul>
    <p><strong>Objetivo:</strong> \\(Z = ${objectiveSubstitution || '0'} = ${formatNum(z)}\\).</p>`;
  typesetMath([target]);
}

function constraintOperatorLatex(operator){
  return operator === '<=' ? '\\le' : operator === '>=' ? '\\ge' : '=';
}

function renderUnboundedVerification(){
  const target = $id('verification');
  if(!target) return;
  target.className = 'verification-box warning';
  target.innerHTML = '<strong>No existe una solución óptima finita.</strong><br>La última variable entrante no tiene una fila saliente con coeficiente positivo; por ello Z puede crecer indefinidamente.';
}

function renderInfeasibleVerification(){
  const target = $id('verification');
  if(!target) return;
  target.className = 'verification-box error';
  target.innerHTML = '<strong>El modelo no tiene solución factible.</strong><br>Al finalizar Gran M, una variable artificial conserva un valor positivo; por tanto, las restricciones no pueden cumplirse simultáneamente.';
}

function formatBigM(value, state){
  const bigM = state.bigM;
  if(!bigM) return formatNum(value);
  const ratio = rationalDivide(value, bigM);
  let mCoefficient = ratio.numerator / ratio.denominator;
  const remainder = ratio.numerator % ratio.denominator;
  if((remainder < 0n ? -remainder : remainder) * 2n >= ratio.denominator){
    mCoefficient += ratio.numerator < 0n ? -1n : 1n;
  }
  const constant = rationalSubtract(value, rationalMultiply(mCoefficient, bigM));
  if(mCoefficient === 0n) return formatNum(constant);
  const parts = [];
  if(mCoefficient === 1n) parts.push('M');
  else if(mCoefficient === -1n) parts.push('-M');
  else parts.push(`${formatNum(mCoefficient)}M`);
  if(!rationalIsZero(constant)) parts.push(rationalCompare(constant, 0) > 0 ? `+${formatNum(constant)}` : formatNum(constant));
  return parts.join('');
}

function bigMObjectiveFormula(state){
  const terms = Object.entries(state.objectiveCoeffs || {}).map(([variable, coefficient]) => {
    const negative = rationalCompare(coefficient, 0) < 0;
    const magnitude = negative ? rationalNegate(coefficient) : coefficient;
    const signed = negative ? `- ${formatNum(magnitude)}${variable}` : `+ ${formatNum(coefficient)}${variable}`;
    return signed;
  });
  const artificialNames = state.slackNames.filter(name => /^A\d+$/.test(name));
  if(artificialNames.length){
    const penalty = state.objectiveSense === 'min' ? '+ ' : '- ';
    terms.push(`${penalty}M(${artificialNames.join(' + ')})`);
  }
  return terms.join(' ').replace(/^\+ /, '').replace(/  +/g, ' ');
}

function simplexNameToLatex(name){
  const match = name.match(/^([A-Za-z]+)(\d+)([+-])?$/);
  if(!match) return name;
  return `${match[1]}_{${match[2]}}${match[3] ? `^{${match[3]}}` : ''}`;
}

function linearCombinationToLatex(terms){
  const nonzeroTerms = terms.filter(term => !rationalIsZero(term.coefficient));
  if(!nonzeroTerms.length) return '0';
  return nonzeroTerms.map((term, index) => {
    const negative = rationalCompare(term.coefficient, 0) < 0;
    const magnitude = negative ? rationalNegate(term.coefficient) : term.coefficient;
    const coefficient = rationalCompare(magnitude, 1) === 0 ? '' : formatNum(magnitude);
    const value = `${coefficient}${simplexNameToLatex(term.variable)}`;
    if(index === 0) return negative ? `-${value}` : value;
    return negative ? ` - ${value}` : ` + ${value}`;
  }).join('');
}

function transformedExpressionToLatex(coefficients, state){
  const terms = [];
  (state.originalVars || Object.keys(coefficients)).forEach(variable => {
    const coefficient = coefficients[variable] || 0;
    const mapping = state.variableMap && state.variableMap[variable];
    if(!mapping){
      terms.push({coefficient, variable});
      return;
    }
    if(mapping.positive !== null) terms.push({coefficient, variable: state.vars[mapping.positive]});
    if(mapping.negative !== null) terms.push({coefficient: rationalNegate(coefficient), variable: state.vars[mapping.negative]});
  });
  return linearCombinationToLatex(terms);
}

function renderFreeVariableTransformation(container, state, obj, constraints){
  if(!state.freeVariables) return;
  const substitutions = state.originalVars
    .filter(variable => state.variableDomains[variable] !== 'nonnegative')
    .map(variable => {
      const mapping = state.variableMap[variable];
      const positive = mapping.positive === null ? null : simplexNameToLatex(state.vars[mapping.positive]);
      const negative = mapping.negative === null ? null : simplexNameToLatex(state.vars[mapping.negative]);
      if(state.variableDomains[variable] === 'free'){
        return `\\(${simplexNameToLatex(variable)} = ${positive} - ${negative}\\)<br>\\(${positive}, ${negative} \\ge 0\\)`;
      }
      if(state.variableDomains[variable] === 'nonpositive'){
        return `\\(${simplexNameToLatex(variable)} = -${negative},\\quad ${negative} \\ge 0\\)`;
      }
      return `\\(${simplexNameToLatex(variable)} = 0\\)`;
    });
  const objective = transformedExpressionToLatex(obj.coeffs, state);
  const objectiveSense = obj.sense === 'min' ? 'Minimizar' : 'Maximizar';
  const transformedConstraints = constraints.map(constraint =>
    `<li>\\(${transformedExpressionToLatex(constraint.coeffs, state)} ${constraintOperatorLatex(constraint.op)} ${formatNum(constraint.rhs)}\\)</li>`
  ).join('');
  const card = document.createElement('article');
  card.className = 'step-card free-variable-step';
  card.innerHTML = `<h3>Cambio de variables libres</h3>
    <p>Para aplicar el método símplex, cada variable libre se expresa como la diferencia de dos variables no negativas:</p>
    <div class="free-variable-equations">${substitutions.join('<br>')}</div>
    <h4>Modelo después de sustituir</h4>
    <div class="free-variable-model">
      <p><strong>${objectiveSense}:</strong> \\(Z = ${objective}\\)</p>
      <ul>${transformedConstraints}</ul>
    </div>
    <p>Las variables \\(x_i^+\\) y \\(x_i^-\\) quedan como columnas independientes; las columnas de holgura, exceso y artificial se agregan según cada restricción antes de iniciar las iteraciones.</p>`;
  container.appendChild(card);
}

function orderedSlackIndexes(state){
  const order = { S: 0, E: 1, A: 2 };
  return state.slackNames
    .map((name, index) => ({ name, index }))
    .filter(item => !(state.method === 'two-phase' && state.phase === 2 && /^A\d+$/.test(item.name)))
    .sort((left, right) => {
      const leftPrefix = (left.name.match(/^[EAS]/i) || [''])[0].toUpperCase();
      const rightPrefix = (right.name.match(/^[EAS]/i) || [''])[0].toUpperCase();
      return (order[leftPrefix] - order[rightPrefix]) || left.name.localeCompare(right.name, undefined, { numeric: true });
    })
    .map(item => item.index);
}

function orderedSlackValues(values, indexes){
  return indexes.map(index => values[index]);
}

function formatTableauNumber(value, state){
  return state.bigM ? formatBigM(value, state) : formatNum(value);
}

function displayTableauColumnIndex(state, columnIndex, slackIndexes){
  if(columnIndex < state.vars.length) return columnIndex + 2;
  const slackIndex = columnIndex - state.vars.length;
  const displayedSlackIndex = slackIndexes.indexOf(slackIndex);
  return displayedSlackIndex < 0 ? -1 : state.vars.length + displayedSlackIndex + 2;
}

function tableToLatexWithHighlight(state, highlight){
  const slackIndexes = orderedSlackIndexes(state);
  const phaseOne = state.method === 'two-phase' && state.phase === 1;
  const objectiveScale = phaseOne || state.objectiveSense === 'min' ? -1 : 1;
  const objectiveName = phaseOne ? '\\rho' : 'Z';
  const columns = 'c' + 'r'.repeat(state.vars.length + slackIndexes.length + 2);
  const headers = ['\\text{Variables básicas}', objectiveName, ...state.vars.map(simplexNameToLatex), ...slackIndexes.map(index => simplexNameToLatex(state.slackNames[index])), '\\text{Solución}'];
  let latex = `\\[\\begin{array}{${columns}} ${headers.join(' & ')} \\\\ \\hline `;

  state.tableau.forEach((row, rowIndex) => {
    const values = [simplexNameToLatex(row.basic), 0, ...row.coeffs, ...orderedSlackValues(row.slack, slackIndexes), row.rhs].map((value, columnIndex) => {
      const formatted = typeof value === 'number' || value instanceof Rational ? formatTableauNumber(value, state) : value;
      const pivotColumn = highlight
        ? displayTableauColumnIndex(state, highlight.enteringIndex, slackIndexes)
        : -1;
      return highlight && rowIndex === highlight.leavingRowIdx && columnIndex === pivotColumn
        ? `\\class{pivot-cell}{${formatted}}` : formatted;
    });
    latex += `${values.join(' & ')} \\\\ `;
  });
  const objectiveValues = [
    objectiveName,
    1,
    ...state.objRow.coeffs.map(value => rationalMultiply(value, objectiveScale)),
    ...orderedSlackValues(state.objRow.slack, slackIndexes).map(value => rationalMultiply(value, objectiveScale)),
    rationalMultiply(state.objRow.rhs, objectiveScale)
  ];
  latex += `\\hline ${objectiveValues.map(value => typeof value === 'number' || value instanceof Rational ? formatTableauNumber(value, state) : value).join(' & ')} \\\\ \\end{array}\\]`;
  return latex;
}

function renderStepsLatex(steps, obj, constraints){
  const container = $id('steps');
  container.innerHTML = '';
  if(!steps.length) return;

  const initial = steps[0].state;
  renderFreeVariableTransformation(container, initial, obj, constraints);
  container.insertAdjacentHTML('beforeend', '<h3>Tabla inicial</h3>');
  if(initial.method !== 'two-phase' && initial.slackNames.some(name => /^A\d+$/.test(name))){
    container.insertAdjacentHTML('beforeend', `<p class="big-m-objective"><strong>Función penalizada:</strong> \\(Z = ${bigMObjectiveFormula(initial)}\\)</p>`);
  }
  if(initial.method === 'two-phase'){
    container.insertAdjacentHTML('beforeend', '<p class="phase-heading"><strong>Fase I:</strong> minimizar la suma de las variables artificiales.</p>');
  }
  const initialTable = document.createElement('div');
  initialTable.className = 'simplex-table';
  initialTable.innerHTML = tableToLatexWithHighlight(initial);
  container.appendChild(initialTable);

  steps.slice(1).forEach((step, index) => {
    if(step.type === 'phase'){
      const phaseCard = document.createElement('article');
      phaseCard.className = 'step-card phase-card';
      phaseCard.innerHTML = '<h3>Fase II</h3><p>Se eliminaron las variables artificiales de la función objetivo y se restaura la función objetivo original.</p>';
      const phaseTable = document.createElement('div');
      phaseTable.className = 'simplex-table';
      phaseTable.innerHTML = tableToLatexWithHighlight(step.state);
      phaseCard.appendChild(phaseTable);
      container.appendChild(phaseCard);
      return;
    }
    if(step.type === 'unbounded'){
      const entering = tableauColumnName(step.state, step.enteringIndex);
      const enteringLatex = `\\(${simplexNameToLatex(entering)}\\)`;
      const warning = document.createElement('article');
      warning.className = 'step-card simplex-unbounded';
      warning.innerHTML = `<h3>Comprobación de no acotación</h3><p>La columna de <strong>${enteringLatex}</strong> sigue mejorando Z, pero no contiene coeficientes positivos en las restricciones. No hay razón mínima ni fila saliente.</p><p>Por tanto, ${enteringLatex} puede aumentar y Z crece indefinidamente.</p>`;
      const table = document.createElement('div');
      table.className = 'simplex-table';
      table.innerHTML = tableToLatexWithHighlight(step.state);
      warning.appendChild(table);
      container.appendChild(warning);
      return;
    }
    const { before, operation, after } = step;
    const entering = tableauColumnName(before, operation.enteringIndex);
    const leaving = before.tableau[operation.leavingRowIdx].basic;
    const enteringLatex = `\\(${simplexNameToLatex(entering)}\\)`;
    const leavingLatex = `\\(${simplexNameToLatex(leaving)}\\)`;
    const card = document.createElement('article');
    card.className = 'step-card';
    const phaseLabel = step.phase
      ? `Fase ${step.phase}`
      : before.method === 'simplex' ? 'Símplex' : 'Gran M';
    card.innerHTML = `<h3>${phaseLabel}: Iteración ${index + 1}</h3>
      <p>Entra <strong>${enteringLatex}</strong> (coeficiente negativo en Z) y sale <strong>${leavingLatex}</strong> (menor razón positiva).</p>
      <p><strong>Pivote:</strong> fila ${operation.leavingRowIdx + 1}, columna ${entering}, valor ${formatNum(operation.pivot)}.</p>`;
    const highlighted = document.createElement('div');
    highlighted.className = 'simplex-table';
    highlighted.innerHTML = tableToLatexWithHighlight(before, operation);
    card.appendChild(highlighted);

    let operations = `\\(R_{${operation.leavingRowIdx + 1}} \\leftarrow \\frac{R_{${operation.leavingRowIdx + 1}}}{${formatNum(operation.pivot)}}\\)`;
    operation.factors.forEach((factor, rowIndex) => {
      if(!rationalIsZero(factor || 0)) operations += `<br>\\(R_{${rowIndex + 1}} \\leftarrow R_{${rowIndex + 1}} - (${formatNum(factor)})R_{${operation.leavingRowIdx + 1}}\\)`;
    });
    if(!rationalIsZero(operation.objectiveFactor || 0)) operations += `<br>\\(Z \\leftarrow Z - (${formatNum(operation.objectiveFactor)})R_{${operation.leavingRowIdx + 1}}\\)`;
    const operationsEl = document.createElement('p');
    operationsEl.className = 'row-operations';
    operationsEl.innerHTML = `<strong>Operaciones para hacer cero la columna ${enteringLatex}:</strong><br>${operations}`;
    card.appendChild(operationsEl);
    const result = document.createElement('div');
    result.className = 'simplex-table';
    result.innerHTML = tableToLatexWithHighlight(after);
    card.appendChild(result);
    container.appendChild(card);
  });

  const finalStep = steps[steps.length - 1];
  if(finalStep.type === 'unbounded'){
    typesetMath([container]);
    return;
  }
  const solution = computeSolutionFromTable(finalStep.after || finalStep.state);
  const solutionEl = document.createElement('div');
  solutionEl.className = solution.infeasible ? 'simplex-solution simplex-unbounded' : 'simplex-solution';
  solutionEl.innerHTML = solution.infeasible
    ? '<h3>Modelo infactible</h3><p>La Fase I/penalización conserva una variable artificial positiva. No se puede aceptar esta tabla como solución del problema original.</p>'
    : `<h3>Solución óptima</h3><p><strong>Fracción (decimal):</strong> ${solution.vars.map(item => `\\(${item.var} = ${formatNum(item.value)}\\;(${formatDecimal(item.value)})\\)`).join(', ')}<br>\\(Z = ${formatNum(solution.Z)}\\;(${formatDecimal(solution.Z)})\\)</p>`;
  container.appendChild(solutionEl);
  typesetMath([container]);
}

let simplexDesmos = null;

function initSimplexDesmos(){
  const plot = $id('plot');
  if(!plot || !window.Desmos) return null;
  if(!simplexDesmos){
    simplexDesmos = Desmos.GraphingCalculator(plot, { keypad: false, expressions: false, settingsMenu: false, zoomButtons: true, language: 'es' });
  }
  return simplexDesmos;
}

function desmosTerm(coefficient, variable){
  if(coefficient === 1) return variable;
  if(coefficient === -1) return `-${variable}`;
  return `${formatNum(coefficient)}${variable}`;
}

function plot2vars(obj, constraints){
  const plot = $id('plot');
  const graph = initSimplexDesmos();
  if(!graph){ if(plot) plot.textContent = 'No se pudo cargar Desmos.'; return; }
  if(!obj.vars || obj.vars.length !== 2){ graph.setBlank(); return; }

  const [x, y] = obj.vars;
  const variableDomains = obj.variableDomains || {};
  const magnitude = Math.max(10, ...constraints.map(c => Math.abs(c.rhs || 0)));
  const bound = Math.ceil(magnitude * 1.35);
  graph.setBlank();
  const xHasNegativeValues = ['nonpositive', 'free'].includes(variableDomains[x]);
  const yHasNegativeValues = ['nonpositive', 'free'].includes(variableDomains[y]);
  graph.setMathBounds({
    left: xHasNegativeValues ? -bound : -1,
    right: bound,
    bottom: yHasNegativeValues ? -bound : -1,
    top: bound
  });
  [x, y].forEach(variable => {
    const domain = variableDomains[variable] || 'nonnegative';
    const restriction = {
      nonnegative: `${variable}\\ge0`,
      nonpositive: `${variable}\\le0`,
      zero: `${variable}=0`
    }[domain];
    if(restriction) graph.setExpression({
      id: `domain-${variable}`,
      latex: restriction,
      color: '#6b7280',
      fillOpacity: 0.03
    });
  });

  constraints.forEach((constraint, index) => {
    const a = constraint.coeffs[x] || 0;
    const b = constraint.coeffs[y] || 0;
    if(Math.abs(a) < 1e-12 && Math.abs(b) < 1e-12) return;
    const lhs = [desmosTerm(a, x), desmosTerm(b, y)].filter(Boolean).join('+').replace(/\+\-/g, '-');
    const operator = constraint.op === '<=' ? '\\le' : constraint.op === '>=' ? '\\ge' : '=';
    graph.setExpression({ id: `restriction-${index}`, latex: `${lhs}${operator}${formatNum(constraint.rhs)}`, color: '#2563eb', fillOpacity: 0.10, lineOpacity: 0.9 });
  });

  const a = obj.coeffs[x] || 0;
  const b = obj.coeffs[y] || 0;
  if(Math.abs(a) > 1e-12 || Math.abs(b) > 1e-12){
    const lhs = [desmosTerm(a, x), desmosTerm(b, y)].filter(Boolean).join('+').replace(/\+\-/g, '-');
    graph.setExpression({ id: 'objective', latex: `${lhs}=0`, color: '#dc2626', lineWidth: 3, showLabel: true, label: 'Z = 0' });
  }
}

function updatePlotFromInputs(){
  const objectiveField = $id('objective-field');
  if(!objectiveField || !objectiveField.value.trim() || !constraintsLatex.length) return;
  try {
    const sense = document.querySelector('input[name="sense-pl"]:checked').value;
    const objective = parseObjective(`${sense}: ${latexToAscii(objectiveField.value)}`);
    const constraints = parseConstraints(constraintsLatex.map(latexToAscii).join('\n'));
    objective.vars = collectVars(objective, constraints);
    objective.variableDomains = {...variableDomainsPL};
    plot2vars(objective, constraints);
  } catch (_) { /* La entrada aún se está escribiendo; se actualizará al completarla. */ }
}
