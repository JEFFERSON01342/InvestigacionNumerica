// =====================
// NEWTON-ENGINE.JS
// INTERPOLACIÓN
// =====================


// =====================
// INIT
// =====================

document.addEventListener(
    "DOMContentLoaded",
    () => {
        const btn =
            document.getElementById(
                "btn-calcular"
            );

        if (btn) {
            btn.addEventListener(
                "click",
                resolverInterpolacion
            );
        }

        const btnEvaluar =
            document.getElementById(
                "btn-evaluar"
            );

        if (btnEvaluar) {
            btnEvaluar.addEventListener(
                "click",
                evaluarPolinomio
            );
        }
    }
);


// =====================
// MÉTODO PRINCIPAL
// =====================

window.resolverInterpolacion =
function () {

    try {

        const metodo =
            document
                .getElementById(
                    "metodo"
                )
                .value;

        if (
            metodo === "newton"
        ) {
            resolverNewton();
        } else if (
            metodo === "lagrange"
        ) {
            resolverLagrange();
        } else if (
            metodo === "trazadores"
        ) {
            resolverTrazadores();
        } else {
            alert(
                "Método no implementado aún."
            );
        }

    }
    catch (error) {
        console.error(error);
    }
};


// =====================
// NEWTON
// =====================

function resolverNewton() {

    const datos =
        obtenerDatosTabla();

    if (
        datos.length < 2
    ) {
        alert(
            "Ingrese al menos 2 puntos."
        );
        return;
    }

    // =====================
    // VALIDAR X DUPLICADOS
    // =====================

    const xValues =
        datos.map(
            d => d.x
        );

    const xUnicos =
        new Set(xValues);

    if (
        xUnicos.size !==
        xValues.length
    ) {
        alert(
            "Error: No puede haber valores de x duplicados. Cada punto debe tener un x único."
        );
        return;
    }

    const n =
        datos.length;

// =====================
// MATRIZ
// =====================

const tabla = [];

for (
    let i = 0;
    i < n;
    i++
) {
    tabla[i] = [];

    tabla[i][0] =
        aFraccion(
            datos[i].fx
        );
}

    // =====================
    // LIMPIAR PASOS
    // =====================

    document.getElementById(
        "procedimiento-diferencias"
    ).innerHTML = "";

    // =====================
    // DIFERENCIAS
    // =====================

    for (
        let j = 1;
        j < n;
        j++
    ) {
        for (
            let i = 0;
            i < n - j;
            i++
        ) {
            const numerador =
    restar(
        tabla[i + 1][j - 1],
        tabla[i][j - 1]
    );

const denominador =
    restar(
        aFraccion(
            datos[i + j].x
        ),
        aFraccion(
            datos[i].x
        )
    );

const valor =
    dividir(
        numerador,
        denominador
    );

            tabla[i][j] =
                valor;

            const fraccion = valor;

            // =====================
            // PASO
            // =====================

            agregarPaso(
                `Diferencia dividida orden ${j}`,
                `
                $$
                f[x_${i},...,x_${i+j}]
                =
                \\frac{
                    ${numerador.toLatex()}
                }{
                    ${denominador.toLatex()}
                }
                =
                ${fraccion.toLatex()}
                $$
                `
            );
        }
    }

    // =====================
    // TABLA
    // =====================

    mostrarTablaNewton(
        tabla,
        datos
    );

// =====================
// COEFICIENTES
// =====================

const coeficientes = [];

for (
    let j = 0;
    j < n;
    j++
) {
    coeficientes.push(
        tabla[0][j]
    );
}

    mostrarCoeficientes(
        coeficientes
    );

    // =====================
    // POLINOMIO
    // =====================

    construirPolinomio(
        tabla,
        datos
    );

    // =====================
    // SIMPLIFICAR POLINOMIO
    // =====================

    simplificarPolinomio(
        tabla,
        datos
    );

    // =====================
    // VERIFICACIÓN
    // =====================

    verificarPolinomio(
        tabla,
        datos
    );
}


// =====================
// CONSTRUIR POLINOMIO
// =====================

