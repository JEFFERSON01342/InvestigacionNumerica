/* ===================== */
/* OPERACIONES.JS */
/* ===================== */

/* ===================== */
/* STATE */
/* ===================== */
let operationRowsA = 3;
let operationColsA = 3;

let operationRowsB = 3;
let operationColsB = 3;

let operationMatrixA =
    createRectangularMatrix(
        operationRowsA,
        operationColsA
    );

let operationMatrixB =
    createRectangularMatrix(
        operationRowsB,
        operationColsB
    );

/* ===================== */
/* REFERENCES */
/* ===================== */
const matrixAContainer =
    document.getElementById(
        "operation-matrix-a"
    );

const matrixBContainer =
    document.getElementById(
        "operation-matrix-b"
    );

const sizeInputA =
    document.getElementById(
        "matrix-size-a"
    );

const sizeInputB =
    document.getElementById(
        "matrix-size-b"
    );

const operationsResult =
    document.getElementById(
        "operations-result"
    );

const operationsProcedure =
    document.getElementById(
        "operations-procedure"
    );

/* ===================== */
/* CREATE RECTANGULAR */
/* ===================== */
function createRectangularMatrix(
    rows,
    cols
){

    return Array.from(
        { length: rows },
        () =>
            Array(cols).fill("")
    );
}

/* ===================== */
/* PARSE SIZE */
/* ===================== */
function parseMatrixSize(value){

    const clean =
        value
        .toLowerCase()
        .replace(/\s/g,"");

    const match =
        clean.match(/^(\d+)x(\d+)$/);

    if(!match)
        return null;

    return {
        rows:
            parseInt(match[1]),

        cols:
            parseInt(match[2])
    };
}

/* ===================== */
/* RENDER MATRIX A */
/* ===================== */
function renderOperationMatrixA(){

    matrixAContainer.innerHTML =
        "";

    matrixAContainer.style
        .gridTemplateColumns =
        `repeat(${operationColsA}, auto)`;

    for(
        let i = 0;
        i < operationRowsA;
        i++
    ){

        for(
            let j = 0;
            j < operationColsA;
            j++
        ){

            const input =
                document.createElement(
                    "input"
                );

            input.type =
                "text";

            input.className =
                "matrix-input";

            input.placeholder =
                "0";

            input.value =
                operationMatrixA[i][j];

            input.addEventListener(
                "input",
                () => {

                    operationMatrixA[i][j] =
                        input.value.trim();
                }
            );

            matrixAContainer
                .appendChild(
                    input
                );
        }
    }
}

/* ===================== */
/* RENDER MATRIX B */
/* ===================== */
function renderOperationMatrixB(){

    matrixBContainer.innerHTML =
        "";

    matrixBContainer.style
        .gridTemplateColumns =
        `repeat(${operationColsB}, auto)`;

    for(
        let i = 0;
        i < operationRowsB;
        i++
    ){

        for(
            let j = 0;
            j < operationColsB;
            j++
        ){

            const input =
                document.createElement(
                    "input"
                );

            input.type =
                "text";

            input.className =
                "matrix-input";

            input.placeholder =
                "0";

            input.value =
                operationMatrixB[i][j];

            input.addEventListener(
                "input",
                () => {

                    operationMatrixB[i][j] =
                        input.value.trim();
                }
            );

            matrixBContainer
                .appendChild(
                    input
                );
        }
    }
}

/* ===================== */
/* UPDATE SIZE A */
/* ===================== */
sizeInputA.addEventListener(
    "change",
    () => {

        const parsed =
            parseMatrixSize(
                sizeInputA.value
            );

        if(!parsed){

            alert(
                "Formato inválido. Ejemplo: 3x4"
            );

            return;
        }

        operationRowsA =
            parsed.rows;

        operationColsA =
            parsed.cols;

        operationMatrixA =
            createRectangularMatrix(
                operationRowsA,
                operationColsA
            );

        renderOperationMatrixA();
    }
);

/* ===================== */
/* UPDATE SIZE B */
/* ===================== */
sizeInputB.addEventListener(
    "change",
    () => {

        const parsed =
            parseMatrixSize(
                sizeInputB.value
            );

        if(!parsed){

            alert(
                "Formato inválido. Ejemplo: 2x3"
            );

            return;
        }

        operationRowsB =
            parsed.rows;

        operationColsB =
            parsed.cols;

        operationMatrixB =
            createRectangularMatrix(
                operationRowsB,
                operationColsB
            );

        renderOperationMatrixB();
    }
);

