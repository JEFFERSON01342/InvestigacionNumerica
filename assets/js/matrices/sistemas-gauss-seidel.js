/* ===================== */
/* DIAGONAL DOMINANTE */
/* ===================== */
function isDiagonallyDominant(A){

    for(let i = 0; i < A.length; i++){

        let diagonal =
            Math.abs(
                Number(A[i][i])
            );

        let sum = 0;

        for(let j = 0; j < A.length; j++){

            if(i !== j){

                sum +=
                    Math.abs(
                        Number(A[i][j])
                    );
            }
        }

        if(diagonal < sum){

            return false;
        }
    }

    return true;
}

/* ===================== */
/* REORDENAR MATRIZ */
/* ===================== */
function reorderForDiagonalDominance(A, B){

    const n = A.length;

    const used =
        Array(n).fill(false);

    const newA =
        Array(n);

    const newB =
        Array(n);

    for(let col = 0; col < n; col++){

        let bestRow = -1;

        let bestValue = -1;

        for(let row = 0; row < n; row++){

            if(used[row])
                continue;

            const value =
                Math.abs(
                    Number(A[row][col])
                );

            if(value > bestValue){

                bestValue =
                    value;

                bestRow =
                    row;
            }
        }

        if(bestRow === -1){

            return {
                success: false
            };
        }

        used[bestRow] = true;

        newA[col] =
            [...A[bestRow]];

        newB[col] =
            B[bestRow];
    }

    return {

        success: true,

        A: newA,

        B: newB
    };
}

/* ===================== */
/* NORMA INFINITA */
/* ===================== */
function infinityNorm(v){

    return Math.max(
        ...v.map(
            x => Math.abs(x)
        )
    );
}

/* ===================== */
/* GAUSS-SEIDEL */
/* ===================== */
function solveGaussSeidel(
    A,
    B,
    initialValues = [],
    tolerance = 0.0000001,
    maxIterations = 150
){

    const size =
        A.length;

    /* ===================== */
    /* LIMPIAR DATOS */
    /* ===================== */
    for(let i = 0; i < size; i++){

        for(let j = 0; j < size; j++){

            A[i][j] =
                parseFloat(
                    A[i][j] || 0
                );
        }

        B[i] =
            parseFloat(
                B[i] || 0
            );
    }

    /* ===================== */
    /* REORDENAR */
    /* ===================== */
    let reordered =
        false;

    if(
        !isDiagonallyDominant(A)
    ){

        const reorderedResult =
            reorderForDiagonalDominance(
                A,
                B
            );

        if(reorderedResult.success){

            A =
                reorderedResult.A;

            B =
                reorderedResult.B;

            reordered = true;
        }
    }

    /* ===================== */
    /* VALIDAR DIAGONAL */
    /* ===================== */
    for(let i = 0; i < size; i++){

        if(A[i][i] === 0){

            return {

                error:
                "La diagonal principal contiene un cero."
            };
        }
    }

    /* ===================== */
    /* WARNING */
    /* ===================== */
    let warning = null;

    if(
        !isDiagonallyDominant(A)
    ){

        warning =
        "La matriz no es diagonalmente dominante. Gauss-Seidel podría divergir.";
    }

    /* ===================== */
    /* VECTOR INICIAL */
    /* ===================== */
    let xOld =
        initialValues.map(
            value =>
                parseFloat(
                    value || 0
                )
        );

    while(xOld.length < size){

        xOld.push(0);
    }

    let xNew =
        [...xOld];

    let steps = [];

    let converged =
        false;

    let iterations =
        0;

    /* ===================== */
    /* ITERACIONES */
    /* ===================== */
    for(
        let k = 0;
        k < maxIterations;
        k++
    ){

        let errorVector = [];

        /* ===================== */
        /* VARIABLES */
        /* ===================== */
        for(
            let i = 0;
            i < size;
            i++
        ){

            const aii =
                A[i][i];

            const bi =
                B[i];

            let sum = 0;

            let symbolicTerms = [];

            let numericTerms = [];

            let jValues = [];

            /* ===================== */
            /* SUMATORIA */
            /* ===================== */
            for(
                let j = 0;
                j < size;
                j++
            ){

                if(i === j)
                    continue;

                const aij =
                    A[i][j];

                const xj =
                    j < i
                    ? xNew[j]
                    : xOld[j];

                sum +=
                    aij * xj;

                jValues.push(
                    j + 1
                );

                /* ===================== */
                /* EXPONENTE */
                /* ===================== */
                const exponent =
                    j < i
                    ? k + 1
                    : k;

                symbolicTerms.push(
                    `
                    a_{${i+1}${j+1}}
                    x_{${j+1}}^{(${exponent})}
                    `
                );

                numericTerms.push(
                    `
                    (${aij})
                    (${xj.toFixed(8)})
                    `
                );
            }

            /* ===================== */
            /* NUEVO VALOR */
            /* ===================== */
            const value =
                (bi - sum) / aii;

            const error =
                Math.abs(
                    value - xOld[i]
                );

            errorVector.push(
                error
            );

            xNew[i] =
                value;

            /* ===================== */
            /* FORMULA LATEX */
            /* ===================== */
            const formulaLatex =

            `
            x_{${i+1}}^{(${k+1})}
            =
            \\frac{1}{a_{${i+1}${i+1}}}
            \\left(
            b_{${i+1}}
            -
            \\left(
            ${symbolicTerms.join("+")}
            \\right)
            \\right)
            `;

            /* ===================== */
            /* SUSTITUCION */
            /* ===================== */
            const substitutionLatex =

            `
            x_{${i+1}}^{(${k+1})}
            =
            \\frac{1}{${aii}}
            \\left(
            ${bi}
            -
            (
            ${numericTerms.join("+")}
            )
            \\right)
            =
            ${value.toFixed(10)}
            `;

            /* ===================== */
            /* GUARDAR PASO */
            /* ===================== */
            steps.push({

                iteration:
                    k + 1,

                variable:
                    i + 1,

                jValues,

                matrix:
                    A.map(
                        row => [...row]
                    ),

                formula:
                    formulaLatex,

                substitution:
                    substitutionLatex,

                result:
                    value,

                error,

                xOld:
                    [...xOld],

                xNew:
                    [...xNew]
            });
        }

        iterations =
            k + 1;

        /* ===================== */
        /* ERROR GLOBAL */
        /* ===================== */
        const globalError =
            infinityNorm(
                errorVector
            );

        /* ===================== */
        /* DIVERGENCIA */
        /* ===================== */
        if(
            globalError > 1e10
        ){

            return {

                error:
                "El método diverge. Los valores crecieron demasiado.",

                steps,

                solution:
                    xNew,

                converged:
                    false,

                iterations,

                warning
            };
        }

        /* ===================== */
        /* CONVERGENCIA */
        /* ===================== */
        if(
            globalError <
            tolerance
        ){

            converged = true;

            break;
        }

        /* ===================== */
        /* ACTUALIZAR */
        /* ===================== */
        xOld =
            [...xNew];
    }

    /* ===================== */
    /* RESULTADO */
    /* ===================== */
    return {

        steps,

        solution:
            xNew,

        converged,

        iterations,

        reordered,

        warning
    };
}

