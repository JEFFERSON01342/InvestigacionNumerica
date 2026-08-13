/* Extended validation for Jacobi and Gauss-Seidel: visual demos + spectral approx */

/* Helpers: check diagonal zeros and diag dominance (strict) */
function checkDiagonalZeros(A) {
    for (let i = 0; i < A.length; i++) {
        if (Math.abs(Number(A[i][i])) < 1e-10) return true;
    }
    return false;
}

function checkDiagonalDominanceStrict(A){
    for(let i=0;i<A.length;i++){
        const aii = Math.abs(Number(A[i][i]));
        let sum = 0; for(let j=0;j<A.length;j++) if(i!==j) sum += Math.abs(Number(A[i][j]));
        if(!(aii > sum)) return false;
    }
    return true;
}

/* Build iteration matrix T = -D^{-1}(L+U) */
function buildIterationMatrix(A){
    const n = A.length;
    const T = Array.from({length:n}, ()=>Array(n).fill(0));
    for(let i=0;i<n;i++){
        const aii = Number(A[i][i]);
        if(Math.abs(aii) < 1e-12) return null;
        for(let j=0;j<n;j++){
            if(i===j) continue;
            T[i][j] = - Number(A[i][j]) / aii;
        }
    }
    return T;
}

/* Power iteration to approximate spectral radius */
function approximateSpectralRadius(T, maxIter=200, tol=1e-9){
    const n = T.length;
    let v = Array(n).fill(1);
    let norm = Math.sqrt(v.reduce((s,x)=>s+x*x,0));
    v = v.map(x=>x/norm);
    let lambda = 0;
    for(let k=0;k<maxIter;k++){
        const w = Array(n).fill(0);
        for(let i=0;i<n;i++){
            let s=0; for(let j=0;j<n;j++) s += T[i][j]*v[j]; w[i]=s;
        }
        const wnorm = Math.sqrt(w.reduce((s,x)=>s+x*x,0));
        if(wnorm===0) return 0;
        v = w.map(x=>x/wnorm);
        // Rayleigh quotient
        let Tv = Array(n).fill(0);
        for(let i=0;i<n;i++){ let s=0; for(let j=0;j<n;j++) s+=T[i][j]*v[j]; Tv[i]=s; }
        const numer = v.reduce((s,x,i)=>s + v[i]*Tv[i],0);
        const denom = v.reduce((s,x)=>s + x*x,0);
        const lambdaNew = Math.abs(numer/denom);
        if(Math.abs(lambdaNew - lambda) < tol) return lambdaNew;
        lambda = lambdaNew;
    }
    return lambda;
}

/* Symmetry and Cholesky test for SPD */
function isSymmetric(A){
    const n = A.length;
    for(let i=0;i<n;i++) for(let j=0;j<n;j++) if(Math.abs(Number(A[i][j]) - Number(A[j][i])) > 1e-9) return false;
    return true;
}
function tryCholesky(A){
    const n = A.length; const L = Array.from({length:n}, ()=>Array(n).fill(0));
    for(let i=0;i<n;i++){
        for(let j=0;j<=i;j++){
            let sum = 0; for(let k=0;k<j;k++) sum += L[i][k]*L[j][k];
            if(i===j){
                const val = Number(A[i][i]) - sum; if(val <= 0) return false; L[i][j] = Math.sqrt(val);
            } else {
                L[i][j] = (1.0 / L[j][j]) * (Number(A[i][j]) - sum);
            }
        }
    }
    return true;
}

