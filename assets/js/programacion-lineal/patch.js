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
  const steps = [{ type: 'initial', state: cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow) }];

  for(let iteration = 0; iteration < 200; iteration++){
    const enteringIndex = findEntering(state.objRow);
    if(enteringIndex === -1) return steps;
    const leavingRowIdx = findLeaving(state.tableau, enteringIndex);
    // No se detiene antes de renderizar: se conserva la tabla que evidencia
    // que la variable entrante no posee una razón positiva para salir.
    if(leavingRowIdx === -1){
      steps.push({ type: 'unbounded', state: cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow), enteringIndex });
      return steps;
    }
    const before = cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow);
    const operation = pivotOn(state, enteringIndex, leavingRowIdx);
    const after = cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow);
    steps.push({ type: 'pivot', before, operation, after });
  }
  throw new Error('Se alcanzó el límite de 200 iteraciones.');
}

function validateSimplexModel(obj, constraints, sense){
  const issues = [];
  const notes = [];
  if(!constraints.length) issues.push('Debes añadir al menos una restricción.');
  constraints.forEach((constraint, index) => {
    if(constraint.op !== '<=') issues.push(`R${index + 1} usa ${constraint.op}; por ahora el método requiere restricciones ≤.`);
    if(!Number.isFinite(constraint.rhs) || constraint.rhs < 0) issues.push(`R${index + 1} tiene un lado derecho negativo. Requiere transformación previa.`);
  });
  const variables = collectVars(obj, constraints);
  if(!variables.length) issues.push('La función objetivo no contiene variables.');
  const direction = sense === 'min' ? -1 : 1;
  variables.forEach(variable => {
    const improves = direction * (obj.coeffs[variable] || 0) > 1e-12;
    const limitsVariable = constraints.some(constraint => (constraint.coeffs[variable] || 0) > 1e-12);
    if(improves && !limitsVariable) notes.push(`${variable} puede mejorar Z sin un límite superior aparente; el simplex lo comprobará mostrando sus iteraciones.`);
  });
  if(!issues.length) notes.push('Restricciones compatibles con el simplex estándar: forma ≤ y lado derecho no negativo.');
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
    return { index, lhs, valid };
  });
  const nonNegative = solution.vars.every(item => item.value >= -1e-7);
  const z = Object.entries(obj.coeffs).reduce((total, [variable, coefficient]) => total + coefficient * (values[variable] || 0), 0);
  const valid = nonNegative && checks.every(check => check.valid);
  target.className = `verification-box ${valid ? 'ok' : 'error'}`;
  target.innerHTML = `<strong>${valid ? 'Solución verificada.' : 'La solución no pasó la verificación.'}</strong><ul><li>Variables no negativas: ${nonNegative ? 'sí' : 'no'}.</li>${checks.map(check => `<li>R${check.index + 1}: lado izquierdo = ${formatNum(check.lhs)} — ${check.valid ? 'cumple' : 'no cumple'}.</li>`).join('')}<li>Valor comprobado: Z = ${formatNum(z)}.</li></ul>`;
}

function renderUnboundedVerification(){
  const target = $id('verification');
  if(!target) return;
  target.className = 'verification-box warning';
  target.innerHTML = '<strong>No existe una solución óptima finita.</strong><br>La última variable entrante no tiene una fila saliente con coeficiente positivo; por ello Z puede crecer indefinidamente.';
}

function tableToLatexWithHighlight(state, highlight){
  const columns = 'c' + 'r'.repeat(state.vars.length + state.slackNames.length + 1);
  const headers = ['\\mathrm{BV}', ...state.vars, ...state.slackNames, '\\mathrm{RHS}'];
  let latex = `\\[\\begin{array}{${columns}} ${headers.join(' & ')} \\\\ \\hline `;

  state.tableau.forEach((row, rowIndex) => {
    const values = [row.basic, ...row.coeffs, ...row.slack, row.rhs].map((value, columnIndex) => {
      const formatted = typeof value === 'number' ? formatNum(value) : value;
      return highlight && rowIndex === highlight.leavingRowIdx && columnIndex === highlight.enteringIndex + 1
        ? `\\boxed{\\color{orange}{${formatted}}}` : formatted;
    });
    latex += `${values.join(' & ')} \\\\ `;
  });
  latex += `\\hline ${[state.objRow.basic, ...state.objRow.coeffs, ...state.objRow.slack, state.objRow.rhs].map(value => typeof value === 'number' ? formatNum(value) : value).join(' & ')} \\\\ \\end{array}\\]`;
  return latex;
}

function renderStepsLatex(steps){
  const container = $id('steps');
  container.innerHTML = '';
  if(!steps.length) return;

  const initial = steps[0].state;
  container.insertAdjacentHTML('beforeend', '<h3>Tabla inicial</h3>');
  const initialTable = document.createElement('div');
  initialTable.className = 'simplex-table';
  initialTable.innerHTML = tableToLatexWithHighlight(initial);
  container.appendChild(initialTable);

  steps.slice(1).forEach((step, index) => {
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
    card.innerHTML = `<h3>Iteración ${index + 1}</h3>
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
  solutionEl.className = 'simplex-solution';
  solutionEl.innerHTML = `<h3>Solución óptima</h3>${solution.vars.map(item => `\\(${item.var} = ${formatNum(item.value)}\\)`).join(', ')}<br>\\(Z = ${formatNum(solution.Z)}\\)`;
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
