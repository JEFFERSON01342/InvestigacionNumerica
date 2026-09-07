// Render/parser/solver adapted for Programación Lineal page
// Based on assets/js/simplex.js with UI wiring to math-field elements

function $id(id){ return document.getElementById(id); }

// --- Parser and solver (same logic as simplex) ---
function normalizeMathExpression(raw){
  let text = (raw || '').toString().trim();
  text = text.replace(/\$\$/g, '').replace(/\$/g, '');
  text = text.replace(/\\left|\\right|\\text|\\mathrm|\\mathbf|\\mathit|\\mathsf|\\mathtt/g, ' ');
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
  const term = token.trim().replace(/\s+/g, '');
  if(!term) return;
  const match = term.match(/^([+-]?\d*\.?\d*)([A-Za-z][A-Za-z0-9]*)?$/i);
  if(!match) {
    const spaced = term.match(/^([+-]?\d*\.?\d*)\s*([A-Za-z][A-Za-z0-9]*)$/i);
    if(spaced){
      const coefficient = parseFloat(spaced[1] || '1');
      const variable = spaced[2].toLowerCase();
      coeffs[variable] = (coeffs[variable] || 0) + coefficient;
      return;
    }
    throw new Error('Término inválido: ' + token);
  }
  let numPart = match[1];
  if(numPart === '' || numPart === '+') numPart = '1';
  if(numPart === '-') numPart = '-1';
  const variable = (match[2] || '').toLowerCase();
  if(!variable){
    return;
  }
  coeffs[variable] = (coeffs[variable] || 0) + parseFloat(numPart);
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
    const rhs = parseFloat(rhsText);
    if(!Number.isFinite(rhs)) throw new Error('Lado derecho inválido en: ' + line);
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
  const originalVars = collectVars(obj, constraints);
  const freeVariables = obj.variableDomain === 'free';
  const vars = freeVariables
    ? originalVars.flatMap(variable => [`${variable}+`, `${variable}-`])
    : originalVars.slice();
  const variableMap = Object.fromEntries(originalVars.map((variable, index) => [
    variable,
    freeVariables ? { positive: index * 2, negative: index * 2 + 1 } : { positive: index, negative: null }
  ]));
  const m = constraints.length;
  const n = vars.length;
  const slackNames = [];
  const rows = [];
  const artificialColumns = [];
  const normalizedConstraints = constraints.map(constraint => {
    if(constraint.rhs >= 0) return {...constraint, coeffs: {...constraint.coeffs}};
    const reversed = { '<=': '>=', '>=': '<=', '=': '=' }[constraint.op];
    return {
      op: reversed,
      rhs: -constraint.rhs,
      coeffs: Object.fromEntries(Object.entries(constraint.coeffs).map(([variable, coefficient]) => [variable, -coefficient]))
    };
  });

  normalizedConstraints.forEach((constraint, rowIndex) => {
    const row = new Array(n).fill(0);
    originalVars.forEach(variable => {
      const coefficient = constraint.coeffs[variable] || 0;
      const mapping = variableMap[variable];
      row[mapping.positive] = coefficient;
      if(mapping.negative !== null) row[mapping.negative] = -coefficient;
    });
    let basic;
    if(constraint.op === '<='){
      basic = `S${rowIndex + 1}`;
      slackNames.push(basic);
      rows.push({ coeffs: row, extra: [{name: basic, value: 1}], rhs: constraint.rhs, basic });
    } else if(constraint.op === '>='){
      const excess = `E${rowIndex + 1}`;
      const artificial = `A${rowIndex + 1}`;
      slackNames.push(excess, artificial);
      artificialColumns.push(slackNames.length - 1);
      rows.push({
        coeffs: row,
        extra: [{name: excess, value: -1}, {name: artificial, value: 1}],
        rhs: constraint.rhs,
        basic: artificial
      });
    } else {
      const artificial = `A${rowIndex + 1}`;
      slackNames.push(artificial);
      artificialColumns.push(slackNames.length - 1);
      rows.push({ coeffs: row, extra: [{name: artificial, value: 1}], rhs: constraint.rhs, basic: artificial });
    }
  });

  const extraCount = slackNames.length;
  const tableau = rows.map(row => {
    const slack = new Array(extraCount).fill(0);
    row.extra.forEach(item => { slack[slackNames.indexOf(item.name)] = item.value; });
    return { coeffs: row.coeffs.slice(), slack, rhs: row.rhs, basic: row.basic };
  });

  const objectiveDirection = obj.sense === 'min' ? -1 : 1;
  const cvec = originalVars.flatMap(variable => {
    const coefficient = objectiveDirection * (obj.coeffs[variable] || 0);
    return freeVariables ? [coefficient, -coefficient] : [coefficient];
  });
  const bigM = 1000000;
  const objRow = {
    coeffs: cvec.map(value => -value),
    slack: new Array(extraCount).fill(0),
    rhs: 0,
    basic: 'Z'
  };
  artificialColumns.forEach(column => { objRow.slack[column] = bigM; });
  tableau.forEach((row, rowIndex) => {
    if(!artificialColumns.includes(slackNames.indexOf(row.basic))) return;
    const factor = objRow.slack[slackNames.indexOf(row.basic)];
    objRow.coeffs = objRow.coeffs.map((value, column) => value - factor * row.coeffs[column]);
    objRow.slack = objRow.slack.map((value, column) => value - factor * row.slack[column]);
    objRow.rhs -= factor * row.rhs;
  });
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
    freeVariables,
    objectiveVector: Object.fromEntries(vars.map((variable, index) => [variable, cvec[index]]))
  };
}