/* Main enhanced validation that returns details for visual demo */
function validateSystemConvergenceExtended(A, B){
    const result = { errors: [], warnings: [], info: [], rowChecks: [], T: null, spectralRadius: null };
    if(!A || A.length===0){ result.errors.push('La matriz está vacía'); return result; }
    if(B.length !== A.length){ result.errors.push('Las dimensiones de A y B no coinciden'); return result; }
    for(let i=0;i<A.length;i++) if(A[i].length !== A.length){ result.errors.push('La matriz no es cuadrada'); return result; }
    if(checkDiagonalZeros(A)){ result.errors.push('La diagonal principal contiene ceros.'); return result; }
    // store original copy for visual comparison
    result.originalA = A.map(row => row.map(v => Number(v)));

    // Row checks
    let allRows=true;
    for(let i=0;i<A.length;i++){
        const aii = Math.abs(Number(A[i][i]));
        let sum = 0; for(let j=0;j<A.length;j++) if(i!==j) sum += Math.abs(Number(A[i][j]));
        const ok = aii > sum; result.rowChecks.push({aii, sum, ok}); if(!ok) allRows=false;
    }
    if(allRows) result.info.push('La matriz es estrictamente diagonalmente dominante por filas.'); else result.warnings.push('No es diagonalmente dominante por filas.');

    // Si no es estrictamente dominante, intentar reordenar para conseguir dominancia
    result.reordered = false;
    try{
        if(!allRows && typeof reorderForDiagonalDominance === 'function'){
            // note: reorderForDiagonalDominance espera (A, B)
            const reorderRes = reorderForDiagonalDominance(A, B);
            if(reorderRes && reorderRes.success){
                result.reordered = true;
                result.reorderedA = reorderRes.A;
                result.reorderedB = reorderRes.B;
                // recompute rowChecks for reordered
                result.rowChecksReordered = [];
                let allRows2 = true;
                for(let i=0;i<result.reorderedA.length;i++){
                    const aii = Math.abs(Number(result.reorderedA[i][i]));
                    let sum = 0; for(let j=0;j<result.reorderedA.length;j++) if(i!==j) sum += Math.abs(Number(result.reorderedA[i][j]));
                    const ok = aii > sum; result.rowChecksReordered.push({aii,sum,ok}); if(!ok) allRows2=false;
                }
                if(allRows2) result.info.push('Después de reordenar: la matriz es estrictamente diagonalmente dominante por filas.');
                else result.warnings.push('Después de reordenar: la matriz sigue sin ser estrictamente diagonalmente dominante por filas.');
                // compute T and spectral radius for reordered
                const T2 = buildIterationMatrix(result.reorderedA);
                result.T = T2;
                if(T2){ const rho2 = approximateSpectralRadius(T2); result.spectralRadius = rho2; if(rho2 < 1) result.info.push(`Razón espectral aprox (reordenada): ${rho2.toFixed(6)} (<1) — converge`); else result.warnings.push(`Razón espectral aprox (reordenada): ${rho2.toFixed(6)} (≥1) — puede divergir`); }
                else result.warnings.push('No se pudo construir la matriz iterativa T tras reordenar.');
            }
        }
    } catch(e){ console.warn('Reorder attempt failed', e); }

    // Si no hubo reordenamiento (o como fallback) construir T y spectral radius approx
    if(!result.reordered){
        const T = buildIterationMatrix(A); result.T = T;
        if(T){ const rho = approximateSpectralRadius(T); result.spectralRadius = rho; if(rho < 1) result.info.push(`Razón espectral aprox: ${rho.toFixed(6)} (<1) — converge`); else result.warnings.push(`Razón espectral aprox: ${rho.toFixed(6)} (≥1) — puede divergir`); }
        else result.warnings.push('No se pudo construir la matriz iterativa T.');
    }

    // SPD
    if(isSymmetric(result.reordered ? result.reorderedA : A)){
        if(tryCholesky(result.reordered ? result.reorderedA : A)) result.info.push('La matriz es simétrica definida positiva (Cholesky OK).'); else result.warnings.push('La matriz es simétrica pero NO definida positiva.');
    }

    return result;
}

