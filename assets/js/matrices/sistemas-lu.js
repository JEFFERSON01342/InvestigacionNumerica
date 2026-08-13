/* ===================== */
/* FACTORIZACION LU */
/* ===================== */
function solveLU(A, B){

    const n = A.length;

    /* ===================== */
    /* COPIAS */
    /* ===================== */
    let U = cloneMatrix(A);

    let L = [];

    let steps = [];

    /* ===================== */
    /* CREAR L */
    /* ===================== */
    for(let i=0;i<n;i++){

        L[i] = [];

        for(let j=0;j<n;j++){

            L[i][j] =
                new Fraction(
                    i === j ? 1 : 0
                );
        }
    }

    /* ===================== */
    /* MATRIZ INICIAL */
    /* ===================== */
    steps.push({

        title:
            "Matriz inicial",

        description:
            "Se inicia la factorización LU con la matriz original.",

        L:
            cloneMatrix(L),

        U:
            cloneMatrix(U)
    });

    /* ===================== */
    /* FACTORIZACION */
    /* ===================== */
    for(let i=0;i<n;i++){

        /* ===================== */
        /* PIVOTE */
        /* ===================== */
        const pivot =
            U[i][i];

        if(pivot.equals(0)){

            return {

                error:
                    "La matriz no puede factorizarse porque tiene un pivote igual a cero."
            };
        }

        /* ===================== */
        /* HACER CEROS */
        /* ===================== */
        for(let j=i+1;j<n;j++){

            const factor =

                U[j][i].div(
                    pivot
                );

            /* ===================== */
            /* GUARDAR EN L */
            /* ===================== */
            L[j][i] = factor;

            /* ===================== */
            /* ELIMINACION */
            /* ===================== */
            for(let k=i;k<n;k++){

                U[j][k] =

                    U[j][k].sub(

                        factor.mul(
                            U[i][k]
                        )
                    );
            }

            steps.push({

                title:
                    `Eliminación F${j+1}`,

                description:
                    `Se elimina el elemento debajo del pivote usando el factor ${fractionToLatex(factor)}.`,

                operation:
                    `
                    F_${j+1}
                    =
                    F_${j+1}
                    -
                    (${fractionToLatex(factor)})
                    F_${i+1}
                    `,

                L:
                    cloneMatrix(L),

                U:
                    cloneMatrix(U)
            });
        }
    }

    /* ===================== */
    /* SUSTITUCION ADELANTE */
    /* LY = B */
    /* ===================== */
    let Y = [];

    for(let i=0;i<n;i++){

        let sum =
            new Fraction(0);

        for(let j=0;j<i;j++){

            sum =

                sum.add(

                    L[i][j].mul(
                        Y[j]
                    )
                );
        }

        Y[i] =

            new Fraction(B[i])
            .sub(sum);
    }

    /* ===================== */
    /* SUSTITUCION ATRAS */
    /* UX = Y */
    /* ===================== */
    let X = [];

    for(let i=n-1;i>=0;i--){

        let sum =
            new Fraction(0);

        for(let j=i+1;j<n;j++){

            sum =

                sum.add(

                    U[i][j].mul(
                        X[j]
                    )
                );
        }

        X[i] =

            Y[i]
            .sub(sum)
            .div(U[i][i]);
    }

    /* ===================== */
    /* RESULTADO */
    /* ===================== */
    return {

        L,
        U,
        Y,
        X,
        steps
    };
}

/* ===================== */
/* RENDER LU */
/* ===================== */
function renderLU(result){

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
    /* VARIABLES */
    /* ===================== */
    const vars =
        ["x","y","z","w","v","u"];

    /* ===================== */
    /* SOLUCIONES */
    /* ===================== */
    let solutionsLatex = "";

    result.X.forEach(
        (value, i) => {

            solutionsLatex +=

            `
            ${vars[i]}
            =
            ${fractionToLatex(value)}
            \\\\
            `;
        }
    );

    /* ===================== */
    /* RESULTADO */
    /* ===================== */
    resultContainer.innerHTML =

    `
    <div class="result-card">

        <h3>
            Solución del sistema
        </h3>

        <div class="result-value">

            $$
            \\begin{aligned}
            ${solutionsLatex}
            \\end{aligned}
            $$

        </div>

    </div>

    <div class="step-card">

        <div class="step-title">

            Matriz L

        </div>

        <div class="step-latex-matrix">

            $$
            ${matrixToLatex(result.L)}
            $$

        </div>

    </div>

    <div class="step-card">

        <div class="step-title">

            Matriz U

        </div>

        <div class="step-latex-matrix">

            $$
            ${matrixToLatex(result.U)}
            $$

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

                    ${step.title}

                </div>

            </div>

            <div class="step-description">

                ${step.description}

            </div>

            ${step.operation ?

            `
            <div class="step-operation">

                $$
                ${step.operation}
                $$

            </div>
            `

            : ""}

            <div class="step-title">

                Matriz L

            </div>

            <div class="step-latex-matrix">

                $$
                ${matrixToLatex(step.L)}
                $$

            </div>

            <br>

            <div class="step-title">

                Matriz U

            </div>

            <div class="step-latex-matrix">

                $$
                ${matrixToLatex(step.U)}
                $$

            </div>
            `;

            procedureContainer
                .appendChild(card);
        }
    );

    /* ===================== */
    /* RENDER MATHJAX */
    /* ===================== */
    if(window.MathJax){

        MathJax.typesetPromise();
    }
}