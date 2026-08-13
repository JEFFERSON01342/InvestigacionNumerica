/* ===================== */
/* DETERMINANTE */
/* EXPANSION */
/* ===================== */

function determinantExpansion(matrix){

    const size =
        matrix.length;

    let steps = [];

    /* ===================== */
    /* 1x1 */
    /* ===================== */
    if(size === 1){

        return {

            determinant:
                matrix[0][0],

            steps
        };
    }

    /* ===================== */
    /* 2x2 */
    /* ===================== */
    if(size === 2){

        const det =

            matrix[0][0] *
            matrix[1][1]

            -

            matrix[0][1] *
            matrix[1][0];

        steps.push({

            operation:
            `
            (${matrix[0][0]})
            (${matrix[1][1]})
            -
            (${matrix[0][1]})
            (${matrix[1][0]})
            `,

            result: det,

            matrix
        });

        return {

            determinant: det,

            steps
        };
    }

    /* ===================== */
    /* EXPANSION */
    /* ===================== */
    let det = 0;

    for(
        let col = 0;
        col < size;
        col++
    ){

        const sign =
            (col % 2 === 0)
            ? 1
            : -1;

        const value =
            matrix[0][col];

        /* ===================== */
        /* MENOR */
        /* ===================== */
        let minor = [];

        for(
            let i = 1;
            i < size;
            i++
        ){

            let row = [];

            for(
                let j = 0;
                j < size;
                j++
            ){

                if(j !== col){

                    row.push(
                        matrix[i][j]
                    );
                }
            }

            minor.push(row);
        }

        const minorDet =
            determinant(minor);

        const contribution =

            sign *
            value *
            minorDet;

        det += contribution;

        steps.push({

            column:
                col + 1,

            value,

            sign,

            minor,

            minorDet,

            contribution,

            partial: det
        });
    }

    return {

        determinant: det,

        steps
    };
}

/* ===================== */
/* RENDER */
/* ===================== */

function renderDeterminantExpansion(result){

    const resultContainer =

        document.getElementById(
            "determinant-result"
        );

    const procedureContainer =

        document.getElementById(
            "procedure-content"
        );

    procedureContainer.innerHTML =
        "";

    /* ===================== */
    /* RESULTADO */
    /* ===================== */
    resultContainer.innerHTML =

    `
    <div class="result-card">

        <h3>
            Determinante
        </h3>

        <div class="result-value">

            $$
            \\det(A)
            =
            ${result.determinant}
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

            /* ===================== */
            /* CASO 2x2 */
            /* ===================== */
            if(step.operation){

                card.innerHTML =

                `
                <div class="step-header">

                    <div class="step-number">

                        ${index + 1}

                    </div>

                    <div class="step-title">

                        Regla 2×2

                    </div>

                </div>

                <div class="step-operation">

                    $$
                    ${step.operation}
                    $$

                </div>

                <div class="pivot-info">

                    $$
                    Resultado
                    =
                    ${step.result}
                    $$

                </div>
                `;
            }

            /* ===================== */
            /* EXPANSION */
            /* ===================== */
            else{

                card.innerHTML =

                `
                <div class="step-header">

                    <div class="step-number">

                        ${index + 1}

                    </div>

                    <div class="step-title">

                        Cofactor columna
                        ${step.column}

                    </div>

                </div>

                <div class="step-description">

                    Expansión por cofactores.

                </div>

                <div class="step-latex-matrix">

                    $$
                    ${matrixToLatexNumbers(
                        step.minor
                    )}
                    $$

                </div>

                <div class="step-operation">

                    $$
                    (${step.sign})
                    (${step.value})
                    (${step.minorDet})
                    =
                    ${step.contribution}
                    $$

                </div>

                <div class="pivot-info">

                    $$
                    Acumulado
                    =
                    ${step.partial}
                    $$

                </div>
                `;
            }

            procedureContainer
                .appendChild(card);
        }
    );

    /* ===================== */
    /* MATHJAX */
    /* ===================== */
    if(window.MathJax){

        MathJax.typesetPromise();
    }
}