// Simplex solver prototype (front-end JS)
// Nota: soporta problemas de maximización con restricciones <= y variables >= 0.
// Para minimización se convierte multiplicando la función objetivo por -1.

function $(id){ return document.getElementById(id); }

function parseObjective(text){
  text = text.trim();
  const m = text.match(/^(max|min)\s*[:]?\s*(.*)$/i);
  if(!m) throw new Error('Formato objetivo inválido. Ej: max: 3 x1 + 5 x2');
  const sense = m[1].toLowerCase() === 'max' ? 'max' : 'min';
  const expr = m[2];
  // parse coefficients like 3 x1 + -2 x2
  const tokens = expr.replace(/\s+/g,' ').split(/\s*(\+|\-)\s*/).filter(s=>s!=='');
  const coeffs = {};
  let sign = 1;
  for(let t of tokens){
    if(t === '+'){ sign = 1; continue; }
    if(t === '-'){ sign = -1; continue; }
    // t like '3 x1' or 'x1' or '3x1'
    const m2 = t.match(/^(?<coef>[-+]?[0-9]*\.?[0-9]+)?\s*\*?\s*(?<var>x\d+)$/i);
    if(!m2) throw new Error('Término objetivo inválido: '+t);
    const coef = (m2.groups.coef ? parseFloat(m2.groups.coef) : 1) * sign;
    const v = m2.groups.var.toLowerCase();
    coeffs[v] = (coeffs[v]||0) + coef;
    sign = 1;
  }
  const vars = Object.keys(coeffs).sort((a,b)=>{ return parseInt(a.slice(1)) - parseInt(b.slice(1)); });
  return {sense, coeffs, vars};
}

function parseConstraints(text){
  const lines = text.split('\n').map(l=>l.trim()).filter(l=>l!=='');
  const constraints = [];
  for(const l of lines){
    // format: 2 x1 + 1 x2 <= 100
    const m = l.match(/^(.*)\s*(<=|>=|=)\s*([-+]?[0-9]*\.?[0-9]+)\s*$/);
    if(!m) throw new Error('Restricción inválida: '+l);
    const lhs = m[1].trim();
    const op = m[2];
    const rhs = parseFloat(m[3]);
    // parse lhs terms
    const tokens = lhs.replace(/\s+/g,' ').split(/\s*(\+|\-)\s*/).filter(s=>s!=='');
    const coeffs = {};
    let sign = 1;
    for(let t of tokens){
      if(t === '+'){ sign = 1; continue; }
      if(t === '-'){ sign = -1; continue; }
      const m2 = t.match(/^(?<coef>[-+]?[0-9]*\.?[0-9]+)?\s*\*?\s*(?<var>x\d+)$/i);
      if(!m2) throw new Error('Término en restricción inválido: '+t);
      const coef = (m2.groups.coef ? parseFloat(m2.groups.coef) : 1) * sign;
      const v = m2.groups.var.toLowerCase();
      coeffs[v] = (coeffs[v]||0) + coef;
      sign = 1;
    }
    constraints.push({coeffs, op, rhs});
  }
  return constraints;
}

function collectVars(obj, constraints){
  const set = new Set(obj.vars);
  for(const c of constraints){
    for(const v of Object.keys(c.coeffs)) set.add(v);
  }
  const vars = Array.from(set).sort((a,b)=> parseInt(a.slice(1)) - parseInt(b.slice(1)));
  return vars;
}

function buildTableau(obj, constraints){
  // Only <= supported directly. For >= convert by multiplying -1.
  const vars = collectVars(obj, constraints);
  const m = constraints.length;
  const n = vars.length;
  const A = [];
  const b = [];
  const slackNames = [];
  for(let i=0;i<m;i++){
    const row = new Array(n).fill(0);
    const c = constraints[i];
    for(let j=0;j<n;j++){
      row[j] = c.coeffs[vars[j]] || 0;
    }
    let rhs = c.rhs;
    if(c.op === '>='){
      // multiply by -1 to make <=
      for(let j=0;j<n;j++) row[j] = -row[j];
      rhs = -rhs;
    } else if(c.op === '='){
      // treat as two inequalities? For now convert to two constraints (<= and >=)
      // Simpler: leave as is but no slack sign; here just allow = by adding 0 slack and expect basis later.
    }
    A.push(row);
    b.push(rhs);
    slackNames.push('s'+(i+1));
  }
  // Objective row (we store as c vector with n entries)
  let cvec = new Array(n).fill(0);
  for(let j=0;j<n;j++) cvec[j] = obj.coeffs[vars[j]] || 0;
  if(obj.sense === 'min'){
    // convert to maximization by multiplying by -1
    cvec = cvec.map(v=>-v);
  }
  // Build initial tableau with slack variables as identity
  // tableau rows: [ basicVars | coefficients... | slack... | RHS ]
  const tableau = [];
  for(let i=0;i<m;i++){
    const row = {coeffs: A[i].slice(), slack: new Array(m).fill(0), rhs: b[i], basic: slackNames[i] };
    row.slack[i] = 1;
    tableau.push(row);
  }
  // objective row
  const objRow = {coeffs: cvec.slice(), slack: new Array(m).fill(0), rhs: 0, basic: 'z'};
  // For simplex tableau we store objective as z - c x = 0, so we put -c in row
  // but we'll work with standard form: objective row stores (z - sum(cj xj)) so row entries are -cj
  objRow.coeffs = objRow.coeffs.map(v=> -v);

  return {vars, slackNames, tableau, objRow};
}

