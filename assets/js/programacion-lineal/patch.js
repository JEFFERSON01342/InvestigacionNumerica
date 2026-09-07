// Mejoras de la interfaz de programación lineal.
// Se carga después de render.js y reemplaza el renderizado de pasos y la gráfica.

function tableauValue(row, columnIndex){
  return columnIndex < row.coeffs.length ? row.coeffs[columnIndex] : row.slack[columnIndex - row.coeffs.length];
}

function tableauColumnName(state, columnIndex){
  return columnIndex < state.vars.length ? state.vars[columnIndex] : state.slackNames[columnIndex - state.vars.length];
}

// También se revisan las holguras: después de un pivote pueden tener costo
// reducido negativo y revelar que el problema no está acotado.
function findEntering(objRow){
  const values = [...objRow.coeffs, ...objRow.slack];
  let minimum = 0, index = -1;
  values.forEach((value, column) => { if(value < minimum){ minimum = value; index = column; } });
  return index;
}

function findLeaving(tableau, enteringIndex){
  let bestRatio = Infinity, rowIndex = -1;
  tableau.forEach((row, index) => {
    const coefficient = tableauValue(row, enteringIndex);
    const ratio = row.rhs / coefficient;
    if(coefficient > 1e-12 && ratio >= -1e-12 && ratio < bestRatio){ bestRatio = ratio; rowIndex = index; }
  });
  return rowIndex;
}

function pivotOn(state, enteringIndex, leavingRowIdx){
  const pivotRow = state.tableau[leavingRowIdx];
  const pivot = tableauValue(pivotRow, enteringIndex);
  const operation = { enteringIndex, leavingRowIdx, pivot, factors: [] };

  pivotRow.coeffs = pivotRow.coeffs.map(value => value / pivot);
  pivotRow.slack = pivotRow.slack.map(value => value / pivot);
  pivotRow.rhs /= pivot;

  state.tableau.forEach((row, index) => {
    if(index === leavingRowIdx) return;
    const factor = tableauValue(row, enteringIndex);
    operation.factors[index] = factor;
    if(Math.abs(factor) < 1e-12) return;
    row.coeffs = row.coeffs.map((value, column) => value - factor * pivotRow.coeffs[column]);
    row.slack = row.slack.map((value, column) => value - factor * pivotRow.slack[column]);
    row.rhs -= factor * pivotRow.rhs;
  });

  const objectiveFactor = tableauValue(state.objRow, enteringIndex);
  operation.objectiveFactor = objectiveFactor;
  if(Math.abs(objectiveFactor) >= 1e-12){
    state.objRow.coeffs = state.objRow.coeffs.map((value, column) => value - objectiveFactor * pivotRow.coeffs[column]);
    state.objRow.slack = state.objRow.slack.map((value, column) => value - objectiveFactor * pivotRow.slack[column]);
    state.objRow.rhs -= objectiveFactor * pivotRow.rhs;
  }
  pivotRow.basic = tableauColumnName(state, enteringIndex);
  return operation;
}

function simplexSteps(obj, constraints){
  const built = buildTableau(obj, constraints);
  const state = { vars: built.vars, slackNames: built.slackNames, tableau: built.tableau, objRow: built.objRow };
  const metadata = {
    objectiveDirection: built.objectiveDirection,
    bigM: built.bigM,
    objectiveSense: built.objectiveSense,
    objectiveCoeffs: built.objectiveCoeffs,
    originalVars: built.originalVars,
    variableMap: built.variableMap,
    freeVariables: built.freeVariables
  };
  const steps = [{ type: 'initial', state: cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, metadata) }];

  for(let iteration = 0; iteration < 200; iteration++){
    const enteringIndex = findEntering(state.objRow);
    if(enteringIndex === -1) return steps;
    const leavingRowIdx = findLeaving(state.tableau, enteringIndex);
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
    coeffs: state.vars.map(variable => variableCoeffs[variable] || 0),
    slack: state.slackNames.map(name => slackCoeffs[name] || 0),
    rhs: rhs || 0,
    basic: 'Z'
  };
  state.tableau.forEach(row => {
    const basicIndex = state.vars.indexOf(row.basic);
    const slackIndex = state.slackNames.indexOf(row.basic);
    const factor = basicIndex >= 0 ? state.objRow.coeffs[basicIndex] : state.objRow.slack[slackIndex];
    if(Math.abs(factor || 0) < 1e-12) return;
    state.objRow.coeffs = state.objRow.coeffs.map((value, index) => value - factor * row.coeffs[index]);
    state.objRow.slack = state.objRow.slack.map((value, index) => value - factor * row.slack[index]);
    state.objRow.rhs -= factor * row.rhs;
  });
}

