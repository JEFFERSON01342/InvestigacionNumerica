/* ===================== */
/* GAUSS JORDAN */
/* ===================== */
function solveGaussJordan(A, B){

    const size = A.length;

    /* ===================== */
    /* MATRIZ AUMENTADA */
    /* ===================== */
    let matrix = A.map(
        (row, i) => [

            ...row.map(
                value =>
                    new Fraction(value)
            ),

            new Fraction(B[i])
        ]
    );

    /* ===================== */
    /* PASOS */
    /* ===================== */
    let steps = [];

    /* ===================== */
    /* STEP INITIAL */
    /* ===================== */
    steps.push({

        operation:
            "Matriz aumentada inicial",

        description:
            "Se construye la matriz aumentada del sistema.",

        matrix:
            cloneAugmented(matrix),

        pivot: 0
    });

    /* ===================== */
    /* ELIMINACION */
    /* ===================== */
    for(
        let pivot = 0;
        pivot < size;
        pivot++
    ){

        /* ===================== */
        /* PIVOTE */
        /* ===================== */
        let pivotValue =
            matrix[pivot][pivot];

        /* ===================== */
        /* INTERCAMBIO */
        /* ===================== */
        if(
            pivotValue.equals(0)
        ){

            let swapRow = -1;

            for(
                let i = pivot + 1;
                i < size;
                i++
            ){

                if(
                    !matrix[i][pivot]
                    .equals(0)
                ){

                    swapRow = i;

                    break;
                }
            }

            if(swapRow !== -1){

                [
                    matrix[pivot],
                    matrix[swapRow]
                ] = [

                    matrix[swapRow],
                    matrix[pivot]
                ];

                steps.push({

                    operation:
                    `
                    F_${pivot+1}
                    \\leftrightarrow
                    F_${swapRow+1}
                    `,

                    description:
                    "Se intercambian filas para obtener un pivote válido.",

                    matrix:
                        cloneAugmented(matrix),

                    pivot:
                        pivot + 1
                });

                pivotValue =
                    matrix[pivot][pivot];
            }
        }

        /* ===================== */
        /* SI SIGUE EN 0 */
        /* ===================== */
        if(
            pivotValue.equals(0)
        ){

            continue;
        }

        /* ===================== */
        /* NORMALIZAR */
        /* ===================== */
        for(
            let j = 0;
            j < size + 1;
            j++
        ){

            matrix[pivot][j] =

                matrix[pivot][j]
                .div(pivotValue);
        }

        steps.push({

            operation:
            `
            F_${pivot+1}
            \\rightarrow
            \\frac{
                F_${pivot+1}
            }{
                ${fractionToLatex(
                    pivotValue
                )}
            }
            `,

            description:
            "Se normaliza la fila pivote para convertir el pivote en 1.",

            matrix:
                cloneAugmented(matrix),

            pivot:
                pivot + 1
        });

        /* ===================== */
        /* HACER CEROS */
        /* ===================== */
        for(
            let row = 0;
            row < size;
            row++
        ){

            if(row === pivot)
                continue;

            const factor =
                matrix[row][pivot];

            if(factor.equals(0))
                continue;

            for(
                let col = 0;
                col < size + 1;
                col++
            ){

                matrix[row][col] =

                    matrix[row][col]
                    .sub(

                        factor.mul(
                            matrix[pivot][col]
                        )
                    );
            }

            steps.push({

                operation:
                `
                F_${row+1}
                \\rightarrow
                F_${row+1}
                -
                (${fractionToLatex(factor)})
                F_${pivot+1}
                `,

                description:
                "Se elimina el valor de la columna pivote.",

                matrix:
                    cloneAugmented(matrix),

                pivot:
                    pivot + 1
            });
        }
    }

    /* ===================== */
    /* SOLUCIONES */
    /* ===================== */
    let solutions = [];

    for(
        let i = 0;
        i < size;
        i++
    ){

        solutions.push(
            matrix[i][size]
        );
    }

    return {

        matrix,
        steps,
        solutions
    };
}

/* ===================== */
/* CLONE AUGMENTED */
/* ===================== */
function cloneAugmented(matrix){

    return matrix.map(
        row =>

            row.map(
                cell =>
                    new Fraction(cell)
            )
    );
}

/* ===================== */
/* AUGMENTED TO LATEX */
/* ===================== */
function augmentedToLatex(matrix){

    const size =
        matrix[0].length - 1;

    const rows = matrix.map(
        row => {

            let left =
                row
                .slice(0, size)
                .map(
                    cell =>
                        fractionToLatex(cell)
                )
                .join(" & ");

            let right =
                fractionToLatex(
                    row[size]
                );

            return `
            ${left}
            \\;|\\;
            ${right}
            `;
        }
    ).join(" \\\\ ");

    return `
    \\begin{bmatrix}
    ${rows}
    \\end{bmatrix}
    `;
}

/* ===================== */
/* RENDER GAUSS JORDAN */
/* ===================== */
function renderGaussJordan(result){

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
    /* RESULTADOS */
    /* ===================== */
    const vars =
        ["x","y","z","w","v","u"];

    let solutionsLatex = "";

    result.solutions.forEach(
        (solution, i) => {

            solutionsLatex +=
            `
            ${vars[i]}
            =
            ${fractionToLatex(solution)}
            \\\\
            `;
        }
    );

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
    `;

    /* ===================== */
    /* STEPS */
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

                    ${index}

                </div>

                <div class="step-title">

                    Paso ${index}

                </div>

            </div>

            <div class="pivot-info">

                Pivote:
                F${step.pivot}

            </div>

            <div class="step-description">

                ${step.description}

            </div>

            <div class="step-operation">

                $$
                ${step.operation}
                $$

            </div>

            <div class="step-latex-matrix">

                $$
                ${augmentedToLatex(
                    step.matrix
                )}
                $$

            </div>
            `;

            procedureContainer
                .appendChild(card);
        }
    );

    /* ===================== */
    /* RENDER */
    /* ===================== */
    if(window.MathJax){

        MathJax.typesetPromise();
    }
}