function cloneTableauState(vars, slackNames, tableau, objRow){
  return {
    vars: vars.slice(),
    slackNames: slackNames.slice(),
    tableau: tableau.map(r=>({coeffs: r.coeffs.slice(), slack: r.slack.slice(), rhs: r.rhs, basic: r.basic})),
    objRow: {coeffs: objRow.coeffs.slice(), slack: objRow.slack.slice(), rhs: objRow.rhs, basic: objRow.basic}
  };
}

function findEntering(objRow){
  // choose most negative coefficient (for maximization)
  let minVal = 0; let idx = -1;
  for(let j=0;j<objRow.coeffs.length;j++){
    const v = objRow.coeffs[j];
    if(v < minVal){ minVal = v; idx = j; }
  }
  return idx; // -1 indicates optimal
}

function findLeaving(tableau, enteringIndex){
  let bestRatio = Infinity; let rowIdx = -1;
  for(let i=0;i<tableau.length;i++){
    const aij = tableau[i].coeffs[enteringIndex];
    if(aij > 0){
      const ratio = tableau[i].rhs / aij;
      if(ratio >= 0 && ratio < bestRatio){ bestRatio = ratio; rowIdx = i; }
    }
  }
  return rowIdx; // -1 unbounded or none
}

function pivotOn(state, enteringIndex, leavingRowIdx){
  const T = state.tableau;
  const row = T[leavingRowIdx];
  const pivot = row.coeffs[enteringIndex];
  // normalize pivot row
  for(let j=0;j<row.coeffs.length;j++) row.coeffs[j] = row.coeffs[j]/pivot;
  for(let j=0;j<row.slack.length;j++) row.slack[j] = row.slack[j]/pivot;
  row.rhs = row.rhs / pivot;
  // eliminate other rows including objective
  for(let i=0;i<T.length;i++){
    if(i===leavingRowIdx) continue;
    const factor = T[i].coeffs[enteringIndex];
    if(factor === 0) continue;
    for(let j=0;j<T[i].coeffs.length;j++) T[i].coeffs[j] = T[i].coeffs[j] - factor * row.coeffs[j];
    for(let j=0;j<T[i].slack.length;j++) T[i].slack[j] = T[i].slack[j] - factor * row.slack[j];
    T[i].rhs = T[i].rhs - factor * row.rhs;
  }
  // objective row
  const f = state.objRow.coeffs[enteringIndex];
  if(f !== 0){
    for(let j=0;j<state.objRow.coeffs.length;j++) state.objRow.coeffs[j] = state.objRow.coeffs[j] - f * row.coeffs[j];
    for(let j=0;j<state.objRow.slack.length;j++) state.objRow.slack[j] = state.objRow.slack[j] - f * row.slack[j];
    state.objRow.rhs = state.objRow.rhs - f * row.rhs;
  }
  // update basic variable for leaving row
  state.tableau[leavingRowIdx].basic = state.vars[enteringIndex];
}

function simplexSolve(obj, constraints){
  const built = buildTableau(obj, constraints);
  const vars = built.vars; const slackNames = built.slackNames; let tableau = built.tableau; let objRow = built.objRow;
  const steps = [];
  steps.push(cloneTableauState(vars, slackNames, tableau, objRow));

  for(let iter=0; iter<200; iter++){
    const entering = findEntering(objRow);
    if(entering === -1){
      // optimal
      break;
    }
    const leaving = findLeaving(tableau, entering);
    if(leaving === -1){
      throw new Error('Problema no acotado (unbounded)');
    }
    pivotOn({vars, slackNames, tableau, objRow}, entering, leaving);
    steps.push(cloneTableauState(vars, slackNames, tableau, objRow));
  }
  return steps;
}