function appendSimplexPhaseSteps(state, metadata, steps, phase){
  for(let iteration = 0; iteration < 200; iteration++){
    const enteringIndex = phase === 2
      ? findEnteringWithoutArtificial(state)
      : findEntering(state.objRow);
    if(enteringIndex === -1) return;
    const leavingRowIdx = findLeaving(state.tableau, enteringIndex);
    if(leavingRowIdx === -1){
      steps.push({ type: 'unbounded', phase, state: cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, {...metadata, phase}) , enteringIndex });
      return;
    }

    function findEnteringWithoutArtificial(state){
      const values = [...state.objRow.coeffs, ...state.objRow.slack];
      let minimum = 0;
      let index = -1;
      values.forEach((value, column) => {
        const name = tableauColumnName(state, column);
        if(/^A\d+$/.test(name)) return;
        if(value < minimum){ minimum = value; index = column; }
      });
      return index;
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
  const artificialCoeffs = Object.fromEntries(artificialNames.map(name => [name, 1]));
  const metadata = {
    method: 'two-phase',
    objectiveDirection: built.objectiveDirection,
    objectiveSense: built.objectiveSense,
    objectiveCoeffs: built.objectiveCoeffs,
    originalVars: built.originalVars,
    variableMap: built.variableMap,
    freeVariables: built.freeVariables
  };
  setObjectiveRow(state, {}, artificialCoeffs, 0);
  const steps = [{ type: 'initial', phase: 1, state: cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, {...metadata, phase: 1}) }];
  appendSimplexPhaseSteps(state, metadata, steps, 1);
  const phaseOneState = steps[steps.length - 1];
  const phaseOneTableau = phaseOneState.after || phaseOneState.state;
  if(phaseOneState.type === 'unbounded' || phaseOneTableau.objRow.rhs < -1e-7){
    return steps;
  }

  steps.push({
    type: 'phase',
    phase: 2,
    state: cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, {...metadata, phase: 2})
  });
  const objectiveCoeffs = Object.fromEntries(state.vars.map(variable => [
    variable,
    -(built.objectiveVector[variable] || 0)
  ]));
  setObjectiveRow(state, objectiveCoeffs, {}, 0);
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
    if(!Number.isFinite(constraint.rhs)) issues.push(`R${index + 1} tiene un lado derecho inválido.`);
  });
  const variables = collectVars(obj, constraints);
  if(!variables.length) issues.push('La función objetivo no contiene variables.');
  const direction = sense === 'min' ? -1 : 1;
  variables.forEach(variable => {
    const improves = direction * (obj.coeffs[variable] || 0) > 1e-12;
    const limitsVariable = constraints.some(constraint => (constraint.coeffs[variable] || 0) > 1e-12);
    if(improves && !limitsVariable) notes.push(`${variable} puede mejorar Z sin un límite superior aparente; el simplex lo comprobará mostrando sus iteraciones.`);
  });
  if(!issues.length){
    notes.push(method === 'two-phase'
      ? 'Se aplicará Dos Fases: la Fase I encuentra una solución básica factible y la Fase II optimiza la función original.'
      : 'Se aplicará Gran M: ≤ agrega holgura, ≥ agrega exceso y artificial, e igual agrega artificial.');
  }
  if(!issues.length && !notes.length) notes.push('Cada dirección que mejora Z tiene al menos una restricción que la limita inicialmente.');
  return { ok: !issues.length, issues, notes };
}