/* ===================== */
/* RENDER */
/* ===================== */
function renderGaussSeidel(result){

    const resultContainer =

        document.getElementById(
            "system-result"
        );

    const procedureContainer =

        document.getElementById(
            "system-procedure"
        );

    procedureContainer.innerHTML =
        "";

    /* ===================== */
    /* ERROR */
    /* ===================== */
    if(result.error){

        resultContainer.innerHTML =

        `
        <div class="result-card">

            <h3>
                Error
            </h3>

            <div class="result-value">

                ${result.error}

            </div>

        </div>
        `;

        return;
    }

    /* ===================== */
    /* MENSAJES */
    /* ===================== */
    let extraHTML = "";

    if(result.reordered){

        extraHTML +=

        `
        <div class="pivot-info">

            La matriz fue reordenada automáticamente
            para mejorar la convergencia.

        </div>
        `;
    }

    if(result.warning){

        extraHTML +=

        `
        <div class="pivot-info">

            ${result.warning}

        </div>
        `;
    }

    /* ===================== */
    /* SOLUCIONES */
    /* ===================== */
    const vars =
        ["x","y","z","w","v","u"];

    let solutionsLatex = "";

    result.solution.forEach(
        (value, i) => {

            solutionsLatex +=
            `
            ${vars[i]}
            =
            ${value.toFixed(10)}
            \\\\
            `;
        }
    );

    resultContainer.innerHTML =

    `
    ${extraHTML}

    <div class="result-card">

        <h3>

            Solución por
            Gauss-Seidel

        </h3>

        <div class="result-value">

            $$
            \\begin{aligned}
            ${solutionsLatex}
            \\end{aligned}
            $$

        </div>

        <br>

        <div class="pivot-info">

            ${
                result.converged
                ? "El método convergió correctamente."
                : "El método alcanzó el máximo de iteraciones."
            }

            <br><br>

            Iteraciones:
            ${result.iterations}

        </div>

    </div>
    `;

    /* ===================== */
    /* PASOS */
    /* ===================== */
    result.steps.forEach(
        (step, index) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "step-card";

            card.innerHTML =

            `
            <div class="step-header">

                <div class="step-number">

                    ${index + 1}

                </div>

                <div class="step-title">

                    Iteración
                    ${step.iteration}

                </div>

            </div>

            <div class="pivot-info">

                <strong>
                    i = ${step.variable}
                </strong>

                &nbsp;&nbsp;

                j =
                ${step.jValues.join(", ")}

            </div>

            <div class="step-description">

                Se calcula
                x${step.variable}
                usando valores
                nuevos inmediatamente.

            </div>

            <div class="step-operation">

                $$
                ${step.formula}
                $$

            </div>

            <div class="step-latex-matrix">

                $$
                ${matrixToLatex(
                    step.matrix.map(
                        row =>
                            row.map(
                                n =>
                                new Fraction(n)
                            )
                    )
                )}
                $$

            </div>

            <div class="step-operation">

                $$
                ${step.substitution}
                $$

            </div>

            <div class="pivot-info">

                Error:
                ${step.error.toFixed(12)}

            </div>
            `;

            procedureContainer
                .appendChild(card);
        }
    );

    /* ===================== */
    /* RENDER LATEX */
    /* ===================== */
    if(window.MathJax){

        MathJax.typesetPromise();
    }
}