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

function reduceObjectiveByBasicRows(state, metadata){
  const operations = [];
  state.tableau.forEach((row, rowIndex) => {
    const basicColumn = tableauColumnIndex(state, row.basic);
    const factor = tableauValue(state.objRow, basicColumn);
    if(rationalIsZero(factor)) return;
    const before = cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, metadata);
    state.objRow.coeffs = state.objRow.coeffs.map((value, column) =>
      rationalSubtract(value, rationalMultiply(factor, row.coeffs[column])));
    state.objRow.slack = state.objRow.slack.map((value, column) =>
      rationalSubtract(value, rationalMultiply(factor, row.slack[column])));
    state.objRow.rhs = rationalSubtract(state.objRow.rhs, rationalMultiply(factor, row.rhs));
    operations.push({
      rowIndex,
      factor,
      before,
      after: cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, metadata)
    });
  });
  return operations;
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
    objectiveName: obj.objectiveName || 'Z',
    objectiveDirection: built.objectiveDirection,
    bigM: method === 'big-m' ? built.bigM : null,
    objectiveSense: built.objectiveSense,
    objectiveCoeffs: built.objectiveCoeffs,
    originalVars: built.originalVars,
    variableMap: built.variableMap,
    variableDomains: built.variableDomains,
    freeVariables: built.freeVariables
  };
  const preparationBefore = cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, metadata);
  const preparationOperations = reduceObjectiveByBasicRows(state, metadata);
  const steps = [{
    type: 'initial',
    state: cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, metadata),
    preparation: { before: preparationBefore, operations: preparationOperations }
  }];

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

function dualSimplexPreparation(obj, constraints){
  const rows = [];
  for(const constraint of constraints){
    if(typeof isImplicitNonNegativity === 'function' && isImplicitNonNegativity(constraint)){
      const variable = Object.keys(constraint.coeffs).find(name => !rationalIsZero(constraint.coeffs[name]));
      if((obj.variableDomains?.[variable] || 'nonnegative') === 'nonnegative') continue;
    }
    if(constraint.op === '<='){
      rows.push({
        source: constraint,
        normalized: {...constraint, coeffs: {...constraint.coeffs}},
        negated: false
      });
      continue;
    }
    if(constraint.op === '>='){
      rows.push({
        source: constraint,
        normalized: {
          op: '<=',
          rhs: rationalNegate(constraint.rhs),
          coeffs: Object.fromEntries(Object.entries(constraint.coeffs).map(([variable, coefficient]) =>
            [variable, rationalNegate(coefficient)]))
        },
        negated: true
      });
      continue;
    }
    return null;
  }
  return rows;
}

function prepareDualSimplexConstraints(obj, constraints){
  const preparation = dualSimplexPreparation(obj, constraints);
  return preparation && preparation.map(row => row.normalized);
}

function dualSimplexAvailability(obj, constraints){
  if(!obj || !constraints.length) return {available: false, reason: 'El Símplex dual requiere una función objetivo y restricciones completas.'};
  if(!Object.keys(obj.coeffs || {}).length) return {available: false, reason: 'El Símplex dual requiere una función objetivo con variables.'};
  const variables = collectVars(obj, constraints);
  if(variables.some(variable => (obj.variableDomains?.[variable] || 'nonnegative') !== 'nonnegative')){
    return {available: false, reason: 'El Símplex dual requiere que todas las variables sean no negativas.'};
  }
  const normalizedConstraints = prepareDualSimplexConstraints(obj, constraints);
  if(!normalizedConstraints){
    return {available: false, reason: 'El Símplex dual requiere restricciones ≤ o ≥ (estas últimas se multiplican por −1); no admite igualdades.'};
  }
  if(!normalizedConstraints.some(constraint => rationalCompare(constraint.rhs, 0) < 0)){
    return {available: false, reason: 'El Símplex dual requiere al menos un lado derecho negativo para iniciar desde una base no factible.'};
  }
  const objectiveDirection = obj.sense === 'min' ? -1 : 1;
  if(variables.some(variable =>
    rationalCompare(rationalMultiply(objectiveDirection, obj.coeffs[variable] || rational(0)), 0) > 0)){
    return {available: false, reason: 'El Símplex dual requiere costos reducidos iniciales no negativos; revisa los signos de la función objetivo.'};
  }
  return {available: true, reason: 'Disponible: restricciones ≤, variables no negativas, lado derecho negativo y fila objetivo inicialmente dual-factible.'};
}

function dualSimplexSteps(obj, constraints){
  const normalizedConstraints = prepareDualSimplexConstraints(obj, constraints);
  if(!normalizedConstraints) throw new Error('El Símplex dual solo admite restricciones ≤ o ≥; las restricciones ≥ se multiplican por −1.');
  const variables = collectVars(obj, constraints);
  const availability = dualSimplexAvailability(obj, constraints);
  if(!availability.available) throw new Error(availability.reason);

  const vars = variables.slice();
  const slackNames = normalizedConstraints.map((_, index) => `S${index + 1}`);
  const objectiveDirection = obj.sense === 'min' ? -1 : 1;
  const tableau = normalizedConstraints.map((constraint, rowIndex) => ({
    coeffs: vars.map(variable => constraint.coeffs[variable] || rational(0)),
    slack: slackNames.map((_, columnIndex) => rational(columnIndex === rowIndex ? 1 : 0)),
    rhs: constraint.rhs,
    basic: slackNames[rowIndex]
  }));
  const objRow = {
    coeffs: vars.map(variable => rationalNegate(rationalMultiply(objectiveDirection, obj.coeffs[variable] || rational(0)))),
    slack: slackNames.map(() => rational(0)),
    rhs: rational(0),
    basic: 'Z'
  };
  const variableMap = Object.fromEntries(vars.map((variable, index) =>
    [variable, {positive: index, negative: null}]));
  const metadata = {
    method: 'dual-simplex',
    objectiveName: obj.objectiveName || 'Z',
    objectiveDirection,
    objectiveSense: obj.sense || 'max',
    objectiveCoeffs: {...obj.coeffs},
    originalVars: vars.slice(),
    variableMap,
    variableDomains: Object.fromEntries(vars.map(variable => [variable, 'nonnegative'])),
    freeVariables: false
  };
  const state = {vars, slackNames, tableau, objRow};
  const steps = [{
    type: 'initial',
    state: cloneTableauState(vars, slackNames, tableau, objRow, metadata),
    preparation: dualSimplexPreparation(obj, constraints)
  }];

  for(let iteration = 0; iteration < 200; iteration++){
    let leavingRowIdx = -1;
    for(let rowIndex = 0; rowIndex < state.tableau.length; rowIndex++){
      if(rationalCompare(state.tableau[rowIndex].rhs, 0) >= 0) continue;
      if(leavingRowIdx === -1 ||
        rationalCompare(state.tableau[rowIndex].rhs, state.tableau[leavingRowIdx].rhs) < 0){
        leavingRowIdx = rowIndex;
      }
    }
    if(leavingRowIdx === -1) return steps;

    const leavingRow = state.tableau[leavingRowIdx];
    let enteringIndex = -1;
    let bestRatio = null;
    const candidates = [];
    for(let columnIndex = 0; columnIndex < vars.length + slackNames.length; columnIndex++){
      const name = tableauColumnName(state, columnIndex);
      if(state.tableau.some(row => row.basic === name)) continue;
      const coefficient = tableauValue(leavingRow, columnIndex);
      if(rationalCompare(coefficient, 0) >= 0){
        candidates.push({columnIndex, name, coefficient, reducedCost: tableauValue(state.objRow, columnIndex), ratio: null, eligible: false});
        continue;
      }
      const ratio = rationalDivide(tableauValue(state.objRow, columnIndex), rationalNegate(coefficient));
      candidates.push({columnIndex, name, coefficient, reducedCost: tableauValue(state.objRow, columnIndex), ratio, eligible: true});
      if(bestRatio === null || rationalCompare(ratio, bestRatio) < 0 ||
        (rationalCompare(ratio, bestRatio) === 0 && columnIndex < enteringIndex)){
        bestRatio = ratio;
        enteringIndex = columnIndex;
      }
    }
    if(enteringIndex === -1){
      steps.push({
        type: 'dual-infeasible',
        state: cloneTableauState(vars, slackNames, tableau, objRow, metadata),
        leavingRowIdx
      });
      return steps;
    }

    const before = cloneTableauState(vars, slackNames, tableau, objRow, metadata);
    const operation = pivotOn(state, enteringIndex, leavingRowIdx);
    const after = cloneTableauState(vars, slackNames, tableau, objRow, metadata);
    steps.push({type: 'pivot', before, operation, after, method: 'dual-simplex', candidates});
  }
  throw new Error('Se alcanzó el límite de 200 iteraciones del Símplex dual.');
}