function isImplicitNonNegativity(constraint){
  if(constraint.op !== '>=' || Math.abs(constraint.rhs) > 1e-12) return false;
  const terms = Object.entries(constraint.coeffs).filter(([, coefficient]) => Math.abs(coefficient) > 1e-12);
  return terms.length === 1 && Math.abs(terms[0][1] - 1) < 1e-12;
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
  const values = Object.fromEntries(solution.vars.map(item => [item.var, item.value]));
  const checks = constraints.map((constraint, index) => {
    const lhs = Object.entries(constraint.coeffs).reduce((total, [variable, coefficient]) => total + coefficient * (values[variable] || 0), 0);
    const valid = constraint.op === '<=' ? lhs <= constraint.rhs + 1e-7 : constraint.op === '>=' ? lhs >= constraint.rhs - 1e-7 : Math.abs(lhs - constraint.rhs) <= 1e-7;
    const substitution = Object.entries(constraint.coeffs)
      .filter(([, coefficient]) => Math.abs(coefficient) > 1e-12)
      .map(([variable, coefficient]) => `${formatNum(coefficient)}(${formatNum(values[variable] || 0)})`)
      .join(' + ')
      .replace(/\+\s-\(/g, '- (');
    return { index, lhs, valid, substitution };
  });
  const nonNegative = obj.variableDomain !== 'free' && solution.vars.every(item => item.value >= -1e-7);
  const z = Object.entries(obj.coeffs).reduce((total, [variable, coefficient]) => total + coefficient * (values[variable] || 0), 0);
  const valid = (obj.variableDomain === 'free' || nonNegative) && checks.every(check => check.valid);
  target.className = `verification-box ${valid ? 'ok' : 'error'}`;
  const domainText = obj.variableDomain === 'free' ? 'variables libres' : `variables no negativas: ${nonNegative ? 'sí' : 'no'}`;
  const variableChecks = solution.vars.map(item => {
    const signCheck = obj.variableDomain === 'free' || item.value >= -1e-7;
    return obj.variableDomain === 'free'
      ? `<li>\\(${item.var} = ${formatNum(item.value)}\\) — puede ser positivo o negativo.</li>`
      : `<li>\\(${item.var} = ${formatNum(item.value)} \\ge 0 \\;\\Rightarrow\\; ${signCheck ? '\\text{cumple}' : '\\text{no cumple}'}\\)</li>`;
  }).join('');
  const objectiveSubstitution = Object.entries(obj.coeffs)
    .filter(([, coefficient]) => Math.abs(coefficient) > 1e-12)
    .map(([variable, coefficient]) => `${formatNum(coefficient)}(${formatNum(values[variable] || 0)})`)
    .join(' + ')
    .replace(/\+\s-\(/g, '- (');
  target.innerHTML = `<strong>${valid ? 'Solución verificada.' : 'La solución no pasó la verificación.'}</strong>
    <p><strong>Dominio:</strong> ${domainText}.</p>
    <ul>${variableChecks}</ul>
    <p><strong>Sustitución en restricciones:</strong></p>
    <ul>${checks.map(check => `<li>R${check.index + 1}: \\(${check.substitution || '0'} ${constraintOperatorLatex(constraints[check.index].op)} ${formatNum(constraints[check.index].rhs)} \\;\\Rightarrow\\; ${formatNum(check.lhs)} ${constraintOperatorLatex(constraints[check.index].op)} ${formatNum(constraints[check.index].rhs)}\\) — ${check.valid ? 'cumple' : 'no cumple'}.</li>`).join('')}</ul>
    <p><strong>Objetivo:</strong> \\(Z = ${objectiveSubstitution || '0'} = ${formatNum(z)}\\).</p>`;
  if(window.MathJax) window.MathJax.typesetPromise([target]);
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
  if(!bigM || !Number.isFinite(value)) return formatNum(value);
  const mCoefficient = Math.round(value / bigM);
  const constant = value - mCoefficient * bigM;
  if(Math.abs(mCoefficient) < 1e-9) return formatNum(constant);
  const parts = [];
  if(mCoefficient === 1) parts.push('M');
  else if(mCoefficient === -1) parts.push('-M');
  else parts.push(`${formatNum(mCoefficient)}M`);
  if(Math.abs(constant) >= 1e-7) parts.push(constant > 0 ? `+${formatNum(constant)}` : formatNum(constant));
  return parts.join('');
}

function bigMObjectiveFormula(state){
  const terms = Object.entries(state.objectiveCoeffs || {}).map(([variable, coefficient]) => {
    const signed = coefficient < 0 ? `- ${formatNum(Math.abs(coefficient))}${variable}` : `+ ${formatNum(coefficient)}${variable}`;
    return signed;
  });
  const artificialNames = state.slackNames.filter(name => /^A\d+$/.test(name));
  if(artificialNames.length){
    const penalty = state.objectiveSense === 'min' ? '+ ' : '- ';
    terms.push(`${penalty}M(${artificialNames.join(' + ')})`);
  }
  return terms.join(' ').replace(/^\+ /, '').replace(/  +/g, ' ');
}

function orderedSlackIndexes(state){
  const order = { E: 0, A: 1, S: 2 };
  return state.slackNames
    .map((name, index) => ({ name, index }))
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

function tableToLatexWithHighlight(state, highlight){
  const columns = 'c' + 'r'.repeat(state.vars.length + state.slackNames.length + 2);
  const slackIndexes = orderedSlackIndexes(state);
  const headers = ['\\mathrm{Basicas}', 'Z', ...state.vars, ...slackIndexes.map(index => state.slackNames[index]), '\\mathrm{Solucion}'];
  let latex = `\\[\\begin{array}{${columns}} ${headers.join(' & ')} \\\\ \\hline `;

  state.tableau.forEach((row, rowIndex) => {
    const values = [row.basic, 0, ...row.coeffs, ...orderedSlackValues(row.slack, slackIndexes), row.rhs].map((value, columnIndex) => {
      const formatted = typeof value === 'number' ? formatBigM(value, state) : value;
      return highlight && rowIndex === highlight.leavingRowIdx && columnIndex === highlight.enteringIndex + 2
        ? `\\class{pivot-cell}{${formatted}}` : formatted;
    });
    latex += `${values.join(' & ')} \\\\ `;
  });
  latex += `\\hline ${[state.objRow.basic, 1, ...state.objRow.coeffs, ...orderedSlackValues(state.objRow.slack, slackIndexes), state.objRow.rhs].map(value => typeof value === 'number' ? formatBigM(value, state) : value).join(' & ')} \\\\ \\end{array}\\]`;
  return latex;
}

function renderStepsLatex(steps){
  const container = $id('steps');
  container.innerHTML = '';
  if(!steps.length) return;

  const initial = steps[0].state;
  container.insertAdjacentHTML('beforeend', '<h3>Tabla inicial</h3>');
  if(initial.objectiveCoeffs && initial.method !== 'two-phase'){
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
      const warning = document.createElement('article');
      warning.className = 'step-card simplex-unbounded';
      warning.innerHTML = `<h3>Comprobación de no acotación</h3><p>La columna de <strong>${entering}</strong> sigue mejorando Z, pero no contiene coeficientes positivos en las restricciones. No hay razón mínima ni fila saliente.</p><p>Por tanto, ${entering} puede aumentar y Z crece indefinidamente.</p>`;
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
    const card = document.createElement('article');
    card.className = 'step-card';
    const phaseLabel = step.phase ? `Fase ${step.phase}` : 'Gran M';
    card.innerHTML = `<h3>${phaseLabel}: Iteración ${index + 1}</h3>
      <p>Entra <strong>${entering}</strong> (coeficiente negativo en Z) y sale <strong>${leaving}</strong> (menor razón positiva).</p>
      <p><strong>Pivote:</strong> fila ${operation.leavingRowIdx + 1}, columna ${entering}, valor ${formatNum(operation.pivot)}.</p>`;
    const highlighted = document.createElement('div');
    highlighted.className = 'simplex-table';
    highlighted.innerHTML = tableToLatexWithHighlight(before, operation);
    card.appendChild(highlighted);

    let operations = `\\(R_{${operation.leavingRowIdx + 1}} \\leftarrow \\frac{R_{${operation.leavingRowIdx + 1}}}{${formatNum(operation.pivot)}}\\)`;
    operation.factors.forEach((factor, rowIndex) => {
      if(Math.abs(factor || 0) > 1e-12) operations += `<br>\\(R_{${rowIndex + 1}} \\leftarrow R_{${rowIndex + 1}} - (${formatNum(factor)})R_{${operation.leavingRowIdx + 1}}\\)`;
    });
    if(Math.abs(operation.objectiveFactor || 0) > 1e-12) operations += `<br>\\(Z \\leftarrow Z - (${formatNum(operation.objectiveFactor)})R_{${operation.leavingRowIdx + 1}}\\)`;
    const operationsEl = document.createElement('p');
    operationsEl.className = 'row-operations';
    operationsEl.innerHTML = `<strong>Operaciones para hacer cero la columna ${entering}:</strong><br>${operations}`;
    card.appendChild(operationsEl);
    const result = document.createElement('div');
    result.className = 'simplex-table';
    result.innerHTML = tableToLatexWithHighlight(after);
    card.appendChild(result);
    container.appendChild(card);
  });

  const finalStep = steps[steps.length - 1];
  if(finalStep.type === 'unbounded'){
    if(window.MathJax) MathJax.typesetPromise([container]);
    return;
  }
  const solution = computeSolutionFromTable(finalStep.after || finalStep.state);
  const solutionEl = document.createElement('div');
  solutionEl.className = solution.infeasible ? 'simplex-solution simplex-unbounded' : 'simplex-solution';
  solutionEl.innerHTML = solution.infeasible
    ? '<h3>Modelo infactible</h3><p>La Fase I/penalización conserva una variable artificial positiva. No se puede aceptar esta tabla como solución del problema original.</p>'
    : `<h3>Solución óptima</h3>${solution.vars.map(item => `\\(${item.var} = ${formatNum(item.value)}\\)`).join(', ')}<br>\\(Z = ${formatNum(solution.Z)}\\)`;
  container.appendChild(solutionEl);
  if(window.MathJax) MathJax.typesetPromise([container]);
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
  const magnitude = Math.max(10, ...constraints.map(c => Math.abs(c.rhs || 0)));
  const bound = Math.ceil(magnitude * 1.35);
  graph.setBlank();
  graph.setMathBounds({ left: -1, right: bound, bottom: -1, top: bound });
  graph.setExpression({ id: 'nonnegative-x', latex: `${x}\\ge0`, color: '#6b7280', fillOpacity: 0.03 });
  graph.setExpression({ id: 'nonnegative-y', latex: `${y}\\ge0`, color: '#6b7280', fillOpacity: 0.03 });

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
    plot2vars(objective, constraints);
  } catch (_) { /* La entrada aún se está escribiendo; se actualizará al completarla. */ }
}
