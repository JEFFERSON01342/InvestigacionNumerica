/* ===================== */
/* SIDEBAR NAVIGATION */
/* ===================== */
const sidebarButtons =
    document.querySelectorAll(
        ".sidebar-option"
    );

const screens =
    document.querySelectorAll(
        ".screen"
    );

sidebarButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                /* REMOVE ACTIVE */
                sidebarButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );
                    }
                );

                /* ACTIVE BUTTON */
                button.classList.add(
                    "active"
                );

                /* HIDE SCREENS */
                screens.forEach(
                    screen => {

                        screen.classList.remove(
                            "active-screen"
                        );
                    }
                );

                /* SHOW TARGET */
                const target =
                    button.dataset.screen;

                document
                    .getElementById(
                        `screen-${target}`
                    )
                    .classList.add(
                        "active-screen"
                    );
            }
        );
    }
);

/* ===================== */
/* DOM REFERENCES */
/* ===================== */

/* DETERMINANTS */
const matrixContainer =
    document.getElementById(
        "matrix-container"
    );

const matrixSizeDisplay =
    document.getElementById(
        "matrix-size-display"
    );

const addSizeBtn =
    document.getElementById(
        "add-size"
    );

const removeSizeBtn =
    document.getElementById(
        "remove-size"
    );

/* SYSTEMS */
const addSystemSizeBtn =
    document.getElementById(
        "add-system-size"
    );

const removeSystemSizeBtn =
    document.getElementById(
        "remove-system-size"
    );

const initialValuesContainer =
    document.getElementById(
        "initial-values-container"
    );

/* ===================== */
/* GLOBAL MATRIX STATE */
/* ===================== */

/* DETERMINANTS */
let matrixSize = 3;

let matrixData =
    createMatrixData(
        matrixSize
    );




/* INITIAL VALUES */
let initialValues =
    Array(systemSize).fill("0");

/* ===================== */
/* RENDER MATRIX */
/* ===================== */
function renderMatrix(){

    matrixContainer.innerHTML =
        "";

    matrixContainer.style
        .gridTemplateColumns =
        `repeat(${matrixSize}, auto)`;

    for(
        let i = 0;
        i < matrixSize;
        i++
    ){

        for(
            let j = 0;
            j < matrixSize;
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
                matrixData[i][j] ?? "";

            input.addEventListener(
                "input",
                () => {

                    const value =
                        input.value.trim();

                    try{

                        new Fraction(
                            value || 0
                        );

                        input.style
                            .borderColor =
                            "#fecaca";

                        matrixData[i][j] =
                            value;
                    }
                    catch{

                        input.style
                            .borderColor =
                            "red";
                    }
                }
            );

            matrixContainer
                .appendChild(
                    input
                );
        }
    }

    matrixSizeDisplay.textContent =
        `${matrixSize} × ${matrixSize}`;
}

/* ===================== */
/* RENDER INITIAL VALUES */
/* ===================== */
function renderInitialValues(){

    if(!initialValuesContainer)
        return;

    initialValuesContainer.innerHTML =
        "";

    initialValuesContainer.style
        .gridTemplateColumns =
        "repeat(1, auto)";

    const vars =
        [
            "x",
            "y",
            "z",
            "w",
            "v",
            "u",
            "t",
            "s"
        ];

    for(
        let i = 0;
        i < systemSize;
        i++
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
            `${vars[i]}₀`;

        input.value =
            initialValues[i] ?? "0";

        input.addEventListener(
            "input",
            () => {

                initialValues[i] =
                    input.value;
            }
        );

        initialValuesContainer
            .appendChild(
                input
            );
    }
}

/* ===================== */
/* ADD MATRIX SIZE */
/* ===================== */
addSizeBtn.addEventListener(
    "click",
    () => {

        if(matrixSize >= 10)
            return;

        const newSize =
            matrixSize + 1;

        const newMatrix =
            createMatrixData(
                newSize
            );

        /* COPY DATA */
        for(
            let i = 0;
            i < matrixSize;
            i++
        ){

            for(
                let j = 0;
                j < matrixSize;
                j++
            ){

                newMatrix[i][j] =
                    matrixData[i]?.[j]
                    ?? "";
            }
        }

        matrixSize =
            newSize;

        matrixData =
            newMatrix;

        renderMatrix();
    }
);

/* ===================== */
/* REMOVE MATRIX SIZE */
/* ===================== */
removeSizeBtn.addEventListener(
    "click",
    () => {

        if(matrixSize <= 1)
            return;

        const newSize =
            matrixSize - 1;

        const newMatrix =
            createMatrixData(
                newSize
            );

        /* COPY DATA */
        for(
            let i = 0;
            i < newSize;
            i++
        ){

            for(
                let j = 0;
                j < newSize;
                j++
            ){

                newMatrix[i][j] =
                    matrixData[i]?.[j]
                    ?? "";
            }
        }

        matrixSize =
            newSize;

        matrixData =
            newMatrix;

        renderMatrix();
    }
);

