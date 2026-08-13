// =====================
// NEWTON-SISTEMAS.JS
// NEWTON RAPHSON
// SISTEMAS NO LINEALES
// =====================


// =====================
// MÉTODO PRINCIPAL
// =====================

window.resolverNewtonSistemas =
function () {

    try {

        console.clear();

        console.log(
            "INICIANDO NEWTON..."
        );

        // =====================
        // OBTENER SISTEMA
        // =====================

        const sistema =
            obtenerSistema();

        if (!sistema) {

            return;
        }

        const {

            funciones,
            variables,
            valoresIniciales

        } = sistema;

        console.log(
            "FUNCIONES:",
            funciones
        );

        console.log(
            "VARIABLES:",
            variables
        );

        console.log(
            "X0:",
            valoresIniciales
        );

        // =====================
        // HTML
        // =====================

        const resultado =
            document.getElementById(
                "resultado-sistema"
            );

        const jacobianoContainer =
            document.getElementById(
                "jacobiano-container"
            );

        const procedimiento =
            document.getElementById(
                "procedimiento-container"
            );

        const tbody =
            document.querySelector(
                "#tabla-sistema tbody"
            );

        // Mostrar etiqueta de método arriba
        const metodoLabel = document.getElementById("metodo-label");
        if(metodoLabel){
            metodoLabel.innerText = "Método: Newton-Raphson (Multivariable)";
        }

        // =====================
        // LIMPIAR
        // =====================

        resultado.innerHTML =
            "";

        procedimiento.innerHTML =
            "";

        tbody.innerHTML =
            "";

        // =====================
        // CONFIG
        // =====================

        const tolerancia =
            parseFloat(

                document
                    .getElementById(
                        "tolerancia"
                    )
                    ?.value

            ) || 1e-6;

        const maxIter =
            parseInt(

                document
                    .getElementById(
                        "max-iter"
                    )
                    ?.value

            ) || 50;

        // =====================
        // CREAR JACOBIANO
        // =====================

        const jacobiano =
            crearJacobiano(

                funciones,
                variables
            );

        if (!jacobiano) {

            mostrarError(
                "No se pudo construir el Jacobiano."
            );

            return;
        }

        // =====================
        // MOSTRAR JACOBIANO
        // =====================

        jacobianoContainer.innerHTML =

        `
        <div class="jacobiano-box">

            <h3>
                Jacobiano simbólico
            </h3>

            <div class="latex-box">

                $$

                J(X)=
                ${jacobianoALatex(
                    jacobiano
                )}

                $$

            </div>

        </div>
        `;

        refrescarMathJax();

        // =====================
        // X ACTUAL
        // =====================

        let x =
            [...valoresIniciales];

        // =====================
        // ITERACIONES
        // =====================

        for (

            let iter = 1;
            iter <= maxIter;
            iter++

        ) {

            console.log(
                "ITERACIÓN:",
                iter
            );

            // =====================
            // F(X)
            // =====================

            const fx =
                evaluarSistemaNewton(

                    funciones,
                    variables,
                    x
                );

            if (!fx) {

                mostrarError(
                    "No se pudo evaluar F(X)."
                );

                return;
            }

            console.log(
                "F(X):",
                fx
            );

            // =====================
            // J(X)
            // =====================

            const jx =
                evaluarJacobiano(

                    jacobiano,
                    variables,
                    x
                );

            if (!jx) {

                mostrarError(
                    "No se pudo evaluar el Jacobiano."
                );

                return;
            }

            console.log(
                "J(X):",
                jx
            );

            // =====================
            // DETERMINANTE
            // =====================

            const det =
                determinanteJacobiano(
                    jx
                );

            console.log(
                "DET:",
                det
            );

            if (

                isNaN(det)

                ||

                Math.abs(det)
                <
                1e-12

            ) {

                mostrarError(
                    "Jacobiano singular. Cambia la aproximación inicial."
                );

                return;
            }

            // =====================
            // JΔX = -F(X)
            // =====================

            let delta;

            try {

                const menosFx =
                    fx.map(
                        v => -v
                    );

                console.log(
                    "-F(X):",
                    menosFx
                );

                delta =
                    math.lusolve(
                        jx,
                        menosFx
                    );

            } catch (error) {

                console.error(
                    "ERROR LUSOLVE:",
                    error
                );

                mostrarError(
                    "No se pudo resolver el sistema lineal."
                );

                return;
            }

            // =====================
            // APLANAR VECTOR
            // =====================

            delta =
                delta.map(

                    fila =>

                        Array.isArray(
                            fila
                        )

                        ? fila[0]

                        : fila
                );

            console.log(
                "DELTA:",
                delta
            );

            // =====================
            // VALIDAR DELTA
            // =====================

            const invalido =
                delta.some(

                    valor =>

                        isNaN(valor)

                        ||

                        !isFinite(valor)
                );

            if (invalido) {

                mostrarError(
                    "Se generaron valores inválidos."
                );

                return;
            }

            // =====================
            // NUEVO X
            // =====================

            const xNuevo =
                [];

            for (

                let i = 0;
                i < x.length;
                i++

            ) {

                xNuevo[i] =
                    x[i]
                    +
                    delta[i];
            }

            console.log(
                "X NUEVO:",
                xNuevo
            );

            // =====================
            // ERROR
            // =====================

            const error =
                calcularError(

                    x,
                    xNuevo
                );

            console.log(
                "ERROR:",
                error
            );

            // =====================
            // TABLA
            // =====================

            agregarFilaTabla(

                iter,
                xNuevo,
                delta,
                error
            );

            // =====================
            // PROCEDIMIENTO
            // =====================

            procedimiento.innerHTML +=

                crearPasoHTML(

                    iter,
                    x,
                    fx,
                    jx,
                    delta,
                    xNuevo,
                    error
                );

            refrescarMathJax();

            // =====================
            // ¿CONVERGIÓ?
            // =====================

            if (

                error
                <
                tolerancia

            ) {

                resultado.innerHTML =

                    crearResultadoFinal(

                        variables,
                        xNuevo,
                        iter,
                        error
                    );

                refrescarMathJax();

                return;
            }

            // =====================
            // SIGUIENTE ITERACIÓN
            // =====================

            x =
                [...xNuevo];
        }

        // =====================
        // NO CONVERGIÓ
        // =====================

        mostrarError(
            "Máximo de iteraciones alcanzado."
        );

    } catch (error) {

        console.error(
            "ERROR GENERAL:",
            error
        );

        mostrarError(
            "Error interno del método."
        );
    }
};