function construirPolinomio(
    tabla,
    datos
) {

    const n =
        datos.length;

    let latex =
        "P_n(x)=";

    for (
        let i = 0;
        i < n;
        i++
    ) {
        const coef =
    tabla[0][i];

        const coefDecimal =
            coef.toDecimal();

        // Agregar signo si es necesario
        if (
            i > 0
            &&
            coefDecimal >= 0
        ) {
            latex += "+";
        }

        latex +=
            `\\left(${coef.toLatex()}\\right)`;

        for (
            let j = 0;
            j < i;
            j++
        ) {
            const xj =
                datos[j].x;

            if (xj >= 0) {
                latex +=
                    `(x-${xj})`;
            } else {
                latex +=
                    `(x+${Math.abs(xj)})`;
            }
        }
    }

    mostrarConstruccion(
    latex
);
}

function construirExpresionNewton(
    tabla,
    datos
) {

    const n =
        datos.length;

    let expresion = "";

    for (
        let i = 0;
        i < n;
        i++
    ) {

        const coef =
            tabla[0][i];

        let coefTexto = "";

        if (
            coef.den === 1
        ) {
            coefTexto =
                `${coef.num}`;
        } else {
            coefTexto =
                `(${coef.num}/${coef.den})`;
        }

        let termino =
            coefTexto;

        for (
            let j = 0;
            j < i;
            j++
        ) {

            const xi =
                datos[j].x;

            if (
                xi >= 0
            ) {

                termino +=
                    `*(x-${xi})`;

            } else {

                termino +=
                    `*(x+${Math.abs(xi)})`;
            }
        }

        if (
            expresion !== ""
        ) {
            expresion += "+";
        }

        expresion += termino;
    }

    return expresion;
}
// =====================
// SIMPLIFICAR POLINOMIO
// =====================

// =====================
// SIMPLIFICAR POLINOMIO
// =====================

function simplificarPolinomio(
    tabla,
    datos
) {

    try {

        const n =
            datos.length;

        let html =
            `<div class="simplificacion-steps">`;

        // =====================
        // PASO 1: EXPRESIÓN NEWTON
        // =====================

        const expresion =
            construirExpresionNewton(
                tabla,
                datos
            );

        console.log(
            "Expresión Newton:",
            expresion
        );

        html +=
            `
            <div class="paso-simplificacion">
                <h3>
                    Paso 1: Forma de Newton
                </h3>
                <div class="latex-box">
                    $$P_n(x)=${expresion}$$
                </div>
            </div>
            `;

        // =====================
        // PASO 2: EXPANDIR TÉRMINOS
        // =====================

        html +=
            `
            <div class="paso-simplificacion">
                <h3>
                    Paso 2: Expandir cada término
                </h3>
            `;

        let expresionAcumulada = "";

        for (
            let i = 0;
            i < n;
            i++
        ) {

            const coef =
                tabla[0][i];

            let termino =
                `(${coef.num}`;

            if (
                coef.den !== 1
            ) {
                termino +=
                    `/${coef.den}`;
            }

            termino += `)`;

            for (
                let j = 0;
                j < i;
                j++
            ) {

                const xj =
                    datos[j].x;

                if (xj >= 0) {
                    termino +=
                        `(x-${xj})`;
                } else {
                    termino +=
                        `(x+${Math.abs(xj)})`;
                }
            }

            const terminoExpandido =
                nerdamer(
                    `expand(${termino})`
                ).toTeX();

            html +=
                `
                <div class="termino-expandido">
                    <p>
                        Término ${i + 1}:
                    </p>
                    <p style="margin-left: 20px;">
                        $$${terminoExpandido}$$
                    </p>
                </div>
                `;

            if (
                expresionAcumulada !== ""
            ) {
                expresionAcumulada +=
                    "+";
            }

            expresionAcumulada +=
                termino;
        }

        html += `</div>`;

        // =====================
        // PASO 3: SUMAR TÉRMINOS
        // =====================

        const expandida =
            nerdamer(
                `expand(${expresionAcumulada})`
            );

        const latexFinal =
            expandida.toTeX();

        html +=
            `
            <div class="paso-simplificacion">
                <h3>
                    Paso 3: Sumar y simplificar
                </h3>
                <div class="latex-box">
                    $$P_n(x)=${latexFinal}$$
                </div>
            </div>
            `;

        html += `</div>`;

        mostrarSimplificacion(
            html
        );

        mostrarPolinomioFinal(
            `P_n(x)=${latexFinal}`
        );

        // Guardar polinomio para visualización
        window.polinomioNewtonLatex = latexFinal;
        window.datosActuales = datos;

        refrescarMathJax();

    }
    catch (error) {

        console.error(
            "Error en simplificación:",
            error
        );

        mostrarSimplificacion(
            "No se pudo simplificar."
        );
    }
}