/* Generate demo HTML for given A and method (Jacobi / Gauss-Seidel) */
function generateRulesDemoHTML(A, method, validation){
    let html = '<div class="rules-demo card" style="padding:12px;border-radius:8px;background:#fff;border:1px solid #e5e7eb;margin-bottom:12px;">';
    html += `<h3 style="margin-top:0;margin-bottom:8px;">Demostración de reglas para ${method==='jacobi' ? 'Jacobi' : 'Gauss-Seidel'}</h3>`;

    // Show original matrix
    if(validation.originalA){
        html += '<h4>Matriz original A</h4>';
        try{
            const safeA = validation.originalA.map(r=>r.map(v=> isFinite(Number(v)) ? new Fraction(Number(v)) : new Fraction(0)));
            html += `<div class="latex-box">$$A = ${matrixToLatex(safeA)}$$</div>`;
        }catch(e){
            html += '<pre>'+JSON.stringify(validation.originalA, null, 2)+'</pre>';
        }
    }
    // If reordered, show reordered matrix
    if(validation.reordered && validation.reorderedA){
        html += '<h4>Matriz reordenada (para favorecer dominancia)</h4>';
        try{
            const safeR = validation.reorderedA.map(r=>r.map(v=> isFinite(Number(v)) ? new Fraction(Number(v)) : new Fraction(0)));
            html += `<div class="latex-box">$$A_{reordenada} = ${matrixToLatex(safeR)}$$</div>`;
        }catch(e){
            html += '<pre>'+JSON.stringify(validation.reorderedA, null, 2)+'</pre>';
        }
    }

    // 1. Dominancia por filas
    html += '<h4>1. Matriz estrictamente diagonalmente dominante por filas</h4>';
    html += '<p>Condición: $|a_{ii}| > \sum_{j\ne i} |a_{ij}|$ (para cada fila)</p>';
    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:12px;"><thead style="background:#f3f4f6;"><tr><th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Fila</th><th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">|a_ii|</th><th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Σ_{j≠i}|a_ij|</th><th style="padding:8px;border:1px solid #e5e7eb;text-align:center;">Resultado</th></tr></thead><tbody>';
    validation.rowChecks.forEach((r,idx)=>{
        const resultLabel = r.ok ? '<span style="color:green;font-weight:bold;">✔ Cumple</span>' : '<span style="color:red;font-weight:bold;">✖ No cumple</span>';
        html += `<tr><td style="padding:6px;border:1px solid #eee;">${idx+1}</td><td style="padding:6px;border:1px solid #eee;text-align:right;">${r.aii.toFixed(6)}</td><td style="padding:6px;border:1px solid #eee;text-align:right;">${r.sum.toFixed(6)}</td><td style="padding:6px;border:1px solid #eee;text-align:center;">${resultLabel}</td></tr>`;
    });
    html += '</tbody></table>';

    // 2. Spectral radius
    html += '<h4>2. Razón espectral (aprox)</h4>';
    if(validation.T){
        html += '<p>Matriz iterativa $T = -D^{-1}(L+U)$:</p>';
        try{
            const safeT = validation.T.map(r=>r.map(v=> isFinite(Number(v)) ? new Fraction(Number(v)) : new Fraction(0)));
            html += `<div class="latex-box">$$T = ${matrixToLatex(safeT)}$$</div>`;
        } catch(e){
            html += '<pre>'+JSON.stringify(validation.T, null, 2)+'</pre>';
        }
        html += `<p>Razón espectral aprox: <b>${validation.spectralRadius.toFixed(6)}</b> — ${validation.spectralRadius<1 ? '<span style="color:green">Converge</span>' : '<span style="color:red">Puede divergir</span>'}</p>`;
        html += '<p style="font-size:0.9em;color:#6b7280;">Nota: se usó power iteration para aproximar ρ(T).</p>';
    } else {
        html += '<p>No se pudo construir T (diagonal nula).</p>';
    }

    // 3. SPD
    html += '<h4>3. Matriz simétrica definida positiva</h4>';
    if(validation.info.some(s=>s.includes('simétrica definida positiva'))){
        html += '<p>✓ La matriz es simétrica definida positiva (Cholesky OK). Esto garantiza convergencia (Gauss‑Seidel).</p>';
    } else if(validation.warnings.some(w=>w.includes('simétrica'))){
        html += '<p>⚠️ La matriz es simétrica pero no definida positiva.</p>';
    } else {
        html += '<p>La matriz no es simétrica o no cumple SPD.</p>';
    }

    html += '</div>';
    return html;
}

// Expose compatible API: override original function names used elsewhere
function validateSystemConvergence(A, B, method = 'jacobi'){
    const v = validateSystemConvergenceExtended(A,B);
    const res = {
        isValid: v.errors.length === 0,
        canSolve: v.errors.length === 0,
        warnings: v.warnings || [],
        errors: v.errors || [],
        info: v.info || [],
        rowChecks: v.rowChecks || [],
        rowChecksReordered: v.rowChecksReordered || null,
        originalA: v.originalA || null,
        reordered: v.reordered || false,
        reorderedA: v.reorderedA || null,
        reorderedB: v.reorderedB || null,
        T: v.T || null,
        spectralRadius: v.spectralRadius,
        method: method
    };
    return res;
}

function generateValidationHTML(validationResult){
    // Build demo using stored details
    let html = '';
    try{
        html += generateRulesDemoHTML(null, validationResult.method || 'jacobi', validationResult);
    } catch(e){ html += ''; }

    // Then reuse simple lists for errors/info/warnings
    html += '<div class="validation-summary">';
    if(validationResult.errors && validationResult.errors.length>0){
        html += '<div class="validation-error"><h4>❌ Errores detectados:</h4><ul>';
        validationResult.errors.forEach(e=> html += `<li>${e}</li>`);
        html += '</ul></div>';
    }
    if(validationResult.info && validationResult.info.length>0){
        html += '<div class="validation-info"><h4>Información:</h4><ul>';
        validationResult.info.forEach(i=> html += `<li>${i}</li>`);
        html += '</ul></div>';
    }
    if(validationResult.warnings && validationResult.warnings.length>0){
        html += '<div class="validation-warning"><h4>⚠️ Advertencias:</h4><ul>';
        validationResult.warnings.forEach(w=> html += `<li>${w}</li>`);
        html += '</ul></div>';
    }
    html += '</div>';

    // Render MathJax if available
    if(window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise();
    return html;
}

// Also expose generateRulesDemoHTML globally
window.generateRulesDemoHTML = generateRulesDemoHTML;