function setObjectiveRow(state, variableCoeffs, slackCoeffs, rhs){
  state.objRow = {
    coeffs: state.vars.map(variable => variableCoeffs[variable] || rational(0)),
    slack: state.slackNames.map(name => slackCoeffs[name] || rational(0)),
    rhs: rhs || rational(0),
    basic: 'Z'
  };
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
    objectiveName: obj.objectiveName || 'Z',
    objectiveDirection: built.objectiveDirection,
    objectiveSense: built.objectiveSense,
    objectiveCoeffs: built.objectiveCoeffs,
    originalVars: built.originalVars,
    variableMap: built.variableMap,
    variableDomains: built.variableDomains,
    freeVariables: built.freeVariables
  };
  setObjectiveRow(state, {}, artificialCoeffs, rational(0));
  const phaseOneMetadata = {...metadata, phase: 1};
  const phaseOneBefore = cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, phaseOneMetadata);
  const phaseOneOperations = reduceObjectiveByBasicRows(state, phaseOneMetadata);
  const steps = [{
    type: 'initial',
    phase: 1,
    state: cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, phaseOneMetadata),
    preparation: { before: phaseOneBefore, operations: phaseOneOperations }
  }];
  appendSimplexPhaseSteps(state, metadata, steps, 1);
  const phaseOneState = steps[steps.length - 1];
  const phaseOneTableau = phaseOneState.after || phaseOneState.state;
  if(phaseOneState.type === 'unbounded' || rationalCompare(phaseOneTableau.objRow.rhs, 0) < 0){
    return steps;
  }

  steps.push({
    type: 'phase',
    phase: 2,
    state: null,
    preparation: null
  });
  const objectiveCoeffs = Object.fromEntries(state.vars.map(variable => [
    variable,
    rationalNegate(built.objectiveVector[variable] || rational(0))
  ]));
  setObjectiveRow(state, objectiveCoeffs, {}, rational(0));
  const phaseTwoMetadata = {...metadata, phase: 2};
  const phaseTwoBefore = cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, phaseTwoMetadata);
  const phaseTwoOperations = reduceObjectiveByBasicRows(state, phaseTwoMetadata);
  const phaseTwoInitial = cloneTableauState(state.vars, state.slackNames, state.tableau, state.objRow, phaseTwoMetadata);
  steps[steps.length - 1].state = phaseTwoInitial;
  steps[steps.length - 1].preparation = { before: phaseTwoBefore, operations: phaseTwoOperations };
  appendSimplexPhaseSteps(state, metadata, steps, 2);
  return steps;
}

function revisedMatrixMultiply(left, right){
  if(!left.length || !right.length) return [];
  return left.map(row => right[0].map((_, column) =>
    row.reduce((sum, value, index) =>
      rationalAdd(sum, rationalMultiply(value, right[index][column])), rational(0))
  ));
}

function revisedMatrixInverse(matrix){
  const size = matrix.length;
  const augmented = matrix.map((row, index) => [
    ...row,
    ...Array.from({length: size}, (_, column) => rational(index === column ? 1 : 0))
  ]);

  for(let column = 0; column < size; column++){
    const pivotRow = augmented.findIndex((row, index) =>
      index >= column && !rationalIsZero(row[column])
    );
    if(pivotRow === -1) throw new Error('La matriz B es singular; no se puede continuar con el símplex revisado.');
    [augmented[column], augmented[pivotRow]] = [augmented[pivotRow], augmented[column]];
    const pivot = augmented[column][column];
    augmented[column] = augmented[column].map(value => rationalDivide(value, pivot));
    augmented.forEach((row, index) => {
      if(index === column) return;
      const factor = row[column];
      if(rationalIsZero(factor)) return;
      augmented[index] = row.map((value, entry) =>
        rationalSubtract(value, rationalMultiply(factor, augmented[column][entry]))
      );
    });
  }
  return augmented.map(row => row.slice(size));
}

function revisedColumn(matrix, columnIndex){
  return matrix.map(row => row[columnIndex]);
}

function revisedSimplexSnapshot(built, matrix, rhs, basis, costs, phase, iteration, cleanup = []){
  const basisMatrix = matrix.map(row => basis.map(columnIndex => row[columnIndex]));
  const inverse = revisedMatrixInverse(basisMatrix);
  const basicValues = revisedMatrixMultiply(inverse, rhs.map(value => [value])).map(row => row[0]);
  const basicCosts = basis.map(columnIndex => costs[columnIndex]);
  const columnCount = built.vars.length + built.slackNames.length;
  const nonbasic = Array.from({length: columnCount}, (_, columnIndex) => columnIndex)
    .filter(columnIndex => !basis.includes(columnIndex) &&
      (phase !== 2 || !/^A\d+$/.test(tableauColumnName(built, columnIndex))));
  const nonbasicColumns = nonbasic.map(columnIndex => revisedColumn(matrix, columnIndex));
  const zValues = nonbasicColumns.map(column => {
    const transformedColumn = revisedMatrixMultiply(inverse, column.map(value => [value]));
    return basicCosts.reduce((sum, cost, rowIndex) =>
      rationalAdd(sum, rationalMultiply(cost, transformedColumn[rowIndex][0])), rational(0));
  });
  const nonbasicCosts = nonbasic.map(columnIndex => costs[columnIndex]);
  const reducedCosts = zValues.map((value, index) => rationalSubtract(value, nonbasicCosts[index]));
  const enteringPosition = nonbasic.findIndex((_, index) => rationalCompare(reducedCosts[index], 0) < 0);
  const enteringIndex = enteringPosition < 0 ? -1 : nonbasic[enteringPosition];
  let ratios = [];
  let leavingRowIndex = -1;
  if(enteringIndex >= 0){
    const direction = revisedMatrixMultiply(inverse, revisedColumn(matrix, enteringIndex).map(value => [value]))
      .map(row => row[0]);
    let bestRatio = null;
    let bestBasicIndex = Infinity;
    ratios = basicValues.map((value, rowIndex) => {
      const coefficient = direction[rowIndex];
      if(rationalCompare(coefficient, 0) <= 0) return null;
      const ratio = rationalDivide(value, coefficient);
      if(rationalCompare(ratio, 0) < 0) return null;
      const comparison = bestRatio === null ? -1 : rationalCompare(ratio, bestRatio);
      const basicIndex = basis[rowIndex];
      if(bestRatio === null || comparison < 0 || (comparison === 0 && basicIndex < bestBasicIndex)){
        bestRatio = ratio;
        bestBasicIndex = basicIndex;
        leavingRowIndex = rowIndex;
      }
      return ratio;
    });
  }

  const objectiveValue = basicCosts.reduce((sum, cost, index) =>
    rationalAdd(sum, rationalMultiply(cost, basicValues[index])), rational(0));
  const allReducedCosts = Array.from({length: columnCount}, (_, columnIndex) => {
    const basisPosition = basis.indexOf(columnIndex);
    if(basisPosition >= 0) return rational(0);
    const column = revisedColumn(matrix, columnIndex);
    const transformed = revisedMatrixMultiply(inverse, column.map(value => [value]));
    return rationalSubtract(
      basicCosts.reduce((sum, cost, rowIndex) =>
        rationalAdd(sum, rationalMultiply(cost, transformed[rowIndex][0])), rational(0)),
      costs[columnIndex]
    );
  });
  const canonicalRows = revisedMatrixMultiply(inverse, matrix);
  const state = {
    vars: built.vars.slice(),
    slackNames: built.slackNames.slice(),
    tableau: canonicalRows.map((row, index) => ({
      coeffs: row.slice(0, built.vars.length),
      slack: row.slice(built.vars.length),
      rhs: basicValues[index],
      basic: tableauColumnName(built, basis[index])
    })),
    objRow: {
      coeffs: allReducedCosts.slice(0, built.vars.length),
      slack: allReducedCosts.slice(built.vars.length),
      rhs: objectiveValue,
      basic: 'Z'
    },
    method: 'revised',
    objectiveDirection: built.objectiveDirection,
    objectiveSense: built.objectiveSense,
    objectiveName: built.objectiveName || 'Z',
    objectiveCoeffs: built.objectiveCoeffs,
    originalVars: built.originalVars,
    variableMap: built.variableMap,
    variableDomains: built.variableDomains,
    freeVariables: built.freeVariables
  };

  return {
    type: 'revised',
    phase,
    iteration,
    A: matrix.map(row => row.slice()),
    B: basisMatrix,
    A_j: matrix.map(row => nonbasic.map(columnIndex => row[columnIndex])),
    B_inverse: inverse,
    b: rhs.slice(),
    x_B: basicValues.slice(),
    C: costs.slice(),
    C_B: basicCosts,
    C_j: nonbasicCosts,
    nonbasic,
    reducedCosts,
    enteringIndex,
    leavingRowIndex,
    ratios,
    state,
    cleanup
  };
}