/* ===================== */
/* GET MATRIX A */
/* ===================== */
function getOperationMatrixA(){

    return operationMatrixA.map(
        row =>

            row.map(
                value =>
                    new Fraction(
                        value || 0
                    )
            )
    );
}

/* ===================== */
/* GET MATRIX B */
/* ===================== */
function getOperationMatrixB(){

    return operationMatrixB.map(
        row =>

            row.map(
                value =>
                    new Fraction(
                        value || 0
                    )
            )
    );
}

/* ===================== */
/* ADD MATRICES */
/* ===================== */
function addMatrices(A,B){

    return A.map(
        (row,i) =>

            row.map(
                (cell,j) =>

                    cell.add(
                        B[i][j]
                    )
            )
    );
}

/* ===================== */
/* SUBTRACT MATRICES */
/* ===================== */
function subtractMatrices(A,B){

    return A.map(
        (row,i) =>

            row.map(
                (cell,j) =>

                    cell.sub(
                        B[i][j]
                    )
            )
    );
}

/* ===================== */
/* MULTIPLY MATRICES */
/* ===================== */
function multiplyMatrices(A,B){

    const rows =
        A.length;

    const cols =
        B[0].length;

    const common =
        B.length;

    let result =
        Array.from(
            { length: rows },
            () =>
                Array(cols)
                .fill(null)
        );

    for(
        let i = 0;
        i < rows;
        i++
    ){

        for(
            let j = 0;
            j < cols;
            j++
        ){

            let sum =
                new Fraction(0);

            for(
                let k = 0;
                k < common;
                k++
            ){

                sum =
                    sum.add(
                        A[i][k].mul(
                            B[k][j]
                        )
                    );
            }

            result[i][j] =
                sum;
        }
    }

    return result;
}

/* ===================== */
/* TRANSPOSE */
/* ===================== */
function transposeMatrix(matrix){

    return matrix[0].map(
        (_, col) =>

            matrix.map(
                row => row[col]
            )
    );
}

/* ===================== */
/* IDENTITY */
/* ===================== */
function identityMatrix(size){

    return Array.from(
        { length: size },
        (_,i) =>

            Array.from(
                { length: size },
                (_,j) =>

                    new Fraction(
                        i === j
                        ? 1
                        : 0
                    )
            )
    );
}

/* ===================== */
/* AUGMENTED MATRIX */
/* ===================== */
function augmentedMatrixLatex(A,I){

    const rows = A.map(
        (row,i) => {

            const left =
                row.map(
                    fractionToLatex
                ).join(" & ");

            const right =
                I[i].map(
                    fractionToLatex
                ).join(" & ");

            return `${left} & | & ${right}`;
        }
    ).join(" \\\\ ");

    return `
    \\begin{bmatrix}
    ${rows}
    \\end{bmatrix}
    `;
}

/* ===================== */
/* INVERSE */
/* ===================== */
function inverseMatrix(matrix){

    const n =
        matrix.length;

    let A =
        cloneMatrix(matrix);

    let I =
        identityMatrix(n);

    let steps = "";

    steps += `
    <div class="pivot-info">

        $$
        [A|I]
        =
        ${augmentedMatrixLatex(A,I)}
        $$

    </div>
    `;

    for(
        let i = 0;
        i < n;
        i++
    ){

        let pivot =
            A[i][i];

        if(pivot.valueOf() === 0){

            throw new Error(
                "La matriz no tiene inversa."
            );
        }

        steps += `
        <div class="pivot-info">

            $$
            F_${i+1}
            \\leftarrow
            \\frac{
                F_${i+1}
            }{
                ${fractionToLatex(pivot)}
            }
            $$

        </div>
        `;

        for(
            let j = 0;
            j < n;
            j++
        ){

            A[i][j] =
                A[i][j].div(pivot);

            I[i][j] =
                I[i][j].div(pivot);
        }

        steps += `
        <div class="step-latex-matrix">

            $$
            ${augmentedMatrixLatex(A,I)}
            $$

        </div>
        `;

        for(
            let k = 0;
            k < n;
            k++
        ){

            if(k === i)
                continue;

            const factor =
                A[k][i];

            steps += `
            <div class="pivot-info">

                $$
                F_${k+1}
                \\leftarrow
                F_${k+1}
                -
                (${fractionToLatex(factor)})
                F_${i+1}
                $$

            </div>
            `;

            for(
                let j = 0;
                j < n;
                j++
            ){

                A[k][j] =
                    A[k][j].sub(
                        factor.mul(
                            A[i][j]
                        )
                    );

                I[k][j] =
                    I[k][j].sub(
                        factor.mul(
                            I[i][j]
                        )
                    );
            }

            steps += `
            <div class="step-latex-matrix">

                $$
                ${augmentedMatrixLatex(A,I)}
                $$

            </div>
            `;
        }
    }

    return {
        inverse: I,
        steps
    };
}