function renderInput(obj, constraints){
  const el = $('render-input');
  el.innerHTML = '';
  const p1 = document.createElement('div'); p1.innerHTML = `<strong>Objetivo:</strong> \(${obj.sense === 'max' ? 'Max' : 'Min'}\ \)` +
    ' ' + Object.entries(obj.coeffs).map(([k,v])=> `${v} ${k}`).join(' + ');
  el.appendChild(p1);
  const list = document.createElement('ul');
  for(const c of constraints){
    const text = Object.entries(c.coeffs).map(([k,v])=> `${v} ${k}`).join(' + ') + ` ${c.op} ${c.rhs}`;
    const li = document.createElement('li'); li.textContent = text; list.appendChild(li);
  }
  el.appendChild(list);
  MathJax.typesetPromise();
}

function renderSteps(steps){
  const container = $('steps'); container.innerHTML = '';
  for(let s=0;s<steps.length;s++){
    const st = steps[s];
    const title = document.createElement('h3'); title.textContent = `Tabla ${s}`;
    container.appendChild(title);
    const table = document.createElement('table'); table.className = 'simplex-table';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headRow.appendChild(td('BV'));
    for(const v of st.vars) headRow.appendChild(td(v));
    for(const sn of st.slackNames) headRow.appendChild(td(sn));
    headRow.appendChild(td('RHS'));
    thead.appendChild(headRow); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for(const row of st.tableau){
      const tr = document.createElement('tr');
      tr.appendChild(td(row.basic));
      for(const c of row.coeffs) tr.appendChild(td(formatNum(c)));
      for(const s2 of row.slack) tr.appendChild(td(formatNum(s2)));
      tr.appendChild(td(formatNum(row.rhs)));
      tbody.appendChild(tr);
    }
    // objective row
    const otr = document.createElement('tr'); otr.className = 'objrow';
    otr.appendChild(td(st.objRow.basic));
    for(const c of st.objRow.coeffs) otr.appendChild(td(formatNum(c)));
    for(const s2 of st.objRow.slack) otr.appendChild(td(formatNum(s2)));
    otr.appendChild(td(formatNum(st.objRow.rhs)));
    tbody.appendChild(otr);
    table.appendChild(tbody);
    container.appendChild(table);
  }
}

function td(txt){ const e = document.createElement('td'); e.innerText = txt; return e; }
function formatNum(x){ return Math.abs(x) < 1e-9 ? '0' : (+x.toFixed(6)).toString(); }

// Plot feasible region for 2 variables (approx)
function plot2vars(obj, constraints){
  const plotDiv = $('plot'); plotDiv.innerHTML = '';
  if(obj.vars.length !== 2){ plotDiv.innerText = 'La gráfica solo está disponible para 2 variables (x1, x2).'; return; }
  // sample a grid and compute feasible points, evaluate objective.
  const xRange = [0, Math.max(10, ...constraints.map(c=>c.rhs))];
  const yRange = [0, Math.max(10, ...constraints.map(c=>c.rhs))];
  const pts = [];
  const step = (Math.max(xRange[1], yRange[1]) )/200;
  for(let x=0;x<=xRange[1]; x+=step){
    for(let y=0;y<=yRange[1]; y+=step){
      let ok = true;
      for(const c of constraints){
        const val = (c.coeffs['x1']||0)*x + (c.coeffs['x2']||0)*y;
        if(c.op === '<=' && val > c.rhs + 1e-6) { ok = false; break; }
        if(c.op === '>=' && val < c.rhs - 1e-6) { ok = false; break; }
        if(c.op === '=' && Math.abs(val - c.rhs) > 1e-6) { ok = false; break; }
      }
      if(ok) pts.push([x,y]);
    }
  }
  if(pts.length === 0){ plotDiv.innerText = 'No hay región factible (según el muestreo).'; return; }
  // plot feasible points
  const xs = pts.map(p=>p[0]); const ys = pts.map(p=>p[1]);
  const trace = { x: xs, y: ys, mode: 'markers', marker:{size:3, color:'rgba(0,100,200,0.6)'} };
  // objective contours (optional)
  Plotly.newPlot(plotDiv, [trace], {xaxis:{title:'x1'}, yaxis:{title:'x2'}});
}

// UI wiring
window.addEventListener('load', ()=>{
  $('solve').addEventListener('click', ()=>{
    const status = $('status'); status.textContent = '';
    try{
      const obj = parseObjective($('objective').value);
      const cons = parseConstraints($('constraints').value);
      renderInput(obj, cons);
      const steps = simplexSolve(obj, cons);
      renderSteps(steps);
      // if 2 vars, try plotting
      const built = buildTableau(obj, cons);
      obj.vars = built.vars; // update
      plot2vars(obj, cons);
      status.textContent = 'Resultado: proceso completado con ' + steps.length + ' tablas.';
    }catch(e){
      status.textContent = 'Error: ' + e.message;
    }
  });
  $('clear').addEventListener('click', ()=>{ $('objective').value=''; $('constraints').value=''; $('render-input').innerHTML=''; $('steps').innerHTML=''; $('plot').innerHTML=''; $('status').innerText=''; });
});