function revisedSimplexSteps(obj, constraints){
  const built = buildTableau(obj, constraints);
  const stateForColumns = {vars: built.vars, slackNames: built.slackNames};
  built.objectiveName = obj.objectiveName || 'Z';
  const matrix = built.tableau.map(row => [...row.coeffs, ...row.slack]);
  const rhs = built.tableau.map(row => row.rhs);
  let basis = built.tableau.map(row => tableauColumnIndex(stateForColumns, row.basic));
  const artificialIndexes = new Set(built.slackNames
    .map((name, index) => /^A\d+$/.test(name) ? built.vars.length + index : -1)
    .filter(index => index >= 0));
  const steps = [];
  const optimize = (phase, costs) => {
    for(let iteration = 1; iteration <= 200; iteration++){
      const step = revisedSimplexSnapshot(built, matrix, rhs, basis, costs, phase, iteration);
      steps.push(step);
      if(step.enteringIndex === -1){
        step.decision = 'optimal';
        return step;
      }
      if(step.leavingRowIndex === -1){
        step.type = 'unbounded';
        step.decision = 'unbounded';
        return step;
      }
      step.decision = 'pivot';
      basis[step.leavingRowIndex] = step.enteringIndex;
    }
    throw new Error(`Se alcanzó el límite de 200 iteraciones en la Fase ${phase} del símplex revisado.`);
  };

  if(artificialIndexes.size){
    const phaseOneCosts = Array.from({length: built.vars.length + built.slackNames.length}, (_, columnIndex) =>
      rational(artificialIndexes.has(columnIndex) ? -1 : 0)
    );
    const phaseOne = optimize(1, phaseOneCosts);
    if(phaseOne.decision !== 'optimal') return steps;
    if(rationalCompare(phaseOne.state.objRow.rhs, 0) < 0){
      phaseOne.type = 'infeasible';
      phaseOne.decision = 'infeasible';
      return steps;
    }

    const cleanup = [];
    for(let rowIndex = 0; rowIndex < basis.length;){
      if(!artificialIndexes.has(basis[rowIndex])){
        rowIndex++;
        continue;
      }
      const current = revisedSimplexSnapshot(built, matrix, rhs, basis, phaseOneCosts, 1, steps.length, cleanup);
      if(!rationalIsZero(current.state.tableau[rowIndex].rhs)){
        const infeasible = steps[steps.length - 1];
        infeasible.type = 'infeasible';
        infeasible.decision = 'infeasible';
        return steps;
      }
      const basicSet = new Set(basis);
      const inverseRow = current.B_inverse[rowIndex];
      const replacement = matrix[0].findIndex((_, columnIndex) => {
        if(artificialIndexes.has(columnIndex) || basicSet.has(columnIndex)) return false;
        const coefficient = inverseRow.reduce((sum, value, matrixRow) =>
          rationalAdd(sum, rationalMultiply(value, matrix[matrixRow][columnIndex])), rational(0));
        return !rationalIsZero(coefficient);
      });
      if(replacement >= 0){
        const leaving = tableauColumnName(stateForColumns, basis[rowIndex]);
        basis[rowIndex] = replacement;
        cleanup.push(`Se reemplazó ${leaving} (artificial básica en cero) por ${tableauColumnName(stateForColumns, replacement)}.`);
        continue;
      }
      if(!rationalIsZero(current.state.tableau[rowIndex].rhs)){
        const infeasible = steps[steps.length - 1];
        infeasible.type = 'infeasible';
        infeasible.decision = 'infeasible';
        return steps;
      }
      cleanup.push(`Se eliminó la fila redundante de ${tableauColumnName(stateForColumns, basis[rowIndex])}; su lado derecho es cero y no aporta una columna no artificial.`);
      matrix.splice(rowIndex, 1);
      rhs.splice(rowIndex, 1);
      basis.splice(rowIndex, 1);
    }
    if(steps.length) steps[steps.length - 1].cleanup = cleanup;
  }

  const phaseTwoCosts = Array.from({length: built.vars.length + built.slackNames.length}, (_, columnIndex) =>
    artificialIndexes.has(columnIndex)
      ? rational(0)
      : columnIndex < built.vars.length
        ? built.objectiveVector[built.vars[columnIndex]] || rational(0)
        : rational(0));
  if(artificialIndexes.size) steps.push({
    type: 'revised-phase',
    phase: 2,
    message: 'La Fase I encontró una base factible; se retiran las artificiales de la función objetivo y se restaura el objetivo original.'
  });
  const phaseTwo = optimize(2, phaseTwoCosts);
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
  if(method === 'simplex' && (!isStandardSimplexModel(constraints) ||
    variables.some(variable => (obj.variableDomains?.[variable] || 'nonnegative') !== 'nonnegative'))){
    issues.push('El Símplex estándar requiere restricciones ≤ después de normalizar el lado derecho y variables no negativas. Prueba Símplex revisado, Gran M, Dos Fases o resuelve el dual si cumple esas condiciones.');
  }
  if(method === 'dual-simplex'){
    const availability = dualSimplexAvailability(obj, constraints);
    if(!availability.available) issues.push(availability.reason);
  }
  if(method !== 'graphical'){
    const direction = sense === 'min' ? -1 : 1;
    variables.forEach(variable => {
      const improves = rationalCompare(rationalMultiply(direction, obj.coeffs[variable] || 0), 0) > 0;
      const limitsVariable = constraints.some(constraint => rationalCompare(constraint.coeffs[variable] || 0, 0) > 0);
      if(improves && !limitsVariable) notes.push(`${variable} puede mejorar ${obj.objectiveName || 'Z'} sin un límite superior aparente; el simplex lo comprobará mostrando sus iteraciones.`);
    });
  }
  if(!issues.length){
    if(method === 'simplex'){
      notes.push('Se aplicará Símplex estándar: las restricciones proporcionan una base inicial de holguras y no se necesitan variables artificiales.');
    } else if(method === 'revised'){
      notes.push('Se aplicará Símplex revisado: se mostrarán A, B, A_j, B^{-1}, b y los costos reducidos en cada iteración; si hace falta, la Fase I construirá una base factible.');
    } else if(method === 'graphical'){
      notes.push(`Se aplicará el método gráfico: se consideran los signos seleccionados, se intersectan las fronteras y se evalúa ${obj.objectiveName || 'Z'} en cada vértice factible.`);
    } else if(method === 'dual-simplex'){
      notes.push('Se aplicará Símplex dual: sale la variable básica con el lado derecho más negativo y entra la variable que conserva la factibilidad dual con la razón mínima.');
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

function buildDualModel(primalObjective, primalConstraints){
  const variables = collectVars(primalObjective, primalConstraints);
  const dualVariables = primalConstraints.map((_, index) => `y${index + 1}`);
  const primalSense = primalObjective.sense || 'max';
  const dualObjective = {
    sense: primalSense === 'max' ? 'min' : 'max',
    objectiveName: 'W',
    coeffs: Object.fromEntries(primalConstraints.map((constraint, index) => [
      dualVariables[index], constraint.rhs
    ])),
    vars: dualVariables,
    variableDomains: {}
  };
  primalConstraints.forEach((constraint, index) => {
    dualObjective.variableDomains[dualVariables[index]] = constraint.op === '='
      ? 'free'
      : primalSense === 'max'
        ? constraint.op === '<=' ? 'nonnegative' : 'nonpositive'
        : constraint.op === '<=' ? 'nonpositive' : 'nonnegative';
  });

  const constraints = variables
    .filter(variable => (primalObjective.variableDomains?.[variable] || 'nonnegative') !== 'zero')
    .map(variable => {
      const domain = primalObjective.variableDomains?.[variable] || 'nonnegative';
      const op = domain === 'free'
        ? '='
        : primalSense === 'max'
          ? domain === 'nonnegative' ? '>=' : '<='
          : domain === 'nonnegative' ? '<=' : '>=';
      return {
        op,
        rhs: primalObjective.coeffs[variable] || rational(0),
        coeffs: Object.fromEntries(primalConstraints.map((constraint, index) => [
          dualVariables[index], constraint.coeffs[variable] || rational(0)
        ]))
      };
    });

  return {
    objective: dualObjective,
    constraints,
    variables: dualVariables,
    primalVariables: variables,
    primalSense,
    matrix: primalConstraints.map(constraint => variables.map(variable =>
      constraint.coeffs[variable] || rational(0))),
    primalObjectiveCoefficients: variables.map(variable => primalObjective.coeffs[variable] || rational(0))
  };
}

function dualLinearExpression(coefficients, variables){
  return linearCombinationToLatex(variables.map(variable => ({
    variable,
    coefficient: coefficients[variable] || rational(0)
  })));
}

function renderDualTransformationCard(dualModel){
  const card = document.createElement('article');
  card.className = 'step-card dual-transformation';
  const primalObjectiveLabel = dualModel.primalSense === 'max' ? 'Maximizar' : 'Minimizar';
  const dualObjectiveLabel = dualModel.objective.sense === 'max' ? 'Maximizar' : 'Minimizar';
  const dualVariables = dualModel.variables;
  const primalVariables = dualModel.primalVariables;
  const dualObjectiveExpression = dualLinearExpression(dualModel.objective.coeffs, dualVariables);
  const matrixHead = `<tr><th>Restricción primal</th>${primalVariables.map(variable => `<th>${simplexNameToLatex(variable)}</th>`).join('')}</tr>`;
  const matrixRows = dualModel.matrix.map((row, index) =>
    `<tr><th>\\(R_{${index + 1}}\\)</th>${row.map(value => `<td>\\(${formatNum(value)}\\)</td>`).join('')}</tr>`
  ).join('');
  const dualConstraints = dualModel.constraints.map((constraint, index) =>
    `<li>\\(${dualLinearExpression(constraint.coeffs, dualVariables)} ${constraintOperatorLatex(constraint.op)} ${formatNum(constraint.rhs)}\\)</li>`
  ).join('');
  const dualDomains = dualVariables.map((variable, index) => {
    const domain = dualModel.objective.variableDomains[variable];
    const symbol = {nonnegative: '\\ge 0', nonpositive: '\\le 0', free: '\\in\\mathbb{R}'}[domain];
    return `\\(${simplexNameToLatex(variable)} ${symbol}\\) según el sentido de \\(R_{${index + 1}}\\).`;
  }).join(' ');

  card.innerHTML = `<h3>Conversión paso a paso del primal al dual</h3>
    <p><strong>1. Identificar el sentido:</strong> el primal es de ${primalObjectiveLabel.toLowerCase()}; por dualidad, el dual será de ${dualObjectiveLabel.toLowerCase()}.</p>
    <p><strong>2. Transponer la matriz de coeficientes:</strong> cada restricción primal genera una variable dual y cada variable primal genera una restricción dual.</p>
    <div class="dual-matrix-wrap"><table class="dual-matrix">${matrixHead}${matrixRows}</table></div>
    <p><strong>3. Formar la función objetivo dual:</strong> se usan los lados derechos \\(b_i\\) del primal como coeficientes de \\(y_i\\).</p>
    <p>\\(${dualObjectiveLabel} \\quad W = ${dualObjectiveExpression}\\)</p>
    <p><strong>4. Determinar los signos de las variables duales:</strong> dependen del sentido de cada restricción primal.</p>
    <p>${dualDomains}</p>
    <p><strong>5. Formar las restricciones duales:</strong> cada columna de la matriz transpuesta se compara con el coeficiente correspondiente de la función objetivo primal; el signo de la variable primal determina el operador.</p>
    <ul>${dualConstraints || '<li>El dual no tiene restricciones provenientes de variables del primal fijadas en cero.</li>'}</ul>
    <p>Así, el valor óptimo primal \\(Z\\) y el valor óptimo dual \\(W\\) deben coincidir cuando ambos modelos tienen óptimos finitos.</p>`;
  return card;
}

function prependDualTransformation(context, target){
  target.prepend(renderDualTransformationCard(context.dual));
  typesetMath([target]);
}

function solveModelSummary(objective, constraints){
  const variables = collectVars(objective, constraints);
  objective.vars = variables;
  if(variables.length === 2){
    const result = solveGraphicalModel(objective, constraints);
    return {
      objective,
      constraints,
      variables,
      type: 'graphical',
      result,
      value: result.optimum?.objective || null,
      unbounded: result.unbounded,
      infeasible: result.feasibleVertices.length === 0
    };
  }

  const needsInitialPhase = !isStandardSimplexModel(constraints);
  const steps = needsInitialPhase
    ? twoPhaseSteps(objective, constraints)
    : simplexSteps(objective, constraints, 'simplex');
  const finalStep = steps[steps.length - 1];
  const unbounded = finalStep.type === 'unbounded';
  const solution = unbounded ? null : computeSolutionFromTable(finalStep.after || finalStep.state);
  return {
    objective,
    constraints,
    variables,
    type: 'simplex',
    steps,
    solution,
    value: solution && !solution.infeasible ? solution.Z : null,
    unbounded,
    infeasible: Boolean(solution?.infeasible)
  };
}

function dualResultSummary(modelResult){
  if(modelResult.unbounded) return 'No tiene óptimo finito (objetivo no acotado).';
  if(modelResult.infeasible) return 'No se encontró una solución factible.';
  if(modelResult.value === null) return 'No se pudo determinar un valor óptimo.';
  const symbol = modelResult.objective.objectiveName || 'Z';
  const assignments = modelResult.type === 'graphical'
    ? modelResult.variables.map(variable => {
      const index = modelResult.variables.indexOf(variable);
      const value = index === 0 ? modelResult.result.optimum.x : modelResult.result.optimum.y;
      return `\\(${simplexNameToLatex(variable)}=${formatNum(value)}\\;(${formatDecimal(value)})\\)`;
    })
    : modelResult.solution.vars.map(item =>
      `\\(${simplexNameToLatex(item.var)}=${formatNum(item.value)}\\;(${formatDecimal(item.value)})\\)`
    );
  return `${assignments.join(', ')}; \\(${symbol}=${formatNum(modelResult.value)}\\;(${formatDecimal(modelResult.value)})\\)`;
}

function completeDualWorkflow(context, focusedResult){
  const isDualFocused = context.focus === 'dual';
  const oppositeModel = isDualFocused ? context.primal : context.dual;
  const oppositeResult = solveModelSummary(oppositeModel.objective, oppositeModel.constraints);
  const primalResult = isDualFocused ? oppositeResult : focusedResult;
  const dualResult = isDualFocused ? focusedResult : oppositeResult;
  const panel = $id('dual-results');
  panel.replaceChildren();

  if(!isDualFocused) panel.appendChild(renderDualTransformationCard(context.dual));
  const comparison = document.createElement('section');
  comparison.className = 'dual-comparison';
  comparison.innerHTML = `<h3>Resultados y comparación de dualidad</h3>
    <p><strong>Primal:</strong> ${dualResultSummary(primalResult)}</p>
    <p><strong>Dual:</strong> ${dualResultSummary(dualResult)}</p>`;
  if(primalResult.value !== null && dualResult.value !== null){
    const equal = rationalCompare(primalResult.value, dualResult.value) === 0;
    comparison.insertAdjacentHTML('beforeend', `<p class="${equal ? 'verification-box ok' : 'verification-box warning'}"><strong>Comparación:</strong> \\(Z=${formatNum(primalResult.value)}\\), \\(W=${formatNum(dualResult.value)}\\). ${equal
      ? 'Los valores coinciden; se verifica la dualidad fuerte.'
      : 'Los valores no coinciden; revisa la factibilidad y el estado de optimalidad de ambos modelos.'}</p>`);
  } else {
    comparison.insertAdjacentHTML('beforeend', '<p class="verification-box warning">La igualdad \\(Z=W\\) solo puede comprobarse si ambos modelos tienen un óptimo finito.</p>');
  }
  panel.appendChild(comparison);

  const graphControls = document.createElement('div');
  graphControls.className = 'dual-graph-controls';
  graphControls.innerHTML = '<strong>Mostrar gráfica:</strong> ';
  const activeModel = isDualFocused ? context.dual : context.primal;
  const models = [
    {label: 'Primal', model: context.primal},
    {label: 'Dual', model: context.dual}
  ];
  models.forEach(({label, model}) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `Gráfica del ${label.toLowerCase()}`;
    button.disabled = model.objective.vars.length !== 2;
    button.title = button.disabled ? 'La gráfica requiere exactamente dos variables.' : '';
    if(model === activeModel) button.classList.add('active');
    button.addEventListener('click', () => {
      if(button.disabled) return;
      graphControls.querySelectorAll('button').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      const graphicalResult = solveGraphicalModel(model.objective, model.constraints);
      plotGraphicalModel(model.objective, model.constraints, graphicalResult);
    });
    graphControls.appendChild(button);
  });
  panel.appendChild(graphControls);
  typesetMath([panel]);
}

function graphicalPointKey(point){
  return `${formatNum(point.x)}|${formatNum(point.y)}`;
}

function graphicalPointIsFeasible(point, variables, constraints, variableDomains){
  const [x, y] = variables;
  const coordinates = { [x]: point.x, [y]: point.y };
  if(!variables.every(variable => {
    const domain = variableDomains[variable] || 'nonnegative';
    const comparison = rationalCompare(coordinates[variable], 0);
    if(domain === 'nonnegative') return comparison >= 0;
    if(domain === 'nonpositive') return comparison <= 0;
    if(domain === 'zero') return comparison === 0;
    return true;
  })) return false;
  return constraints.every(constraint => {
    const lhs = rationalAdd(
      rationalMultiply(constraint.coeffs[x] || rational(0), point.x),
      rationalMultiply(constraint.coeffs[y] || rational(0), point.y)
    );
    const comparison = rationalCompare(lhs, constraint.rhs);
    if(constraint.op === '<=') return comparison <= 0;
    if(constraint.op === '>=') return comparison >= 0;
    return comparison === 0;
  });
}

function graphicalBoundaryIntersection(left, right){
  const determinant = rationalSubtract(
    rationalMultiply(left.a, right.b),
    rationalMultiply(right.a, left.b)
  );
  if(rationalIsZero(determinant)) return null;
  const determinantX = rationalSubtract(
    rationalMultiply(left.rhs, right.b),
    rationalMultiply(right.rhs, left.b)
  );
  const determinantY = rationalSubtract(
    rationalMultiply(left.a, right.rhs),
    rationalMultiply(right.a, left.rhs)
  );
  return {
    x: rationalDivide(determinantX, determinant),
    y: rationalDivide(determinantY, determinant),
    determinant,
    determinantX,
    determinantY
  };
}

function graphicalBoundaryExpression(boundary, variables){
  const terms = [
    desmosTerm(boundary.a, variables[0]),
    desmosTerm(boundary.b, variables[1])
  ].filter(Boolean);
  const lhs = terms.join('+').replace(/\+\-/g, '-');
  return `${lhs || '0'}=${formatNum(boundary.rhs)}`;
}

function renderGraphicalIntersectionProcedure(result){
  const section = document.createElement('article');
  section.className = 'step-card graphical-procedure';
  section.innerHTML = '<h3>Procedimiento para calcular las coordenadas</h3><p>Cada vértice se obtiene al resolver el sistema formado por dos fronteras. Se usa la regla de Cramer para calcular primero los determinantes y luego las coordenadas exactas.</p>';
  if(!result.intersections.length){
    section.insertAdjacentHTML('beforeend', '<p>No se encontraron intersecciones entre las fronteras consideradas.</p>');
    return section;
  }

  result.intersections.forEach((point, index) => {
    const {left, right} = point.boundaries;
    const [x, y] = result.variables;
    const card = document.createElement('section');
    card.className = 'graphical-coordinate-step';
    card.innerHTML = `<h4>Intersección \\(V_{${index + 1}}\\): ${left.label} con ${right.label}</h4>
      <p>Sistema de fronteras:</p>
      <div>\\(${graphicalBoundaryExpression(left, result.variables)}\\)</div>
      <div>\\(${graphicalBoundaryExpression(right, result.variables)}\\)</div>
      <p>Determinante principal:</p>
      <div>\\(\\Delta = a_1b_2-a_2b_1 = (${formatNum(left.a)})(${formatNum(right.b)})-(${formatNum(right.a)})(${formatNum(left.b)}) = ${formatNum(point.determinant)}\\)</div>
      <p>Cálculo de \\(${x}\\):</p>
      <div>\\(\\Delta_${x} = c_1b_2-c_2b_1 = (${formatNum(left.rhs)})(${formatNum(right.b)})-(${formatNum(right.rhs)})(${formatNum(left.b)}) = ${formatNum(point.determinantX)}\\)</div>
      <div>\\(${x}=\\frac{\\Delta_${x}}{\\Delta}=\\frac{${formatNum(point.determinantX)}}{${formatNum(point.determinant)}}=${formatNum(point.x)}\\)</div>
      <p>Cálculo de \\(${y}\\):</p>
      <div>\\(\\Delta_${y} = a_1c_2-a_2c_1 = (${formatNum(left.a)})(${formatNum(right.rhs)})-(${formatNum(right.a)})(${formatNum(left.rhs)}) = ${formatNum(point.determinantY)}\\)</div>
      <div>\\(${y}=\\frac{\\Delta_${y}}{\\Delta}=\\frac{${formatNum(point.determinantY)}}{${formatNum(point.determinant)}}=${formatNum(point.y)}\\)</div>
      <p>Por tanto, \\(V_{${index + 1}}=(${formatNum(point.x)},${formatNum(point.y)})\\). ${point.feasible ? 'El punto cumple las restricciones y los dominios seleccionados.' : 'El punto no cumple todas las restricciones o dominios, por lo que no pertenece a la región factible.'}</p>`;
    section.appendChild(card);
  });
  return section;
}

function graphicalObjectiveValue(point, obj, variables){
  return rationalAdd(
    rationalMultiply(obj.coeffs[variables[0]] || rational(0), point.x),
    rationalMultiply(obj.coeffs[variables[1]] || rational(0), point.y)
  );
}

function recessionDirectionIsFeasible(direction, variables, constraints, variableDomains){
  const [x, y] = variables;
  const coordinates = { [x]: direction.x, [y]: direction.y };
  if(!variables.every(variable => {
    const domain = variableDomains[variable] || 'nonnegative';
    const comparison = rationalCompare(coordinates[variable], 0);
    if(domain === 'nonnegative') return comparison >= 0;
    if(domain === 'nonpositive') return comparison <= 0;
    if(domain === 'zero') return comparison === 0;
    return true;
  })) return false;
  return constraints.every(constraint => {
    const change = rationalAdd(
      rationalMultiply(constraint.coeffs[x] || rational(0), direction.x),
      rationalMultiply(constraint.coeffs[y] || rational(0), direction.y)
    );
    const comparison = rationalCompare(change, 0);
    if(constraint.op === '<=') return comparison <= 0;
    if(constraint.op === '>=') return comparison >= 0;
    return comparison === 0;
  });
}

function graphicalImprovingDirectionExists(obj, variables, constraints){
  const domains = obj.variableDomains || {};
  const directions = [];
  variables.forEach((variable, index) => {
    const otherIndex = 1 - index;
    const domain = domains[variable] || 'nonnegative';
    if(domain === 'zero') return;
    const direction = {x: rational(0), y: rational(0)};
    direction[index === 0 ? 'x' : 'y'] = domain === 'nonpositive' ? rational(-1) : rational(1);
    directions.push(direction);
    if(domain === 'free'){
      const opposite = {...direction};
      opposite[index === 0 ? 'x' : 'y'] = rational(-1);
      directions.push(opposite);
    }
    directions.push({x: direction.x, y: rational(0)});
    directions.push({x: rational(0), y: direction.y});
    if(otherIndex >= 0 && domains[variables[otherIndex]] === 'free'){
      directions.push({...direction, [otherIndex === 0 ? 'x' : 'y']: rational(1)});
      directions.push({...direction, [otherIndex === 0 ? 'x' : 'y']: rational(-1)});
    }
  });
  constraints.forEach(constraint => {
    const a = constraint.coeffs[variables[0]] || rational(0);
    const b = constraint.coeffs[variables[1]] || rational(0);
    if(rationalIsZero(a) && rationalIsZero(b)) return;
    directions.push(
      {x: b, y: rationalNegate(a)},
      {x: rationalNegate(b), y: a}
    );
  });

  const directionOfObjective = obj.sense === 'min' ? -1 : 1;
  return directions.some(direction => {
    if(rationalIsZero(direction.x) && rationalIsZero(direction.y)) return false;
    if(!recessionDirectionIsFeasible(direction, variables, constraints, domains)) return false;
    const change = graphicalObjectiveValue(direction, obj, variables);
    return rationalCompare(rationalMultiply(directionOfObjective, change), 0) > 0;
  });
}

function solveGraphicalModel(obj, constraints){
  const variables = obj.vars;
  const variableDomains = obj.variableDomains || {};
  const boundaries = [
    ...constraints.map((constraint, index) => ({
      a: constraint.coeffs[variables[0]] || rational(0),
      b: constraint.coeffs[variables[1]] || rational(0),
      rhs: constraint.rhs,
      label: `restricción ${index + 1}`
    }))
  ];
  variables.forEach((variable, index) => {
    if((variableDomains[variable] || 'nonnegative') === 'free') return;
    boundaries.push({
      a: index === 0 ? rational(1) : rational(0),
      b: index === 1 ? rational(1) : rational(0),
      rhs: rational(0),
      label: `dominio de ${variable}`
    });
  });
  const intersections = new Map();
  for(let left = 0; left < boundaries.length; left++){
    for(let right = left + 1; right < boundaries.length; right++){
      const point = graphicalBoundaryIntersection(boundaries[left], boundaries[right]);
      if(point) intersections.set(graphicalPointKey(point), {
        ...point,
        boundaries: {left: boundaries[left], right: boundaries[right]}
      });
    }
  }
  const points = Array.from(intersections.values())
    .sort((left, right) => rationalCompare(left.x, right.x) || rationalCompare(left.y, right.y))
    .map(point => ({
      ...point,
      feasible: graphicalPointIsFeasible(point, variables, constraints, variableDomains),
      objective: graphicalObjectiveValue(point, obj, variables)
    }));
  const feasibleVertices = points.filter(point => point.feasible);
  let optimum = null;
  const direction = obj.sense === 'min' ? -1 : 1;
  feasibleVertices.forEach(point => {
    const improves = optimum === null
      ? true
      : rationalCompare(rationalMultiply(direction, point.objective), rationalMultiply(direction, optimum.objective)) > 0;
    if(improves) optimum = point;
  });
  const unbounded = feasibleVertices.length > 0 && graphicalImprovingDirectionExists(obj, variables, constraints);
  const optimalVertices = optimum && !unbounded
    ? feasibleVertices.filter(point => rationalCompare(point.objective, optimum.objective) === 0)
    : [];
  return {
    variables,
    intersections: points,
    feasibleVertices,
    optimum: unbounded ? null : optimum,
    optimalVertices,
    unbounded
  };
}

function renderGraphicalResult(result, obj){
  const container = $id('steps');
  container.replaceChildren();
  const domainLabels = {
    nonnegative: '\\ge 0',
    nonpositive: '\\le 0',
    zero: '= 0',
    free: '\\in\\mathbb{R}'
  };
  const domainDescription = result.variables
    .map(variable => `\\(${variable} ${domainLabels[obj.variableDomains?.[variable] || 'nonnegative']}\\)`)
    .join(', ');
  const objectiveName = obj.objectiveName || 'Z';
  const overview = document.createElement('article');
  overview.className = 'step-card graphical-method';
  overview.innerHTML = `<h3>Método gráfico: intersecciones y vértices</h3>
    <p><strong>Dominios:</strong> ${domainDescription}.</p>
    <p>Se consideran las fronteras de las restricciones y las fronteras de los dominios seleccionados. Se calculan sus intersecciones, se conservan los puntos que cumplen todas las restricciones y dominios, y se evalúa la función objetivo en cada vértice factible.</p>`;
  container.appendChild(overview);

  if(!result.feasibleVertices.length){
    overview.insertAdjacentHTML('beforeend', '<p><strong>No se encontró ningún vértice factible para los dominios y restricciones seleccionados.</strong></p>');
  }

  container.appendChild(renderGraphicalIntersectionProcedure(result));

  const note = document.createElement('p');
  note.innerHTML = `<strong>Función objetivo:</strong> ${obj.sense === 'min' ? 'Minimizar' : 'Maximizar'} \\(${objectiveName}\\). Se evaluó en los ${result.feasibleVertices.length} vértices factibles.`;
  container.appendChild(note);
  if(result.unbounded){
    const warning = document.createElement('p');
    warning.className = 'verification-box warning';
    warning.textContent = 'La función objetivo puede mejorar indefinidamente dentro de la región factible; no existe un óptimo finito.';
    container.appendChild(warning);
  } else if(result.optimalVertices.length > 1){
    const multiple = document.createElement('p');
    multiple.textContent = 'Hay óptimos alternativos: la función objetivo alcanza el mismo valor en más de un vértice factible.';
    container.appendChild(multiple);
  }

  const table = document.createElement('table');
  table.className = 'simplex-table graphical-vertices';
  table.innerHTML = `<thead><tr><th>Intersección</th><th>\\(${simplexNameToLatex(result.variables[0])}\\)</th><th>\\(${simplexNameToLatex(result.variables[1])}\\)</th><th>${objectiveName}</th><th>Estado</th></tr></thead>`;
  const body = document.createElement('tbody');
  if(!result.intersections.length){
    body.innerHTML = '<tr><td colspan="5">No se generaron intersecciones.</td></tr>';
  } else {
    result.intersections.forEach((point, index) => {
      const row = document.createElement('tr');
      if(point.feasible && result.optimalVertices.includes(point)) row.className = 'graphical-optimum';
      row.innerHTML = `<td>\\(V_{${index + 1}}\\)</td><td>\\(${formatNum(point.x)}\\)</td><td>\\(${formatNum(point.y)}\\)</td><td>${point.feasible ? `\\(${formatNum(point.objective)}\\)` : '—'}</td><td>${point.feasible ? result.optimalVertices.includes(point) ? 'Óptimo' : 'Factible' : 'No factible'}</td>`;
      body.appendChild(row);
    });
  }
  table.appendChild(body);
  container.appendChild(table);
  typesetMath([container]);
}

function renderGraphicalVerification(result, obj){
  const target = $id('verification');
  if(!target) return;
  if(!result.feasibleVertices.length){
    target.className = 'verification-box error';
    target.textContent = 'No se encontró ningún vértice factible para los signos y restricciones seleccionados.';
  } else if(result.unbounded){
    target.className = 'verification-box warning';
    target.textContent = 'La región factible permite mejorar la función objetivo indefinidamente; no existe solución óptima finita.';
  } else {
    const optimum = result.optimum;
    const variableValues = result.variables.map((variable, index) => {
      const value = index === 0 ? optimum.x : optimum.y;
      const domain = obj.variableDomains?.[variable] || 'nonnegative';
      const domainSymbol = {nonnegative: '\\ge 0', nonpositive: '\\le 0', zero: '= 0', free: '\\in\\mathbb{R}'}[domain];
      const meetsDomain = domain === 'nonnegative'
        ? rationalCompare(value, 0) >= 0
        : domain === 'nonpositive' ? rationalCompare(value, 0) <= 0
          : domain === 'zero' ? rationalIsZero(value) : true;
      return `\\(${variable} = ${formatNum(value)}\\;(${formatDecimal(value)}),\\quad ${domainSymbol}\\) — ${meetsDomain ? 'cumple' : 'no cumple'}`;
    }).join(', ');
    target.className = 'verification-box ok';
    target.innerHTML = `<strong>Solución óptima por método gráfico.</strong><p>${variableValues}</p><p>\\(${obj.objectiveName || 'Z'} = ${formatNum(optimum.objective)}\\;(${formatDecimal(optimum.objective)})\\)</p>`;
  }
  typesetMath([target]);
}

function plotGraphicalModel(obj, constraints, result){
  const graph = initSimplexDesmos();
  const plot = $id('plot');
  if(!graph){
    if(plot) plot.textContent = 'No se pudo cargar Desmos para dibujar la región factible.';
    return;
  }
  const [x, y] = result.variables;
  const axis = Math.max(10, ...result.intersections.map(point => Math.max(Math.abs(Number(point.x)), Math.abs(Number(point.y)))));
  const bound = Math.ceil(axis * 1.25);
  const domain = variable => obj.variableDomains?.[variable] || 'nonnegative';
  const lowerBound = variable => ['nonpositive', 'free'].includes(domain(variable)) ? -bound : -1;
  const upperBound = variable => domain(variable) === 'nonpositive' || domain(variable) === 'zero' ? 1 : bound;
  graph.setBlank();
  graph.setMathBounds({
    left: lowerBound(x),
    right: upperBound(x),
    bottom: lowerBound(y),
    top: upperBound(y)
  });
  [x, y].forEach(variable => {
    const restriction = {
      nonnegative: `${variable}\\ge0`,
      nonpositive: `${variable}\\le0`,
      zero: `${variable}=0`
    }[domain(variable)];
    if(restriction) graph.setExpression({
      id: `graphical-domain-${variable}`,
      latex: restriction,
      color: '#64748b',
      fillOpacity: domain(variable) === 'zero' ? 0 : 0.03
    });
  });
  constraints.forEach((constraint, index) => {
    const a = constraint.coeffs[x] || rational(0);
    const b = constraint.coeffs[y] || rational(0);
    if(rationalIsZero(a) && rationalIsZero(b)) return;
    const left = desmosTerm(a, x);
    const right = desmosTerm(b, y);
    const expression = [left, right].filter(Boolean).join('+').replace(/\+\-/g, '-');
    const operator = constraint.op === '<=' ? '\\le' : constraint.op === '>=' ? '\\ge' : '=';
    graph.setExpression({
      id: `graphical-constraint-${index}`,
      latex: `${expression}${operator}${formatNum(constraint.rhs)}`,
      color: '#2563eb',
      fillOpacity: constraint.op === '=' ? 0 : 0.08,
      lineOpacity: 0.9
    });
  });
  const objective = [obj.coeffs[x] || rational(0), obj.coeffs[y] || rational(0)];
  const objectiveExpression = objective.map((coefficient, index) => desmosTerm(coefficient, result.variables[index]))
    .filter(Boolean).join('+').replace(/\+\-/g, '-');
  if(result.optimum && !result.unbounded){
    graph.setExpression({
      id: 'graphical-objective',
      latex: `${objectiveExpression}=${formatNum(result.optimum.objective)}`,
      color: '#dc2626',
      lineWidth: 3,
      showLabel: true,
      label: `Óptimo ${obj.objectiveName || 'Z'}`
    });
  }
  result.feasibleVertices.forEach((point, index) => {
    const optimal = result.optimalVertices.includes(point);
    graph.setExpression({
      id: `graphical-vertex-${index}`,
      latex: `(${formatNum(point.x)},${formatNum(point.y)})`,
      color: optimal ? '#16a34a' : '#7c3aed',
      showLabel: true,
      label: optimal ? `Óptimo V${index + 1}` : `V${index + 1}`,
      labelSize: Desmos.LabelSizes.MEDIUM
    });
  });
}

function renderPreflightReport(report){
  const target = $id('preflight');
  if(!target) return;
  target.className = `verification-box ${report.ok ? 'ok' : 'error'}`;
  const messages = report.ok ? report.notes : report.issues;
  const readyMessage = report.notes.some(note => note.startsWith('Se aplicará el método gráfico'))
    ? 'Modelo listo para el método gráfico.'
    : 'Modelo listo para iterar.';
  target.innerHTML = `<strong>${report.ok ? readyMessage : 'El modelo necesita corrección.'}</strong><ul>${messages.map(message => `<li>${message}</li>`).join('')}</ul>`;
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
    <p><strong>Objetivo:</strong> \\(${obj.objectiveName || 'Z'} = ${objectiveSubstitution || '0'} = ${formatNum(z)}\\).</p>`;
  typesetMath([target]);
}

function constraintOperatorLatex(operator){
  return operator === '<=' ? '\\le' : operator === '>=' ? '\\ge' : '=';
}

function renderUnboundedVerification(objectiveName = 'Z'){
  const target = $id('verification');
  if(!target) return;
  target.className = 'verification-box warning';
  target.innerHTML = `<strong>No existe una solución óptima finita.</strong><br>La última variable entrante no tiene una fila saliente con coeficiente positivo; por ello ${objectiveName} puede crecer indefinidamente.`;
}

function renderInfeasibleVerification(method){
  const target = $id('verification');
  if(!target) return;
  target.className = 'verification-box error';
  target.innerHTML = method === 'dual-simplex'
    ? '<strong>El modelo no tiene solución factible.</strong><br>La fila con lado derecho negativo no ofrece un pivote que conserve la factibilidad dual; por tanto, las restricciones no pueden cumplirse simultáneamente.'
    : '<strong>El modelo no tiene solución factible.</strong><br>Al finalizar Gran M, una variable artificial conserva un valor positivo; por tanto, las restricciones no pueden cumplirse simultáneamente.';
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
  const indexedPrimalVariable = {x: 1, y: 2, z: 3}[name.toLowerCase()];
  if(indexedPrimalVariable) return `x_{${indexedPrimalVariable}}`;
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
  const objectiveName = state.objectiveName || 'Z';
  card.innerHTML = `<h3>Cambio de variables libres</h3>
    <p>Para aplicar el método símplex, cada variable libre se expresa como la diferencia de dos variables no negativas:</p>
    <div class="free-variable-equations">${substitutions.join('<br>')}</div>
    <h4>Modelo después de sustituir</h4>
    <div class="free-variable-model">
      <p><strong>${objectiveSense}:</strong> \\(${objectiveName} = ${objective}\\)</p>
      <ul>${transformedConstraints}</ul>
    </div>
    <p>Las variables transformadas quedan como columnas independientes no negativas; las columnas de holgura, exceso y artificial se agregan según cada restricción antes de iniciar las iteraciones.</p>`;
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
  const objectiveScale = phaseOne || (state.objectiveSense === 'min' && state.method !== 'dual-simplex') ? -1 : 1;
  const objectiveName = phaseOne ? 'r' : state.objectiveName || 'Z';
  const columns = 'c' + 'r'.repeat(state.vars.length + slackIndexes.length + 2);
  const headers = ['\\text{Variables básicas}', objectiveName, ...state.vars.map(simplexNameToLatex), ...slackIndexes.map(index => simplexNameToLatex(state.slackNames[index])), '\\text{Solución}'];
  let latex = `\\[\\begin{array}{${columns}} ${headers.join(' & ')} \\\\ \\hline `;

  const formatValues = (values, rowIndex) => values.map((value, columnIndex) => {
      const formatted = typeof value === 'number' || value instanceof Rational ? formatTableauNumber(value, state) : value;
      const pivotColumn = highlight
        ? displayTableauColumnIndex(state, highlight.enteringIndex, slackIndexes)
        : -1;
      return highlight && rowIndex === highlight.leavingRowIdx && columnIndex === pivotColumn
        ? `\\class{pivot-cell}{${formatted}}` : formatted;
    });
  const objectiveValues = [
    objectiveName,
    1,
    ...state.objRow.coeffs.map(value => rationalMultiply(value, objectiveScale)),
    ...orderedSlackValues(state.objRow.slack, slackIndexes).map(value => rationalMultiply(value, objectiveScale)),
    rationalMultiply(state.objRow.rhs, objectiveScale)
  ];
  latex += `${formatValues(objectiveValues, -1).join(' & ')} \\\\ \\hline `;
  state.tableau.forEach((row, rowIndex) => {
    const values = [simplexNameToLatex(row.basic), 0, ...row.coeffs, ...orderedSlackValues(row.slack, slackIndexes), row.rhs];
    latex += `${formatValues(values, rowIndex).join(' & ')} \\\\ `;
  });
  latex += `\\end{array}\\]`;
  return latex;
}

function renderObjectivePreparation(container, preparation, state, heading = 'Preparación de la fila objetivo'){
  const section = document.createElement('article');
  section.className = 'step-card objective-preparation';
  section.innerHTML = `<h3>${heading}</h3>`;
  const before = document.createElement('div');
  before.className = 'simplex-table';
  before.innerHTML = tableToLatexWithHighlight(preparation.before);
  section.appendChild(before);

  if(!preparation.operations.length){
    const note = document.createElement('p');
    note.textContent = 'La fila objetivo ya está en forma canónica respecto a las variables básicas; no se requieren operaciones antes de iterar.';
    section.appendChild(note);
  } else {
    const objectiveScale = state.method === 'two-phase' && state.phase === 1 || state.objectiveSense === 'min' ? -1 : 1;
    const objectiveName = state.method === 'two-phase' && state.phase === 1 ? 'r' : state.objectiveName || 'Z';
    preparation.operations.forEach(operation => {
      const displayFactor = rationalMultiply(operation.factor, objectiveScale);
      const rowOperation = document.createElement('p');
      rowOperation.innerHTML = `<strong>Eliminar el coeficiente de la variable básica ${simplexNameToLatex(operation.before.tableau[operation.rowIndex].basic)}:</strong><br>\\(${objectiveName} \\leftarrow ${objectiveName} - (${formatTableauNumber(displayFactor, state)})R_{${operation.rowIndex + 1}}\\)`;
      section.appendChild(rowOperation);

      const result = document.createElement('div');
      result.className = 'simplex-table';
      result.innerHTML = tableToLatexWithHighlight(operation.after);
      section.appendChild(result);
    });
  }

  container.appendChild(section);
}

function dualConstraintToLatex(constraint){
  const lhs = linearCombinationToLatex(Object.entries(constraint.coeffs).map(([variable, coefficient]) => ({
    variable,
    coefficient
  })));
  const operator = constraint.op === '<=' ? '\\le' : constraint.op === '>=' ? '\\ge' : '=';
  return `${lhs} ${operator} ${formatNum(constraint.rhs)}`;
}

function renderDualSimplexPreparation(container, preparation, state){
  const section = document.createElement('article');
  section.className = 'step-card phase-card';
  const originalObjective = Object.entries(state.objectiveCoeffs || {}).map(([variable, coefficient]) => ({
    variable,
    coefficient
  }));
  const workingObjective = state.objectiveSense === 'min'
    ? originalObjective.map(term => ({...term, coefficient: rationalNegate(term.coefficient)}))
    : originalObjective;
  const workingObjectiveName = state.objectiveSense === 'min'
    ? `\\max(-${state.objectiveName || 'Z'})`
    : `\\max(${state.objectiveName || 'Z'})`;
  const workingObjectiveLatex = linearCombinationToLatex(workingObjective);
  const rows = (preparation || []).map((item, index) => {
    const transformation = item.negated
      ? `Multiplicar por \\(-1\\); al multiplicar una desigualdad por un número negativo, se invierte el signo: \\(-1\\cdot(${dualConstraintToLatex(item.source)})\\).`
      : 'Se conserva; ya está en forma \\(\\le\\).';
    return `<tr><td>R${index + 1}</td><td>\\(${dualConstraintToLatex(item.source)}\\)</td><td>${transformation}</td><td>\\(${dualConstraintToLatex(item.normalized)}\\)</td></tr>`;
  }).join('');
  const objectiveSense = state.objectiveSense === 'min' ? 'minimización' : 'maximización';
  section.innerHTML = `<h3>Preparación del modelo para Símplex dual</h3>
    <p>Partimos de una base de holguras. Las restricciones \\(\\ge\\) se multiplican por \\(-1\\) y cambian a \\(\\le\\); las que ya son \\(\\le\\) se dejan igual. Las condiciones de no negatividad de las variables se conservan. Así se obtiene una tabla inicial con lados derechos posiblemente negativos.</p>
    <div class="simplex-table"><table class="dual-preparation-table">
      <thead><tr><th>Fila</th><th>Restricción original</th><th>Transformación</th><th>Fila para la tabla</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <p>Se agrega una holgura \\(s_i\\ge0\\) por fila. Como aquí los lados derechos negativos hacen que la base inicial no sea factible, el método conserva la factibilidad dual: en la fila objetivo de trabajo los costos reducidos deben ser no negativos. Para este modelo, la función de trabajo es \\(${workingObjectiveName}=${workingObjectiveLatex}\\); si el problema original es de minimización, se maximiza su opuesto y al final se recupera el valor original.</p>
    <p><strong>Regla de salida:</strong> elegir la fila \\(r\\) con el lado derecho \\(b_r\\) más negativo. <strong>Regla de entrada:</strong> solo son candidatas las columnas no básicas con \\(a_{rj}<0\\); para ellas calcular \\(\\theta_j=\\frac{\\bar c_j}{-a_{rj}}\\) y elegir la razón mínima no negativa. El pivote es \\(a_{rj}\\) en la intersección de esa fila y columna. Después se aplica Gauss–Jordan: \\(R_r\\leftarrow R_r/a_{rj}\\) y, para cada \\(i\\ne r\\), \\(R_i\\leftarrow R_i-a_{ij}R_r\\); así el pivote queda en 1 y los demás valores de su columna en 0. Se repite hasta que todos los lados derechos sean \\(\\ge0\\), o se declara infactibilidad si no hay columna elegible.</p>`;
  container.appendChild(section);
}

function renderDualPivotSelection(card, step){
  const row = step.before.tableau[step.operation.leavingRowIdx];
  const leaving = simplexNameToLatex(row.basic);
  const candidates = (step.candidates || []).map(candidate => {
    const ratio = candidate.eligible
      ? `\\(${formatNum(candidate.reducedCost)}/(${formatNum(rationalNegate(candidate.coefficient))})=${formatNum(candidate.ratio)}\\)`
      : 'No elegible: \\(a_{rj}\\ge0\\)';
    return `<tr><td>\\(${simplexNameToLatex(candidate.name)}\\)</td><td>\\(${formatNum(candidate.coefficient)}\\)</td><td>\\(${formatNum(candidate.reducedCost)}\\)</td><td>${ratio}</td><td>${candidate.columnIndex === step.operation.enteringIndex ? '<strong>Elegida: razón mínima</strong>' : candidate.eligible ? 'Elegible' : '—'}</td></tr>`;
  }).join('');
  const section = document.createElement('section');
  section.className = 'revised-check';
  section.innerHTML = `<h4>Elección del pivote</h4>
    <p>La fila saliente es la de \\(${leaving}\\), con el lado derecho más negativo: \\(b_r=${formatNum(row.rhs)}\\). En esa fila, las candidatas deben tener \\(a_{rj}<0\\); así el pivote puede aumentar el lado derecho sin perder la factibilidad dual.</p>
    <p>Para cada candidata se usa \\(\\theta_j=\\frac{\\bar c_j}{-a_{rj}}\\), donde \\(\\bar c_j\\) es el coeficiente de la variable en la fila objetivo. Se elige el menor \\(\\theta_j\\) no negativo; esa columna entra y su elemento \\(a_{rj}\\) es el pivote.</p>
    <div class="simplex-table"><table class="dual-preparation-table">
      <thead><tr><th>Columna</th><th>\\(a_{rj}\\)</th><th>\\(\\bar c_j\\)</th><th>Razón \\(\\theta_j\\)</th><th>Decisión</th></tr></thead>
      <tbody>${candidates}</tbody>
    </table></div>`;
  card.appendChild(section);
}

function renderStepsLatex(steps, obj, constraints){
  const container = $id('steps');
  container.innerHTML = '';
  if(!steps.length) return;

  const initial = steps[0].state;
  renderFreeVariableTransformation(container, initial, obj, constraints);
  if(initial.method === 'dual-simplex') renderDualSimplexPreparation(container, steps[0].preparation, initial);
  if(steps[0].preparation && initial.method !== 'dual-simplex') renderObjectivePreparation(container, steps[0].preparation, initial);
  container.insertAdjacentHTML('beforeend', '<h3>Tabla inicial para las iteraciones</h3>');
  if(initial.method !== 'two-phase' && initial.slackNames.some(name => /^A\d+$/.test(name))){
    container.insertAdjacentHTML('beforeend', `<p class="big-m-objective"><strong>Función penalizada:</strong> \\(${initial.objectiveName || 'Z'} = ${bigMObjectiveFormula(initial)}\\)</p>`);
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
      phaseCard.innerHTML = '<h3>Fase II</h3><p>Se eliminan las variables artificiales de la función objetivo y se restaura la función original. A continuación se prepara la fila objetivo para la base actual.</p>';
      if(step.preparation) renderObjectivePreparation(phaseCard, step.preparation, step.state, 'Preparación de la fila objetivo de la Fase II');
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
      const objectiveName = step.state.objectiveName || 'Z';
      warning.innerHTML = `<h3>Comprobación de no acotación</h3><p>La columna de <strong>${enteringLatex}</strong> sigue mejorando ${objectiveName}, pero no contiene coeficientes positivos en las restricciones. No hay razón mínima ni fila saliente.</p><p>Por tanto, ${enteringLatex} puede aumentar y ${objectiveName} crece indefinidamente.</p>`;
      const table = document.createElement('div');
      table.className = 'simplex-table';
      table.innerHTML = tableToLatexWithHighlight(step.state);
      warning.appendChild(table);
      container.appendChild(warning);
      return;
    }
    if(step.type === 'dual-infeasible'){
      const warning = document.createElement('article');
      warning.className = 'step-card simplex-unbounded';
      warning.innerHTML = `<h3>Modelo infactible</h3><p>La fila de ${simplexNameToLatex(step.state.tableau[step.leavingRowIdx].basic)} tiene lado derecho negativo y no contiene coeficientes negativos que permitan un pivote dual. No existe una solución factible.</p>`;
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
    const phaseLabel = before.method === 'dual-simplex'
      ? 'Símplex dual'
      : step.phase
      ? `Fase ${step.phase}`
      : before.method === 'simplex' ? 'Símplex' : 'Gran M';
    const objectiveName = before.objectiveName || 'Z';
    const pivotExplanation = before.method === 'dual-simplex'
      ? `Sale <strong>${leavingLatex}</strong>, que tiene el lado derecho más negativo. Entra <strong>${enteringLatex}</strong> porque su razón dual es la menor entre las columnas elegibles.`
      : `Entra <strong>${enteringLatex}</strong> (coeficiente negativo en ${objectiveName}) y sale <strong>${leavingLatex}</strong> (menor razón positiva).`;
    card.innerHTML = `<h3>${phaseLabel}: Iteración ${index + 1}</h3>
      <p>${pivotExplanation}</p>
      <p><strong>Pivote:</strong> fila ${operation.leavingRowIdx + 1}, columna ${entering}, valor ${formatNum(operation.pivot)}.</p>`;
    if(before.method === 'dual-simplex') renderDualPivotSelection(card, step);
    const highlighted = document.createElement('div');
    highlighted.className = 'simplex-table';
    highlighted.innerHTML = tableToLatexWithHighlight(before, operation);
    card.appendChild(highlighted);

    let operations = `\\(R_{${operation.leavingRowIdx + 1}} \\leftarrow \\frac{R_{${operation.leavingRowIdx + 1}}}{${formatNum(operation.pivot)}}\\)`;
    operation.factors.forEach((factor, rowIndex) => {
      if(!rationalIsZero(factor || 0)) operations += `<br>\\(R_{${rowIndex + 1}} \\leftarrow R_{${rowIndex + 1}} - (${formatNum(factor)})R_{${operation.leavingRowIdx + 1}}\\)`;
    });
    if(!rationalIsZero(operation.objectiveFactor || 0)) operations += `<br>\\(${objectiveName} \\leftarrow ${objectiveName} - (${formatNum(operation.objectiveFactor)})R_{${operation.leavingRowIdx + 1}}\\)`;
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
  if(finalStep.type === 'unbounded' || finalStep.type === 'dual-infeasible'){
    typesetMath([container]);
    return;
  }
  const solution = computeSolutionFromTable(finalStep.after || finalStep.state);
  const solutionEl = document.createElement('div');
  solutionEl.className = solution.infeasible ? 'simplex-solution simplex-unbounded' : 'simplex-solution';
  solutionEl.innerHTML = solution.infeasible
    ? '<h3>Modelo infactible</h3><p>La Fase I/penalización conserva una variable artificial positiva. No se puede aceptar esta tabla como solución del problema original.</p>'
    : `<h3>Solución óptima</h3><p><strong>Fracción (decimal):</strong> ${solution.vars.map(item => `\\(${simplexNameToLatex(item.var)} = ${formatNum(item.value)}\\;(${formatDecimal(item.value)})\\)`).join(', ')}<br>\\(${initial.objectiveName || 'Z'} = ${formatNum(solution.Z)}\\;(${formatDecimal(solution.Z)})\\)</p>`;
  container.appendChild(solutionEl);
  typesetMath([container]);
}

function revisedMatrixLatex(matrix, rowCount, columnCount){
  const rows = Array.from({length: rowCount}, (_, rowIndex) =>
    Array.from({length: columnCount}, (_, columnIndex) =>
      formatNum(matrix[rowIndex]?.[columnIndex] ?? rational(0))
    ).join(' & ')
  );
  return `\\begin{bmatrix}${rows.map(row => row || '\\,').join(' \\\\ ')}\\end{bmatrix}`;
}

function revisedVectorLatex(values, columnVector = false){
  const entries = values.map(value => typeof value === 'string' ? value : formatNum(value));
  return `\\begin{bmatrix}${entries.join(columnVector ? ' \\\\ ' : ' & ') || '\\,'}\\end{bmatrix}`;
}

function renderRevisedSteps(steps){
  const container = $id('steps');
  container.replaceChildren();
  steps.forEach(step => {
    if(step.type === 'revised-phase'){
      const transition = document.createElement('article');
      transition.className = 'step-card phase-card';
      transition.innerHTML = `<h3>Fase II</h3><p>${step.message}</p>`;
      container.appendChild(transition);
      return;
    }
    const card = document.createElement('article');
    card.className = 'step-card revised-iteration';
    const phaseName = step.phase === 1 ? 'Fase I: encontrar una base factible' : 'Fase II: optimizar el objetivo original';
    const basicNames = step.state.tableau.map(row => row.basic);
    const nonbasicNames = step.nonbasic.map(index =>
      index < step.state.vars.length ? step.state.vars[index] : step.state.slackNames[index - step.state.vars.length]
    );
    const variableNames = [...step.state.vars, ...step.state.slackNames];
    const columnCount = variableNames.length;
    card.innerHTML = `<h3>Símplex revisado — ${phaseName}, iteración ${step.iteration}</h3>
      <p>Base actual \\(B=[${basicNames.map(simplexNameToLatex).join(', ')}]\\).</p>`;

    if(step.cleanup.length){
      const cleanup = document.createElement('p');
      cleanup.className = 'phase-heading';
      cleanup.innerHTML = `<strong>Ajuste de base al terminar la Fase I:</strong><br>${step.cleanup.join('<br>')}`;
      card.appendChild(cleanup);
    }

    const matrices = document.createElement('div');
    matrices.className = 'revised-matrices';
    matrices.innerHTML = `<h4>Matrices de la iteración</h4>
      <p><strong>\\(A\\)</strong> (columnas \\(${variableNames.map(simplexNameToLatex).join(', ')}\\))</p>
      \\[${revisedMatrixLatex(step.A, step.A.length, columnCount)}\\]
      <p><strong>\\(B\\)</strong> (columnas básicas \\(${basicNames.map(simplexNameToLatex).join(', ')}\\))</p>
      \\[${revisedMatrixLatex(step.B, step.B.length, step.B.length)}\\]
      <p><strong>\\(A_j\\)</strong> (columnas no básicas \\(${nonbasicNames.map(simplexNameToLatex).join(', ') || '\\varnothing'}\\))</p>
      \\[${revisedMatrixLatex(step.A_j, step.A.length, nonbasicNames.length)}\\]
      <p><strong>\\(B^{-1}\\)</strong></p>
      \\[${revisedMatrixLatex(step.B_inverse, step.B_inverse.length, step.B_inverse.length)}\\]
      <p><strong>\\(b\\)</strong></p>\\[${revisedVectorLatex(step.b, true)}\\]
      <p><strong>\\(B^{-1}b=x_B\\)</strong></p>\\[${revisedVectorLatex(step.x_B, true)}\\]
      <p><strong>\\(C\\)</strong> (orden de columnas de \\(A\\))</p>\\[${revisedVectorLatex(step.C)}\\]
      <p><strong>\\(C_B\\)</strong> (orden de filas de \\(B\\))</p>\\[${revisedVectorLatex(step.C_B)}\\]
      <p><strong>\\(C_j\\)</strong> (orden de columnas de \\(A_j\\))</p>\\[${revisedVectorLatex(step.C_j)}\\]`;
    if(step.phase === 2 && step.state.slackNames.some(name => /^A\d+$/.test(name))){
      matrices.insertAdjacentHTML('beforeend', '<p>En la Fase II, las columnas artificiales se excluyen de \\(A_j\\) para que no puedan volver a entrar a la base.</p>');
    }
    card.appendChild(matrices);

    const check = document.createElement('section');
    check.className = 'revised-check';
    check.innerHTML = `<h4>Fase 1 de la iteración: costos reducidos y variable entrante</h4>
      <p>\\(C_B B^{-1}A_j-C_j = ${revisedVectorLatex(step.reducedCosts)}\\)</p>`;
    if(step.decision === 'optimal'){
      check.insertAdjacentHTML('beforeend', '<p>No quedan costos reducidos negativos entre las columnas elegibles; se alcanza el óptimo de esta fase.</p>');
    } else if(step.decision === 'infeasible'){
      check.insertAdjacentHTML('beforeend', `<p>La suma mínima de artificiales no es cero (valor de Fase I: \\(${formatNum(step.state.objRow.rhs)}\\)); el modelo es infactible.</p>`);
    } else if(step.decision === 'unbounded'){
      check.insertAdjacentHTML('beforeend', '<p>La variable entrante no tiene coeficientes positivos en \\(B^{-1}A_k\\); el problema es no acotado.</p>');
    } else {
      const enteringName = step.enteringIndex < step.state.vars.length
        ? step.state.vars[step.enteringIndex]
        : step.state.slackNames[step.enteringIndex - step.state.vars.length];
      check.insertAdjacentHTML('beforeend', `<p>Entra \\(${simplexNameToLatex(enteringName)}\\), cuyo costo reducido es negativo.</p>`);
    }
    card.appendChild(check);

    if(step.decision === 'pivot'){
      const enteringName = step.enteringIndex < step.state.vars.length
        ? step.state.vars[step.enteringIndex]
        : step.state.slackNames[step.enteringIndex - step.state.vars.length];
      const direction = revisedMatrixMultiply(step.B_inverse,
        step.A.map(row => [row[step.enteringIndex]])).map(row => row[0]);
      const ratios = step.ratios.map((ratio, index) =>
        ratio === null
          ? '\\text{no elegible}'
          : `\\frac{${formatNum(step.state.tableau[index].rhs)}}{${formatNum(direction[index])}}=${formatNum(ratio)}`
      );
      const ratioCard = document.createElement('section');
      ratioCard.className = 'revised-check';
      ratioCard.innerHTML = `<h4>Fase 2 de la iteración: razón mínima</h4>
        <p>\\(d=B^{-1}A_k=${revisedVectorLatex(direction, true)}\\), con \\(A_k=A_{${simplexNameToLatex(enteringName)}}\\).</p>
        <p>\\(x_B/d = ${revisedVectorLatex(ratios)}\\).</p>
        <p>Sale \\(${simplexNameToLatex(step.state.tableau[step.leavingRowIndex].basic)}\\); se actualiza la base y se recalculan las matrices en la siguiente iteración.</p>`;
      card.appendChild(ratioCard);
    }
    container.appendChild(card);
  });

  const finalStep = [...steps].reverse().find(step => step.state);
  if(finalStep){
    const solution = computeSolutionFromTable(finalStep.state);
    const result = document.createElement('div');
    result.className = solution.infeasible ? 'simplex-solution simplex-unbounded' : 'simplex-solution';
    result.innerHTML = solution.infeasible
      ? '<h3>Modelo infactible</h3><p>La Fase I no pudo eliminar el valor positivo de las variables artificiales.</p>'
      : `<h3>Solución ${finalStep.decision === 'unbounded' ? 'no acotada' : 'óptima'}</h3><p>${solution.vars.map(item =>
        `\\(${simplexNameToLatex(item.var)}=${formatNum(item.value)}\\;(${formatDecimal(item.value)})\\)`
      ).join(', ')}<br>\\(${finalStep.state.objectiveName || 'Z'}=${formatNum(solution.Z)}\\;(${formatDecimal(solution.Z)})\\)</p>`;
    container.appendChild(result);
  }
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
  if(rationalIsZero(coefficient)) return '';
  if(rationalCompare(coefficient, 1) === 0) return variable;
  if(rationalCompare(coefficient, -1) === 0) return `-${variable}`;
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
    graph.setExpression({ id: 'objective', latex: `${lhs}=0`, color: '#dc2626', lineWidth: 3, showLabel: true, label: `${obj.objectiveName || 'Z'} = 0` });
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