function verificarPolinomio(
    tabla,
    datos
) {

    let html =
    `
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>x</th>
                    <th>f(x)</th>
                    <th>P(x)</th>
                </tr>
            </thead>
            <tbody>
    `;

    datos.forEach(
        punto => {

            const valor =
                evaluarNewton(
                    tabla,
                    datos,
                    punto.x
                );

            html +=
            `
            <tr>
                <td>${punto.x}</td>
                <td>${punto.fx}</td>
                <td>$$${valor.toLatex()}$$</td>
            </tr>
            `;
        }
    );

    html +=
    `
            </tbody>
        </table>
    </div>
    `;

    mostrarVerificacion(
        html
    );

    refrescarMathJax();
}


// =====================
// EVALUAR NEWTON
// =====================

function evaluarNewton(
    tabla,
    datos,
    x
)
{
    const n =
        datos.length;

    let resultado =
        tabla[0][0].clone();

    for (
        let i = 1;
        i < n;
        i++
    ) {

        let termino =
            tabla[0][i].clone();

        for (
            let j = 0;
            j < i;
            j++
        ) {

            termino =
                multiplicar(
                    termino,
                    restar(
                        aFraccion(x),
                        aFraccion(
                            datos[j].x
                        )
                    )
                );
        }

        resultado =
            sumar(
                resultado,
                termino
            );
    }

    return resultado;
}


// =====================
// VERIFICAR
// =====================

function verificarPolinomio(
    tabla,
    datos
) {
    let html =
        `
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>x</th>
                    <th>f(x)</th>
                    <th>P(x)</th>
                </tr>
            </thead>
            <tbody>
    `;

    datos.forEach(
        punto => {
            const valor =
                evaluarNewton(
                    tabla,
                    datos,
                    punto.x
                );
            html +=
                `
            <tr>
                <td>${punto.x}</td>
                <td>${punto.fx}</td>
                <td>$$${valor.toLatex()}$$</td>
            </tr>
            `;
        }
    );

    html +=
        `
            </tbody>
        </table>
    </div>
    `;

    mostrarVerificacion(
        html
    );
}


// =====================
// EVALUAR POLINOMIO
// =====================

window.evaluarPolinomio =
function () {

    try {

        const xInput =
            document.getElementById(
                "x-evaluar"
            );

        if (!xInput || !xInput.value) {
            alert("Ingrese un valor de x");
            return;
        }

        const xValor =
            parseFloat(
                xInput.value
            );

        if (isNaN(xValor)) {
            alert("Valor de x inválido");
            return;
        }

        const datos =
            obtenerDatosTabla();

        if (datos.length < 2) {
            alert(
                "Primero calcule la interpolación"
            );
            return;
        }

        const n =
            datos.length;

        const tabla = [];

        for (
            let i = 0;
            i < n;
            i++
        ) {
            tabla[i] = [];

            tabla[i][0] =
                aFraccion(
                    datos[i].fx
                );
        }

        for (
            let j = 1;
            j < n;
            j++
        ) {
            for (
                let i = 0;
                i < n - j;
                i++
            ) {
                const numerador =
                    restar(
                        tabla[i + 1][j - 1],
                        tabla[i][j - 1]
                    );

                const denominador =
                    restar(
                        aFraccion(
                            datos[i + j].x
                        ),
                        aFraccion(
                            datos[i].x
                        )
                    );

                const valor =
                    dividir(
                        numerador,
                        denominador
                    );

                tabla[i][j] = valor;
            }
        }

        const resultado =
            evaluarNewton(
                tabla,
                datos,
                xValor
            );

        const html =
            `
            <div class="latex-box">
                <h3>
                    Resultado de la evaluación
                </h3>
                <p>
                    Para x = ${xValor}:
                </p>
                <p>
                    $$P_n(${xValor}) = ${resultado.toLatex()}$$
                </p>
                <p>
                    Valor decimal: <strong>${resultado.toDecimal()}</strong>
                </p>
            </div>
            `;

        document.getElementById(
            "evaluacion-container"
        ).innerHTML = html;

        refrescarMathJax();

    }
    catch (error) {

        console.error(
            "Error en evaluación:",
            error
        );

        alert(
            "Error al evaluar el polinomio"
        );
    }
};