// =====================
// OBTENER SISTEMA
// =====================

function obtenerSistema() {

    const fields =
        document.querySelectorAll(
            ".ecuacion-field"
        );

    const funciones =
        [];

    const variables =
        obtenerVariables();

    // =====================
    // ECUACIONES
    // =====================

    for (

        let i = 0;
        i < fields.length;
        i++

    ) {

        let latex =
    fields[i]
        .getValue()
        .trim();

        if (!latex) {

            alert(
                `Falta ecuación ${i + 1}`
            );

            return null;
        }

        console.log(
            "LATEX:",
            latex
        );

        // =====================
        // SOPORTE =
        // =====================

        if (
            latex.includes("=")
        ) {

            const partes =
                latex.split("=");

            latex =
                `(${partes[0]})-(${partes[1]})`;
        }

        // =====================
        // LATEX → JS
        // =====================

        let expr =
            convertirLatexAJS(
                latex
            );

        // =====================
        // POWER
        // =====================

        expr =
            expr.replace(
                /\*\*/g,
                "^"
            );

        console.log(
            "EXPRESIÓN FINAL:",
            expr
        );

        funciones.push(
            expr
        );
    }

    // =====================
    // VALORES INICIALES
    // =====================

    const valoresIniciales =
        [];

    for (

        let i = 0;
        i < variables.length;
        i++

    ) {

        const input =
            document.getElementById(
                `valor-inicial-${i}`
            );

        let valor =
            parseFloat(
                input?.value
            );

        if (
            isNaN(valor)
        ) {

            valor = 1;
        }

        valoresIniciales.push(
            valor
        );
    }

    return {

        funciones,
        variables,
        valoresIniciales
    };
}