function cloneTableauState(vars, slackNames, tableau, objRow, metadata = {}){ return { vars: vars.slice(), slackNames: slackNames.slice(), tableau: tableau.map(r=>({coeffs:r.coeffs.slice(), slack:r.slack.slice(), rhs:r.rhs, basic:r.basic})), objRow: {coeffs: objRow.coeffs.slice(), slack: objRow.slack.slice(), rhs: objRow.rhs, basic: objRow.basic}, ...metadata }; }

function findEntering(objRow){ let minVal=0, idx=-1; for(let j=0;j<objRow.coeffs.length;j++){ const v=objRow.coeffs[j]; if(v<minVal){ minVal=v; idx=j; } } return idx; }
function findLeaving(tableau, enteringIndex){ let bestRatio=Infinity, rowIdx=-1; for(let i=0;i<tableau.length;i++){ const aij=tableau[i].coeffs[enteringIndex]; if(aij>0){ const ratio=tableau[i].rhs/aij; if(ratio>=0 && ratio<bestRatio){ bestRatio=ratio; rowIdx=i; } } } return rowIdx; }
function pivotOn(state, enteringIndex, leavingRowIdx){ const T=state.tableau; const row=T[leavingRowIdx]; const pivot=row.coeffs[enteringIndex]; // prepare op info
  const opInfo = { enteringIndex, leavingRowIdx, pivot: pivot, normalizedRow: null, factors: [] };
  // normalize pivot row
  const normCoeffs = row.coeffs.map(v=> v / pivot);
  const normSlack = row.slack.map(v=> v / pivot);
  const normRhs = row.rhs / pivot;
  opInfo.normalizedRow = { coeffs: normCoeffs.slice(), slack: normSlack.slice(), rhs: normRhs };
  // replace pivot row with normalized
  for(let j=0;j<row.coeffs.length;j++) row.coeffs[j]=normCoeffs[j];
  for(let j=0;j<row.slack.length;j++) row.slack[j]=normSlack[j];
  row.rhs = normRhs;
  // eliminate other rows
  for(let i=0;i<T.length;i++){ if(i===leavingRowIdx) continue; const factor=T[i].coeffs[enteringIndex]; opInfo.factors[i]=factor; if(factor===0) continue; for(let j=0;j<T[i].coeffs.length;j++) T[i].coeffs[j]=T[i].coeffs[j]-factor*row.coeffs[j]; for(let j=0;j<T[i].slack.length;j++) T[i].slack[j]=T[i].slack[j]-factor*row.slack[j]; T[i].rhs=T[i].rhs-factor*row.rhs; }
  // update objective row
  const f=state.objRow.coeffs[enteringIndex]; if(f!==0){ for(let j=0;j<state.objRow.coeffs.length;j++) state.objRow.coeffs[j]=state.objRow.coeffs[j]-f*row.coeffs[j]; for(let j=0;j<state.objRow.slack.length;j++) state.objRow.slack[j]=state.objRow.slack[j]-f*row.slack[j]; state.objRow.rhs=state.objRow.rhs - f*row.rhs; }
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
function formatNum(x){ return Math.abs(x) < 1e-9 ? '0' : (+x.toFixed(6)).toString(); }
function tableToLatex(st){ const nvars=st.vars.length, mslack=st.slackNames.length; const cols = ['c'].concat(Array(nvars).fill('r')).concat(Array(mslack).fill('r')).concat(['r']); const colSpec=cols.join(''); let s='\\[\\begin{array}{'+colSpec+'}'; const headers=['\\mathrm{BV}'].concat(st.vars.map(v=>`$${v}$`)).concat(st.slackNames.map(sn=>`$${sn}$`)).concat(['$\\mathrm{RHS}$']); s+=headers.join(' & ') + ' \\\\ '; for(let i=0;i<st.tableau.length;i++){ const row=st.tableau[i]; const cells=[]; cells.push(`$${row.basic}$`); for(let j=0;j<row.coeffs.length;j++) cells.push(formatNum(row.coeffs[j])); for(let j=0;j<row.slack.length;j++) cells.push(formatNum(row.slack[j])); cells.push(formatNum(row.rhs)); s+=cells.join(' & ') + ' \\\\ \n'; } const or=st.objRow; const orcells=[]; orcells.push(`$${or.basic}$`); for(let j=0;j<or.coeffs.length;j++) orcells.push(formatNum(or.coeffs[j])); for(let j=0;j<or.slack.length;j++) orcells.push(formatNum(or.slack[j])); orcells.push(formatNum(or.rhs)); s+='\\\hline ' + orcells.join(' & ') + ' \\\\ \n'; s+='\\end{array}\\]'; return s; }

// Convert LaTeX input to ASCII for parser
function latexToAscii(s){ if(!s) return ''; let t=s; t=t.replace(/\\leq|\\le/g,' <= '); t=t.replace(/\\geq|\\ge/g,' >= '); t=t.replace(/<=|>=|=/g,m => ` ${m} `); t=t.replace(/\\cdot/g,'*'); t=t.replace(/\\times/g,'*'); t=t.replace(/\u2264/g,' <= '); t=t.replace(/\u2265/g,' >= '); t=t.replace(/([A-Za-z])\s*_\s*\{\s*(\d+)\s*\}/ig,'$1$2'); t=t.replace(/([A-Za-z])\s*_\s*(\d+)/ig,'$1$2'); t=t.replace(/(\d)([A-Za-z]\w*)/ig,'$1 $2'); t=t.replace(/\$/g,''); t=t.replace(/\s+/g,' '); return t.trim(); }

// UI: store constraints as LaTeX strings
const constraintsLatex = []; // LaTeX strings

// helper to create step cards in #steps
function appendStepCard(html){ const container = $id('steps'); const card = document.createElement('div'); card.className='step-card'; card.innerHTML = html; container.appendChild(card); }


function renderConstraintBracket(constraintsLatexLocal){ const el=$id('constraintBracket'); if(!constraintsLatexLocal.length){ el.innerHTML='\\(\\left\\{\\begin{array}{l} \\text{(vacío)}\\\\\\end{array}\\right.\\)'; if(window.MathJax) MathJax.typesetPromise(); return; } const body = constraintsLatexLocal.map(c=> c.replace(/\$/g,'')).join(' \\\\ '); const latex = `\\(\\left\\{\\begin{array}{l} ${body} \\\\ \\end{array}\\right.\\)`; el.innerHTML = latex; if(window.MathJax) MathJax.typesetPromise(); }
function renderInputDisplay(sense,objLatex,constraintsLatexLocal){ const el=$id('render-input'); el.innerHTML=''; const senseText = sense==='max'?'Maximizar':'Minimizar'; const p=document.createElement('div'); p.innerHTML = `<strong>${senseText} Z = </strong> $${objLatex || ''}$`; el.appendChild(p); const br=document.createElement('div'); br.innerHTML='<strong>Restricciones:</strong>'; el.appendChild(br); const list=document.createElement('div'); list.innerHTML = constraintsLatexLocal.map(c=>`$${c}$`).join('<br>'); el.appendChild(list); if(window.MathJax) MathJax.typesetPromise(); }

function renderStepsLatex(steps){ const container=$id('steps'); container.innerHTML=''; if(!steps || steps.length===0) return; const initial=steps[0]; const title0=document.createElement('h3'); title0.textContent='Tabla inicial'; container.appendChild(title0); const pre0=document.createElement('div'); pre0.innerHTML = tableToLatex(initial); container.appendChild(pre0); if(window.MathJax) MathJax.typesetPromise(); for(let s=1;s<steps.length;s++){ const st=steps[s]; const title=document.createElement('h3'); title.textContent = `Tabla ${s}`; container.appendChild(title); const beforeDiv=document.createElement('div'); beforeDiv.innerHTML = tableToLatex(steps[s-1]); container.appendChild(beforeDiv); const ops=document.createElement('div'); ops.innerHTML = `<strong>Operación:</strong> pivot aplicado.`; container.appendChild(ops); const afterDiv=document.createElement('div'); afterDiv.innerHTML = tableToLatex(st); container.appendChild(afterDiv); if(window.MathJax) MathJax.typesetPromise(); }
  // solution
  const last = steps[steps.length-1]; const sol = computeSolutionFromTable(last); const vdiv=document.createElement('div'); vdiv.innerHTML = '<h4>Solución</h4>' + sol.vars.map(s=>`$${s.var} = ${formatNum(s.value)}$`).join('<br>') + `<br> $Z = ${formatNum(sol.Z)}$`; container.appendChild(vdiv); if(window.MathJax) MathJax.typesetPromise(); }

function computeSolutionFromTable(st){
  const res=[];
  const originalVars = st.originalVars || st.vars;
  for(const variable of originalVars){
    const mapping = st.variableMap && st.variableMap[variable];
    const columns = mapping ? [st.vars[mapping.positive], st.vars[mapping.negative]].filter(Boolean) : [variable];
    const values = columns.map(column => {
      const row = st.tableau.find(item => item.basic === column);
      return row ? row.rhs : 0;
    });
    res.push({var: variable, value: values[0] - (values[1] || 0)});
  }
  const direction = st.objectiveDirection || 1;
  const infeasible = st.tableau.some(row => /^A\d+$/.test(row.basic) && Math.abs(row.rhs) > 1e-7);
  return {vars: res, Z: st.objRow.rhs * direction, infeasible};
}

// wire buttons to math-field inputs
function initPLUI(){ const objField = $id('objective-field'); const consField = $id('constraint-field'); const addBtn = $id('btn-add-constraint'); const clearConsBtn = $id('btn-clear-constraints'); const calcBtn = $id('btn-calc-pl'); const clearAllBtn = $id('btn-clear-all'); const status = $id('status'); renderConstraintBracket(constraintsLatex);

  addBtn.addEventListener('click', ()=>{ const raw = consField.value.trim(); if(!raw) return; constraintsLatex.push(raw); renderConstraintBracket(constraintsLatex); consField.value = ''; consField.focus(); if(typeof updatePlotFromInputs === 'function') updatePlotFromInputs(); });
  clearConsBtn.addEventListener('click', ()=>{ constraintsLatex.length = 0; renderConstraintBracket(constraintsLatex); $id('preflight').className='verification-box'; $id('preflight').textContent='Añade la función objetivo y las restricciones para comprobar el modelo.'; if(typeof simplexDesmos !== 'undefined' && simplexDesmos) simplexDesmos.setBlank(); });
  calcBtn.addEventListener('click', ()=>{ // calculate simplex
    // clear previous output and show processing
    $id('steps').innerHTML = '';
    // No vaciar #plot: Desmos conserva una instancia ligada a este elemento.
    status.textContent = 'Procesando...';
    try{
      const sense = document.querySelector('input[name="sense-pl"]:checked').value;
      const variableDomain = document.querySelector('input[name="variable-domain-pl"]:checked').value;
      const objLatex = objField.value.trim();
      console.log('Calcular Simplex triggered, objective:', objLatex, 'sense:', sense, 'constraints:', constraintsLatex);
      if(!objLatex) throw new Error('Ingrese la función objetivo.');
      const consL = constraintsLatex.slice();
      const objAscii = latexToAscii(objLatex);
      console.log('Objective ASCII:', objAscii);
      const obj = parseObjective((sense? sense+': ':'') + objAscii);
      obj.variableDomain = variableDomain;
      const consAsciiLines = consL.map(l=> latexToAscii(l));
      console.log('Constraints ASCII lines:', consAsciiLines);
      const parsedConstraints = parseConstraints(consAsciiLines.join('\n'));
      // x ≥ 0, y ≥ 0, ... ya son condiciones propias del simplex estándar;
      // no se agregan como filas artificiales de tipo ≥ al tableau.
      const implicitNonNegative = variableDomain === 'nonnegative'
        ? parsedConstraints.filter(constraint => typeof isImplicitNonNegativity === 'function' && isImplicitNonNegativity(constraint))
        : [];
      const cons = variableDomain === 'nonnegative'
        ? parsedConstraints.filter(constraint => !(typeof isImplicitNonNegativity === 'function' && isImplicitNonNegativity(constraint)))
        : parsedConstraints;
      console.log('Parsed constraints:', cons);
      const method = $id('method-pl') ? $id('method-pl').value : 'big-m';
      const preflight = validateSimplexModel(obj, cons, sense, method);
      if(implicitNonNegative.length) preflight.notes.push(`Se reconocieron ${implicitNonNegative.length} condición(es) de no negatividad implícita(s).`);
      renderPreflightReport(preflight);
      if(!preflight.ok) throw new Error('El modelo no puede resolverse con el simplex estándar. Revisa la comprobación previa.');
      const steps = method === 'two-phase' ? twoPhaseSteps(obj, cons) : simplexSteps(obj, cons);
      console.log('Simplex produced steps count:', steps.length);
      if(!steps || steps.length===0){ status.textContent='No se generaron pasos (revisar entrada).'; return; }
      renderStepsLatex(steps);
      const lastState = steps[steps.length - 1].after || steps[steps.length - 1].state;
      if(steps[steps.length - 1].type === 'unbounded') {
        renderUnboundedVerification();
      } else {
        const solution = computeSolutionFromTable({...lastState, variableDomain});
        if(solution.infeasible) renderInfeasibleVerification();
        else renderResultVerification(solution, obj, cons);
      }
      const built = buildTableau(obj, cons);
      obj.vars = built.originalVars || built.vars;
      plot2vars(obj, cons);
      status.textContent = steps[steps.length - 1].type === 'unbounded' ? 'Proceso terminado: el problema no está acotado.' : 'Proceso completado.';
    }catch(e){
      console.error('Error during simplex calculation:', e);
      if(e.message.includes('no acotado') && typeof renderPreflightReport === 'function'){
        renderPreflightReport({ ok:false, issues:['El método detectó que Z puede crecer indefinidamente: no existe una fila saliente para el pivote.'], notes:[] });
      }
      status.textContent = 'Error: '+e.message + ' (ver consola para más detalles)';
    }
  });
  clearAllBtn.addEventListener('click', ()=>{ objField.value=''; consField.value=''; constraintsLatex.length=0; renderConstraintBracket(constraintsLatex); $id('preflight').textContent='Añade la función objetivo y las restricciones para comprobar el modelo.'; $id('verification').textContent='Aquí se verificará la solución al finalizar el método.'; $id('steps').innerHTML=''; if(typeof simplexDesmos !== 'undefined' && simplexDesmos) simplexDesmos.setBlank(); status.innerText=''; }); }

// small plot function (2 vars support)
function plot2vars(obj, constraints){ const plotDiv=$id('plot'); plotDiv.innerHTML=''; if(!obj.vars || obj.vars.length!==2){ plotDiv.innerText='La gráfica solo está disponible para 2 variables.'; return; } const vx=obj.vars[0], vy=obj.vars[1]; const xRange=[0, Math.max(10, ...constraints.map(c=>c.rhs))]; const yRange=[0, Math.max(10, ...constraints.map(c=>c.rhs))]; const pts=[]; const step=(Math.max(xRange[1], yRange[1]))/200; for(let xv=0;xv<=xRange[1]; xv+=step){ for(let yv=0; yv<=yRange[1]; yv+=step){ let ok=true; for(const c of constraints){ const val=(c.coeffs[vx]||0)*xv + (c.coeffs[vy]||0)*yv; if(c.op==='<'+'=' && val>c.rhs+1e-6){ ok=false; break; } if(c.op==='>=' && val<c.rhs-1e-6){ ok=false; break; } if(c.op==='=' && Math.abs(val-c.rhs)>1e-6){ ok=false; break; } } if(ok) pts.push([xv,yv]); } }
  if(pts.length===0){ plotDiv.innerText='No hay región factible (según el muestreo).'; return; } const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]); const trace={x:xs,y:ys,mode:'markers',marker:{size:3,color:'rgba(0,100,200,0.6)'}}; Plotly.newPlot(plotDiv,[trace],{xaxis:{title:obj.vars[0]}, yaxis:{title:obj.vars[1]}}); }

// initialize when script loads (after DOMContentLoaded in page sets up math-field)
document.addEventListener('DOMContentLoaded', ()=>{ initPLUI(); });
