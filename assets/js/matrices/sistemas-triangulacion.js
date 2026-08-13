/* ===================== */
/* ELIMINACION GAUSSIANA */
/* ===================== */
function solveGaussianElimination(A, B){

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
    /* TRIANGULACION */
    /* ===================== */
    for(
        let pivot = 0;
        pivot < size;
        pivot++
    ){

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
        /* HACER CEROS ABAJO */
        /* ===================== */
        for(
            let row = pivot + 1;
            row < size;
            row++
        ){

            const factor =

                matrix[row][pivot]
                .div(pivotValue);

            if(factor.equals(0))
                continue;

            for(
                let col = pivot;
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
                "Se eliminan los elementos debajo del pivote.",

                matrix:
                    cloneAugmented(matrix),

                pivot:
                    pivot + 1
            });
        }
    }

    /* ===================== */
    /* SUSTITUCION REGRESIVA */
    /* ===================== */
    let solutions =
        Array(size).fill(
            new Fraction(0)
        );

    for(
        let i = size - 1;
        i >= 0;
        i--
    ){

        let sum =
            new Fraction(0);

        for(
            let j = i + 1;
            j < size;
            j++
        ){

            sum = sum.add(

                matrix[i][j]
                .mul(solutions[j])
            );
        }

        solutions[i] =

            matrix[i][size]
            .sub(sum)
            .div(matrix[i][i]);

        steps.push({

            operation:
            `
            x_${i+1}
            =
            \\frac{
                ${fractionToLatex(matrix[i][size])}
                -
                ${fractionToLatex(sum)}
            }{
                ${fractionToLatex(matrix[i][i])}
            }
            `,

            description:
            "Se aplica sustitución regresiva.",

            matrix:
                cloneAugmented(matrix),

            pivot:
                i + 1
        });
    }

    return {

        matrix,
        steps,
        solutions
    };
}

/* ===================== */
/* RENDER GAUSS */
/* ===================== */
function renderGaussianElimination(result){

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

    if(window.MathJax){

        MathJax.typesetPromise();
    }
}