// =====================
// ERROR EUCLIDIANO
// =====================

function calcularError(

    anterior,
    nuevo

) {

    let suma =
        0;

    for (

        let i = 0;
        i < anterior.length;
        i++

    ) {

        suma +=
            Math.pow(

                nuevo[i]
                -
                anterior[i],

                2
            );
    }

    return Math.sqrt(
        suma
    );
}


// =====================
// TABLA ITERACIONES
// =====================

function agregarFilaTabla(

    iter,
    x,
    delta,
    error

) {

    const tbody =
        document.querySelector(
            "#tabla-sistema tbody"
        );

    let html =
        "<tr>";

    // =====================
    // ITERACIÓN
    // =====================

    html +=
        `<td>${iter}</td>`;

    // =====================
    // VARIABLES
    // =====================

    x.forEach(

        valor => {

            html +=
            `
            <td>
                ${valor.toFixed(6)}
            </td>
            `;
        }
    );

    // =====================
    // DELTAS
    // =====================

    delta.forEach(

        valor => {

            html +=
            `
            <td>
                ${valor.toFixed(6)}
            </td>
            `;
        }
    );

    // =====================
    // ERROR
    // =====================

    html +=
    `
    <td>
        ${error.toExponential(3)}
    </td>
    `;

    html +=
        "</tr>";

    tbody.innerHTML +=
        html;
}


// =====================
// PASO HTML
// =====================

function crearPasoHTML(

    iter,
    x,
    fx,
    jx,
    delta,
    xNuevo,
    error

) {

    return `

    <div class="card" style="margin-top:20px;">

        <h3>
            Iteración ${iter}
        </h3>

        <div class="latex-box">

            <p>
                <b>X:</b>
            </p>

            $$

            X=
            ${vectorALatex(x)}

            $$

            <p>
                <b>F(X):</b>
            </p>

            $$

            F(X)=
            ${vectorALatex(fx)}

            $$

            <p>
                <b>J(X):</b>
            </p>

            $$

            J(X)=
            ${matrizNumericaALatex(jx)}

            $$

            <p>
                <b>ΔX:</b>
            </p>

            $$

            \\Delta X=
            ${vectorALatex(delta)}

            $$

            <p>
                <b>X nuevo:</b>
            </p>

            $$

            X_{nuevo}=
            ${vectorALatex(xNuevo)}

            $$

            <p>

                <b>
                    Error:
                </b>

                ${error.toExponential(6)}

            </p>

        </div>

    </div>
    `;
}


// =====================
// RESULTADO FINAL
// =====================

function crearResultadoFinal(

    variables,
    valores,
    iteraciones,
    error

) {

    let html =

    `
    <div class="resultado-final">

        <h3>
            Solución encontrada
        </h3>
    `;

    for (

        let i = 0;
        i < variables.length;
        i++

    ) {

        html +=

        `
        <p>

            ${variables[i]} =

            <b>
                ${valores[i].toFixed(10)}
            </b>

        </p>
        `;
    }

    html +=

    `
        <p>

            Iteraciones:

            <b>
                ${iteraciones}
            </b>

        </p>

        <p>

            Error:

            <b>
                ${error.toExponential(6)}
            </b>

        </p>

    </div>
    `;

    return html;
}


// =====================
// MOSTRAR ERROR
// =====================

function mostrarError(
    mensaje
) {

    const resultado =
        document.getElementById(
            "resultado-sistema"
        );

    resultado.innerHTML =

    `
    <div style="

        background:#fee2e2;

        color:#991b1b;

        padding:18px;

        border-radius:16px;

        border:2px solid #fecaca;

        font-weight:bold;

    ">

        ${mensaje}

    </div>
    `;
}


// =====================
// REFRESCAR MATHJAX
// =====================

function refrescarMathJax() {

    if (

        window.MathJax

        &&

        MathJax.typesetPromise

    ) {

        MathJax.typesetPromise();
    }
}