/* ===================== */
/* DETERMINANTE */
/* SARRUS 3x3 */
/* ===================== */

function determinantSarrus(matrix){

    if(
        matrix.length !== 3
        ||
        matrix.some(
            row => row.length !== 3
        )
    ){

        return {

            error:
                "La regla de Sarrus solo se puede aplicar a matrices 3×3.",

            determinant:
                new Fraction(0),

            steps: []
        };
    }

    const positiveDiagonals = [
        [
            matrix[0][0],
            matrix[1][1],
            matrix[2][2]
        ],
        [
            matrix[0][1],
            matrix[1][2],
            matrix[2][0]
        ],
        [
            matrix[0][2],
            matrix[1][0],
            matrix[2][1]
        ]
    ];

    const negativeDiagonals = [
        [
            matrix[0][2],
            matrix[1][1],
            matrix[2][0]
        ],
        [
            matrix[0][0],
            matrix[1][2],
            matrix[2][1]
        ],
        [
            matrix[0][1],
            matrix[1][0],
            matrix[2][2]
        ]
    ];

    const positiveProducts =
        positiveDiagonals.map(
            multiplySarrusDiagonal
        );

    const negativeProducts =
        negativeDiagonals.map(
            multiplySarrusDiagonal
        );

    const positiveSum =
        positiveProducts.reduce(
            (total, value) =>
                total.add(value),
            new Fraction(0)
        );

    const negativeSum =
        negativeProducts.reduce(
            (total, value) =>
                total.add(value),
            new Fraction(0)
        );

    const determinant =
        positiveSum.sub(
            negativeSum
        );

    return {

        determinant,

        steps: [
            {
                title:
                    "Matriz inicial",

                description:
                    "Se aplica Sarrus copiando mentalmente las dos primeras columnas a la derecha de la matriz.",

                matrix:
                    cloneMatrix(matrix)
            },
            {
                title:
                    "Diagonales positivas",

                description:
                    "Se multiplican las tres diagonales que bajan de izquierda a derecha.",

                diagonals:
                    positiveDiagonals,

                products:
                    positiveProducts,

                result:
                    positiveSum,

                sign:
                    "+"
            },
            {
                title:
                    "Diagonales negativas",

                description:
                    "Se multiplican las tres diagonales que suben de izquierda a derecha.",

                diagonals:
                    negativeDiagonals,

                products:
                    negativeProducts,

                result:
                    negativeSum,

                sign:
                    "-"
            },
            {
                title:
                    "Resta final",

                description:
                    "El determinante es la suma positiva menos la suma negativa.",

                operation:
                    `${fractionToLatex(positiveSum)} - (${fractionToLatex(negativeSum)})`,

                result:
                    determinant
            }
        ]
    };
}


function multiplySarrusDiagonal(diagonal){

    return diagonal.reduce(
        (total, value) =>
            total.mul(value),
        new Fraction(1)
    );
}


function renderDeterminantSarrus(result){

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

    if(result.error){

        resultContainer.innerHTML =
        `
        <div class="result-card">

            <h3>
                Sarrus
            </h3>

            <div class="result-value">
                ${result.error}
            </div>

        </div>
        `;

        return;
    }

    resultContainer.innerHTML =
    `
    <div class="result-card">

        <h3>
            Determinante por Sarrus
        </h3>

        <div class="result-value">

            $$
            \\det(A)
            =
            ${fractionToLatex(result.determinant)}
            $$

        </div>

    </div>
    `;

    result.steps.forEach(
        (step, index) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "step-card";

            card.innerHTML =
                renderSarrusStep(
                    step,
                    index
                );

            procedureContainer
                .appendChild(
                    card
                );
        }
    );

    if(window.MathJax){

        MathJax.typesetPromise();
    }
}


function renderSarrusStep(
    step,
    index
){

    let content = "";

    if(step.matrix){

        content =
        `
        <div class="step-latex-matrix">

            $$
            ${matrixToLatex(step.matrix)}
            $$

        </div>
        `;
    }

    if(step.diagonals){

        const operations =
            step.diagonals.map(
                (diagonal, diagonalIndex) =>
                    `
                    ${renderSarrusDiagonalProduct(diagonal)}
                    =
                    ${fractionToLatex(step.products[diagonalIndex])}
                    `
            ).join(
                " \\\\ "
            );

        const products =
            step.products.map(
                fractionToLatex
            ).join(
                " + "
            );

        content =
        `
        <div class="step-operation">

            $$
            \\begin{aligned}
            ${operations}
            \\\\
            ${step.sign === "+" ? "S_+" : "S_-"}
            =
            ${products}
            =
            ${fractionToLatex(step.result)}
            \\end{aligned}
            $$

        </div>
        `;
    }

    if(step.operation){

        content =
        `
        <div class="step-operation">

            $$
            \\det(A)
            =
            ${step.operation}
            =
            ${fractionToLatex(step.result)}
            $$

        </div>
        `;
    }

    return `
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

    ${content}
    `;
}


function renderSarrusDiagonalProduct(diagonal){

    return diagonal.map(
        value =>
            `(${fractionToLatex(value)})`
    ).join(
        ""
    );
}
