/* ===================== */
/* VALIDACION DE SISTEMAS */
/* PARA JACOBI Y GAUSS-SEIDEL */
/* ===================== */

/* ===================== */
/* VERIFICAR DIAGONAL DOMINANTE */
/* ===================== */
function checkDiagonalDominance(A) {
    const n = A.length;
    
    for (let i = 0; i < n; i++) {
        let diagonal = Math.abs(Number(A[i][i]));
        let sum = 0;
        
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                sum += Math.abs(Number(A[i][j]));
            }
        }
        
        if (diagonal < sum) {
            return false;
        }
    }
    
    return true;
}

/* ===================== */
/* VERIFICAR CEROS EN DIAGONAL */
/* ===================== */
function checkDiagonalZeros(A) {
    for (let i = 0; i < A.length; i++) {
        if (Math.abs(Number(A[i][i])) < 1e-10) {
            return true; // Hay ceros
        }
    }
    return false; // No hay ceros
}

/* ===================== */
/* CONSTRUIR MATRIZ ITERATIVA T = -D^{-1}(L+U) */
/* ===================== */
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

/* ===================== */
/* APROXIMAR RAZON ESPECTRAL (POWER ITERATION) */
/* ===================== */
function approximateSpectralRadius(T, maxIter=100, tol=1e-8){
    const n = T.length;
    let v = Array(n).fill(1);
    let norm = Math.sqrt(v.reduce((s,x)=>s+x*x,0));
    v = v.map(x=>x/norm);
    let lambda = 0;
    for(let k=0;k<maxIter;k++){
        const w = Array(n).fill(0);
        for(let i=0;i<n;i++){
            let s=0;
            for(let j=0;j<n;j++) s += T[i][j]*v[j];
            w[i]=s;
        }
        const wnorm = Math.sqrt(w.reduce((s,x)=>s+x*x,0));
        if(wnorm===0) return 0;
        v = w.map(x=>x/wnorm);
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

/* ===================== */
/* CALCULAR RAZÓN (APROX) POR FILA (SUM/DIAG) - legado */
/* ===================== */
function calculateSpectralRadius(A) {
    const n = A.length;
    let maxRatio = 0;
    for (let i = 0; i < n; i++) {
        let diagonal = Math.abs(Number(A[i][i]));
        let sum = 0;
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                sum += Math.abs(Number(A[i][j]));
            }
        }
        if (diagonal > 0) {
            const ratio = sum / diagonal;
            maxRatio = Math.max(maxRatio, ratio);
        }
    }
    return maxRatio;
}

/* ===================== */
/* VALIDACION COMPLETA DEL SISTEMA */
/* ===================== */
function validateSystemConvergence(A, B, method = 'jacobi') {
    const result = {
        isValid: true,
        canSolve: true,
        warnings: [],
        errors: [],
        info: []
    };
    
    // Validar que la matriz no sea vacía
    if (!A || A.length === 0) {
        result.errors.push("La matriz está vacía");
        result.isValid = false;
        result.canSolve = false;
        return result;
    }
    
    // Validar dimensiones
    if (B.length !== A.length) {
        result.errors.push("Las dimensiones de la matriz A y el vector B no coinciden");
        result.isValid = false;
        result.canSolve = false;
        return result;
    }
    
    // Validar que sea matriz cuadrada
    for (let i = 0; i < A.length; i++) {
        if (A[i].length !== A.length) {
            result.errors.push("La matriz no es cuadrada");
            result.isValid = false;
            result.canSolve = false;
            return result;
        }
    }
    
    // Verificar ceros en diagonal
    if (checkDiagonalZeros(A)) {
        result.errors.push("La diagonal principal contiene ceros. El sistema no puede resolverse con este método.");
        result.canSolve = false;
        return result;
    }
    
    // Verificar dominancia diagonal
    const isDiagonalDominant = checkDiagonalDominance(A);
    
    if (!isDiagonalDominant) {
        result.warnings.push("⚠️ La matriz NO es diagonalmente dominante. El método podría diverger o converger lentamente.");
    } else {
        result.info.push("✓ La matriz es diagonalmente dominante. El método convergirá.");
    }
    
    // Calcular razón espectral
    const spectralRadius = calculateSpectralRadius(A);
    result.spectralRadius = spectralRadius;
    
    if (spectralRadius < 1) {
        result.info.push(`✓ Razón espectral: ${spectralRadius.toFixed(6)} < 1. Convergencia garantizada.`);
    } else if (spectralRadius <= 1) {
        result.warnings.push(`⚠️ Razón espectral: ${spectralRadius.toFixed(6)} ≈ 1. Convergencia en el límite.`);
    } else {
        result.warnings.push(`⚠️ Razón espectral: ${spectralRadius.toFixed(6)} > 1. El método podría diverger.`);
    }
    
    return result;
}

/* ===================== */
/* GENERAR MENSAJE HTML DE VALIDACION */
/* ===================== */
function generateValidationHTML(validationResult) {
    let html = '<div class="validation-container">';
    
    // Errores
    if (validationResult.errors.length > 0) {
        html += '<div class="validation-error">';
        html += '<h4>❌ Errores detectados:</h4>';
        html += '<ul>';
        validationResult.errors.forEach(error => {
            html += `<li>${error}</li>`;
        });
        html += '</ul>';
        html += '</div>';
    }
    
    // Información
    if (validationResult.info.length > 0) {
        html += '<div class="validation-info">';
        html += '<h4>Información de convergencia:</h4>';
        html += '<ul>';
        validationResult.info.forEach(info => {
            html += `<li>${info}</li>`;
        });
        html += '</ul>';
        html += '</div>';
    }
    
    // Advertencias
    if (validationResult.warnings.length > 0) {
        html += '<div class="validation-warning">';
        html += '<h4>⚠️ Advertencias:</h4>';
        html += '<ul>';
        validationResult.warnings.forEach(warning => {
            html += `<li>${warning}</li>`;
        });
        html += '</ul>';
        html += '</div>';
    }
    
    html += '</div>';
    
    return html;
}