/* ===================== */
/* SYSTEM SIZE CONTROLS */
/* ===================== */
if(addSystemSizeBtn){

    addSystemSizeBtn.addEventListener(
        "click",
        () => {

            setTimeout(
                () => {

                    initialValues =
                        Array(systemSize).fill("0");

                    renderInitialValues();

                },
                0
            );
        }
    );
}
if(removeSystemSizeBtn){

    removeSystemSizeBtn.addEventListener(
        "click",
        () => {

            setTimeout(
                () => {

                    initialValues =
                        Array(systemSize).fill("0");

                    renderInitialValues();

                },
                0
            );
        }
    );
}

/* ===================== */
/* GET MATRIX */
/* ===================== */
function getMatrix(){

    return matrixData.map(
        row =>

            row.map(
                value => {

                    try{

                        return new Fraction(
                            value || 0
                        );
                    }
                    catch{

                        return new Fraction(
                            0
                        );
                    }
                }
            )
    );
}

/* ===================== */
/* RENDER LATEX MATRIX */
/* ===================== */
function renderLatexMatrix(matrix){

    return `
    $$
    ${matrixToLatex(matrix)}
    $$
    `;
}

/* ===================== */
/* RENDER PROCEDURE */
/* ===================== */
function renderProcedure(result){

    const procedureContainer =
        document.getElementById(
            "procedure-content"
        );

    const resultContainer =
        document.getElementById(
            "determinant-result"
        );

    /* CLEAR */
    procedureContainer.innerHTML =
        "";

    /* RESULT */
    resultContainer.innerHTML =
    `
    <div class="result-card">

        <h3>
            Determinante
        </h3>

        <div class="result-value">

            $$
            ${fractionToLatex(
                result.determinant
            )}
            $$

        </div>

    </div>
    `;

    /* STEPS */
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

                    ${
                        step.operation ===
                        "Matriz inicial"

                        ? "Matriz inicial"

                        : `Paso ${index + 1}`
                    }

                </div>

            </div>

            <div class="pivot-info">

                Pivote actual:
                F${step.pivot ?? "-"}

            </div>

            <div class="step-description">

                ${
                    step.description
                    ?? ""
                }

            </div>

            <div class="step-operation">

                $$
                ${
                    step.operation
                    ?? ""
                }
                $$

            </div>

            <div class="step-latex-matrix">

                ${
                    renderLatexMatrix(
                        step.matrix
                    )
                }

            </div>
            `;

            procedureContainer
                .appendChild(
                    card
                );
        }
    );

    /* RENDER LATEX */
    if(window.MathJax){

        MathJax.typesetPromise();
    }
}

/* ===================== */
/* SOLVE DETERMINANT */
/* ===================== */
const solveButton =
    document.getElementById(
        "solve-determinant"
    );

solveButton.addEventListener(
    "click",
    () => {

        const matrix =
            getMatrix();

        const method =
            document.getElementById(
                "determinant-method"
            ).value;

        let result;

        if(method === "cramer"){

            result =
                determinantExpansion(
                    matrix
                );

            renderDeterminantExpansion(
                result
            );

            return;
        }

        if(method === "gauss"){

            result =
                determinantGaussian(
                    matrix
                );

            renderProcedure(
                result
            );

            return;
        }

        if(
            method ===
            "triangulation"
        ){

            result =
                determinantTriangulation(
                    matrix
                );

            renderProcedure(
                result
            );

            return;
        }

        if(method === "sarrus"){

            result =
                determinantSarrus(
                    matrix
                );

            renderDeterminantSarrus(
                result
            );

            return;
        }
    }
);

/* ===================== */
/* SYSTEM CONTROLLER */
/* ===================== */
document
.getElementById(
    "solve-system"
)
.addEventListener(
    "click",
    () => {

        const method =
            document.getElementById(
                "system-method"
            ).value;

        const A =
            getSystemMatrix();

        const B =
            getSystemVector();

        /* ITERATIVE CONFIG */
        const tolerance =
            parseFloat(
                document.getElementById(
                    "iterative-tolerance"
                ).value
            );

        const maxIterations =
            parseInt(
                document.getElementById(
                    "iterative-max-iterations"
                ).value
            );

        /* ===================== */
        /* VALIDATION FOR */
        /* ITERATIVE METHODS */
        /* ===================== */
        if(method === "jacobi" || method === "gauss-seidel"){ 
            const validation = validateSystemConvergence(A, B, method);
            const resultContainer = document.getElementById("system-result");
            const validationContainer = document.getElementById("validation-demo-container");

            // Reglas para el método (mostrar arriba de todo)
            let rulesHTML = '<div class="validation-rules">';
            rulesHTML += `<h4>Reglas para ${method === 'jacobi' ? 'Jacobi' : 'Gauss-Seidel'}</h4>`;
            rulesHTML += '<ul>';
            rulesHTML += '<li>Matriz cuadrada n×n.</li>';
            rulesHTML += '<li>La diagonal principal no debe contener ceros (a_ii \u2260 0).</li>';
            rulesHTML += '<li>Preferible: matriz estrictamente diagonalmente dominante por filas: |a_ii| &gt; Σ_{j≠i} |a_ij|. Esto garantiza convergencia.</li>';
            rulesHTML += '<li>Alternativa: la razón espectral del operador iterativo debe ser &lt; 1 (ρ &lt; 1).</li>';
            if(method === 'gauss-seidel'){
                rulesHTML += '<li>Adicional: si la matriz es simétrica definida positiva, la convergencia está garantizada.</li>';
            }
            rulesHTML += '</ul></div>';

            // Mostrar reglas y resultados de validación en su propio contenedor (no lo sobreescribe el procedimiento)
            if(validationContainer){
                validationContainer.innerHTML = rulesHTML + generateValidationHTML(validation);
                if(window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise();
            } else {
                // fallback al comportamiento anterior
                resultContainer.innerHTML = rulesHTML + generateValidationHTML(validation);
                if(window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise();
            }

            // Si hay errores, no continuar
            if(!validation.canSolve){
                if(window.MathJax){
                    MathJax.typesetPromise();
                }
                return;
            }
        }

        if(method === "cramer"){

            solveCramer(
                A,
                B
            );

            return;
        }

        if(
            method ===
            "gauss-jordan"
        ){

            const result =
                solveGaussJordan(
                    A,
                    B
                );

            renderGaussJordan(
                result
            );

            return;
        }

        if(
            method ===
            "gaussian"
        ){

            const result =
                solveGaussianElimination(
                    A,
                    B
                );

            renderGaussianElimination(
                result
            );

            return;
        }

        if(method === "LU"){

            const result =
                solveLU(
                    A,
                    B
                );

            renderLU(
                result
            );

            return;
        }

        if(
            method ===
            "jacobi"
        ){

            const result =
                solveJacobi(
                    A,
                    B,
                    initialValues,
                    tolerance,
                    maxIterations
                );

            renderJacobi(
                result
            );

            return;
        }

        if(
            method ===
            "gauss-seidel"
        ){

            const result =
                solveGaussSeidel(
                    A,
                    B,
                    initialValues,
                    tolerance,
                    maxIterations
                );

            renderGaussSeidel(
                result
            );

            return;
        }
    }
);

/* ===================== */
/* INIT */
/* ===================== */
renderMatrix();

renderInitialValues();

/* ===================== */
/* SHOW RULES ON METHOD CHANGE */
/* ===================== */
const systemMethodSelect = document.getElementById("system-method");
if(systemMethodSelect){

    const showRulesForMethod = (method) => {
        const resultContainer = document.getElementById("system-result");
        if(!resultContainer) return;

        if(method === 'jacobi' || method === 'gauss-seidel'){
            let rulesHTML = '<div class="validation-rules">';
            rulesHTML += `<h4>Reglas para ${method === 'jacobi' ? 'Jacobi' : 'Gauss-Seidel'}</h4>`;
            rulesHTML += '<ul>';
            rulesHTML += '<li>Matriz cuadrada n×n.</li>';
            rulesHTML += '<li>La diagonal principal no debe contener ceros (a_ii \u2260 0).</li>';
            rulesHTML += '<li>Preferible: matriz estrictamente diagonalmente dominante por filas: |a_ii| &gt; Σ_{j≠i} |a_ij|. Esto garantiza convergencia.</li>';
            rulesHTML += '<li>Alternativa: la razón espectral del operador iterativo debe ser &lt; 1 (ρ &lt; 1).</li>';
            if(method === 'gauss-seidel'){
                rulesHTML += '<li>Adicional: si la matriz es simétrica definida positiva, la convergencia está garantizada.</li>';
            }
            rulesHTML += '</ul></div>';

            // Preserve validation details if already present
            const existingValidation = resultContainer.querySelector('.validation-container');
            resultContainer.innerHTML = rulesHTML + (existingValidation ? existingValidation.outerHTML : '');

            if(window.MathJax){
                MathJax.typesetPromise();
            }
        }
        else{
            // clear only the rules block if present
            const existingValidation = resultContainer.querySelector('.validation-container');
            if(existingValidation){
                resultContainer.innerHTML = existingValidation.outerHTML;
            } else {
                resultContainer.innerHTML = '';
            }
        }
    };

    systemMethodSelect.addEventListener('change', (e) => {
        showRulesForMethod(e.target.value);
    });

    // show initial
    showRulesForMethod(systemMethodSelect.value);
}