/* ===================== */
/* ELEMENT OPERATIONS */
/* ===================== */
function generateElementOperationSteps(
    A,
    B,
    result,
    operator
){

    let html = "";

    for(
        let i = 0;
        i < A.length;
        i++
    ){

        for(
            let j = 0;
            j < A[0].length;
            j++
        ){

            const a =
                fractionToLatex(
                    A[i][j]
                );

            const b =
                fractionToLatex(
                    B[i][j]
                );

            const r =
                fractionToLatex(
                    result[i][j]
                );

            html += `
            <div class="pivot-info">

                $$
                c_{${i+1},${j+1}}
                =
                ${a}
                ${operator}
                ${b}
                =
                ${r}
                $$

            </div>
            `;
        }
    }

    return html;
}

/* ===================== */
/* MULTIPLICATION STEPS */
/* ===================== */
function generateMultiplicationSteps(
    A,
    B,
    result
){

    let html = "";

    for(
        let i = 0;
        i < A.length;
        i++
    ){

        for(
            let j = 0;
            j < B[0].length;
            j++
        ){

            let expression = "";

            for(
                let k = 0;
                k < B.length;
                k++
            ){

                expression +=
                `(${fractionToLatex(A[i][k])})`;

                expression +=
                `(${fractionToLatex(B[k][j])})`;

                if(
                    k < B.length - 1
                ){

                    expression += "+";
                }
            }

            html += `
            <div class="pivot-info">

                $$
                c_{${i+1},${j+1}}
                =
                ${expression}
                =
                ${fractionToLatex(
                    result[i][j]
                )}
                $$

            </div>
            `;
        }
    }

    return html;
}

/* ===================== */
/* TRANSPOSE STEPS */
/* ===================== */
function generateTransposeSteps(
    original
){

    let html = "";

    for(
        let i = 0;
        i < original.length;
        i++
    ){

        for(
            let j = 0;
            j < original[0].length;
            j++
        ){

            html += `
            <div class="pivot-info">

                $$
                a_{${i+1},${j+1}}
                \\rightarrow
                a_{${j+1},${i+1}}
                $$

            </div>
            `;
        }
    }

    return html;
}

/* ===================== */
/* SHOW RESULT */
/* ===================== */
function renderOperationResult(
    title,
    matrix
){

    operationsResult.innerHTML =
    `
    <div class="result-card">

        <h3>
            ${title}
        </h3>

        <div class="step-latex-matrix">

            $$
            ${matrixToLatex(matrix)}
            $$

        </div>

    </div>
    `;

    if(window.MathJax){

        MathJax.typesetPromise();
    }
}

/* ===================== */
/* SHOW PROCEDURE */
/* ===================== */
function renderOperationProcedure(
    operation,
    A,
    B,
    result,
    extraSteps = ""
){

    operationsProcedure.innerHTML =
    `
    <div class="step-card">

        <div class="step-header">

            <div class="step-number">
                1
            </div>

            <div class="step-title">
                Procedimiento
            </div>

        </div>

        <div class="step-operation">

            $$
            ${operation}
            $$

        </div>

        <div class="step-latex-matrix">

            $$
            ${matrixToLatex(A)}
            $$

        </div>

        ${
            B
            ?
            `
            <div class="step-latex-matrix">

                $$
                ${matrixToLatex(B)}
                $$

            </div>
            `
            :
            ""
        }

        ${extraSteps}

        <div class="step-latex-matrix">

            $$
            ${matrixToLatex(result)}
            $$

        </div>

    </div>
    `;

    if(window.MathJax){

        MathJax.typesetPromise();
    }
}

/* ===================== */
/* SUM */
/* ===================== */
function solveAddition(){

    const A =
        getOperationMatrixA();

    const B =
        getOperationMatrixB();

    if(
        operationRowsA !==
        operationRowsB
        ||
        operationColsA !==
        operationColsB
    ){

        alert(
            "Las matrices deben tener el mismo tamaño."
        );

        return;
    }

    const result =
        addMatrices(A,B);

    renderOperationResult(
        "A + B",
        result
    );

    renderOperationProcedure(
        "A+B",
        A,
        B,
        result,
        generateElementOperationSteps(
            A,
            B,
            result,
            "+"
        )
    );
}

/* ===================== */
/* SUBTRACT */
/* ===================== */
function solveSubtraction(){

    const A =
        getOperationMatrixA();

    const B =
        getOperationMatrixB();

    if(
        operationRowsA !==
        operationRowsB
        ||
        operationColsA !==
        operationColsB
    ){

        alert(
            "Las matrices deben tener el mismo tamaño."
        );

        return;
    }

    const result =
        subtractMatrices(A,B);

    renderOperationResult(
        "A - B",
        result
    );

    renderOperationProcedure(
        "A-B",
        A,
        B,
        result,
        generateElementOperationSteps(
            A,
            B,
            result,
            "-"
        )
    );
}

/* ===================== */
/* MULTIPLY */
/* ===================== */
function solveMultiplication(){

    const A =
        getOperationMatrixA();

    const B =
        getOperationMatrixB();

    if(
        operationColsA !==
        operationRowsB
    ){

        alert(
            "Columnas de A deben coincidir con filas de B."
        );

        return;
    }

    const result =
        multiplyMatrices(A,B);

    renderOperationResult(
        "A × B",
        result
    );

    renderOperationProcedure(
        "A\\times B",
        A,
        B,
        result,
        generateMultiplicationSteps(
            A,
            B,
            result
        )
    );
}

/* ===================== */
/* TRANSPOSE A */
/* ===================== */
function transposeA(){

    const A =
        getOperationMatrixA();

    const result =
        transposeMatrix(A);

    renderOperationResult(
        "Aᵀ",
        result
    );

    renderOperationProcedure(
        "A^T",
        A,
        null,
        result,
        generateTransposeSteps(A)
    );
}

/* ===================== */
/* TRANSPOSE B */
/* ===================== */
function transposeB(){

    const B =
        getOperationMatrixB();

    const result =
        transposeMatrix(B);

    renderOperationResult(
        "Bᵀ",
        result
    );

    renderOperationProcedure(
        "B^T",
        B,
        null,
        result,
        generateTransposeSteps(B)
    );
}

/* ===================== */
/* INVERSE A */
/* ===================== */
function inverseA(){

    if(
        operationRowsA !==
        operationColsA
    ){

        alert(
            "A debe ser cuadrada."
        );

        return;
    }

    try{

        const A =
            getOperationMatrixA();

        const data =
            inverseMatrix(A);

        const result =
            data.inverse;

        renderOperationResult(
            "A⁻¹",
            result
        );

        renderOperationProcedure(
            "A^{-1}",
            A,
            null,
            result,
            data.steps
        );
    }
    catch(error){

        alert(
            error.message
        );
    }
}

/* ===================== */
/* INVERSE B */
/* ===================== */
function inverseB(){

    if(
        operationRowsB !==
        operationColsB
    ){

        alert(
            "B debe ser cuadrada."
        );

        return;
    }

    try{

        const B =
            getOperationMatrixB();

        const data =
            inverseMatrix(B);

        const result =
            data.inverse;

        renderOperationResult(
            "B⁻¹",
            result
        );

        renderOperationProcedure(
            "B^{-1}",
            B,
            null,
            result,
            data.steps
        );
    }
    catch(error){

        alert(
            error.message
        );
    }
}

/* ===================== */
/* GLOBAL FUNCTIONS */
/* ===================== */
window.solveAddition =
    solveAddition;

window.solveSubtraction =
    solveSubtraction;

window.solveMultiplication =
    solveMultiplication;

window.transposeA =
    transposeA;

window.transposeB =
    transposeB;

window.inverseA =
    inverseA;

window.inverseB =
    inverseB;

/* ===================== */
/* INIT */
/* ===================== */
renderOperationMatrixA();

renderOperationMatrixB();