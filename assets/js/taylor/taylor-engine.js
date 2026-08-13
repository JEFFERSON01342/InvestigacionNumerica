// =====================
// TAYLOR-ENGINE.JS
// SERIES DE TAYLOR
// =====================


// =====================
// MÉTODO PRINCIPAL
// =====================

window.resolverTaylor =
function () {

    try {

        console.clear();

        console.log(
            "INICIANDO TAYLOR..."
        );

        // =====================
        // HTML
        // =====================

        const resultado =
            document.getElementById(
                "resultado-container"
            );

        const procedimiento =
            document.getElementById(
                "procedimiento-container"
            );

        const tbody =
            document.querySelector(
                "#tabla-taylor tbody"
            );

        const funcionOriginal =
            document.getElementById(
                "funcion-original-container"
            );

        const derivadasContainer =
            document.getElementById(
                "derivadas-container"
            );

        const polinomioContainer =
            document.getElementById(
                "polinomio-container"
            );

        const sustitucionContainer =
            document.getElementById(
                "sustitucion-container"
            );

        // =====================
        // VALIDAR HTML
        // =====================

        if (
            !resultado
            ||
            !procedimiento
            ||
            !tbody
        ) {

            console.error(
                "Faltan contenedores HTML"
            );

            return;
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

        if (funcionOriginal) {

            funcionOriginal.innerHTML =
                "";
        }

        if (derivadasContainer) {

            derivadasContainer.innerHTML =
                "";
        }

        if (polinomioContainer) {

            polinomioContainer.innerHTML =
                "";
        }

        if (sustitucionContainer) {

            sustitucionContainer.innerHTML =
                "";
        }

        // =====================
        // OBTENER MATHFIELD
        // =====================

        const mathField =
            document.getElementById(
                "funcion-taylor"
            );

        if (!mathField) {

            mostrarErrorTaylor(
                "MathField no encontrado."
            );

            return;
        }

        // =====================
        // LATEX
        // =====================

        const latex =
            mathField
                .getValue()
                .trim();

        if (!latex) {

            mostrarErrorTaylor(
                "Ingrese una función."
            );

            return;
        }

        console.log(
            "LATEX:",
            latex
        );

        // =====================
        // LATEX → JS
        // =====================

        let expr =
            convertirLatexAJS(
                latex
            );

        if (!expr) {

            mostrarErrorTaylor(
                "Error convirtiendo función."
            );

            return;
        }

        // =====================
        // REEMPLAZAR POWER
        // =====================

        expr =
            expr.replace(
                /\*\*/g,
                "^"
            );

        console.log(
            "EXPRESIÓN:",
            expr
        );

        // =====================
        // DATOS
        // =====================

        const x0 =
            parseFloat(
                document
                    .getElementById(
                        "punto-a"
                    )
                    .value
            );

        const xEval =
            parseFloat(
                document
                    .getElementById(
                        "valor-x"
                    )
                    .value
            );

        const orden =
            parseInt(
                document
                    .getElementById(
                        "orden-taylor"
                    )
                    .value
            );

        // =====================
        // VALIDAR
        // =====================

        if (isNaN(x0)) {

            mostrarErrorTaylor(
                "Ingrese un punto a válido."
            );

            return;
        }

        if (isNaN(xEval)) {

            mostrarErrorTaylor(
                "Ingrese un valor x válido."
            );

            return;
        }

        if (
    isNaN(orden)
    ||
    orden < 0
) {

    mostrarErrorTaylor(
        "Orden inválido."
    );

    return;
}

        // =====================
        // MOSTRAR FUNCIÓN
        // =====================

        if (funcionOriginal) {

            funcionOriginal.innerHTML =

            `
            <div class="latex-box">

                $$

                f(x)=${latex}

                $$

            </div>
            `;
        }

        // =====================
        // VARIABLES
        // =====================

        let polinomioLatex =
            "";

        let aproximacion =
            0;

        let expresionActual =
            expr;

        // =====================
        // ITERACIONES
        // =====================

        for (

            let n = 0;
            n <= orden;
            n++

        ) {

            console.log(
                "ORDEN:",
                n
            );

            console.log(
                "EXPRESION:",
                expresionActual
            );

            // =====================
            // DERIVADA LATEX
            // =====================

            const derivadaLatex =
                obtenerLatexFuncion(
                    expresionActual
                );

            // =====================
            // EVALUAR
            // =====================

            let valorDerivada;

            try {

                valorDerivada =
                    math.evaluate(

                        expresionActual,

                        {
                            x: x0
                        }
                    );

            }
            catch (error) {

                console.error(
                    "ERROR EVALUANDO:",
                    error
                );

                mostrarErrorTaylor(
                    "Error evaluando derivada."
                );

                return;
            }

            console.log(
                "VALOR:",
                valorDerivada
            );

            if (

    isNaN(
        valorDerivada
    )

    ||

    !isFinite(
        valorDerivada
    )

) {

    mostrarErrorTaylor(

        `La derivada de orden ${n}
         no existe en x=${x0}`

    );

    return;
}

            // =====================
            // FACTORIAL
            // =====================

            const fact =
                factorial(n);

            // =====================
            // COEFICIENTE
            // =====================

            const coeficiente =
                valorDerivada
                /
                fact;

            // =====================
            // TERMINO NUMÉRICO
            // =====================

            const terminoValor =
                coeficiente
                *
                Math.pow(
                    xEval - x0,
                    n
                );

            aproximacion +=
                terminoValor;

            // =====================
            // TERMINO LATEX
            // =====================

            let terminoLatex =
                "";

            if (n === 0) {

                terminoLatex =
                    `${formatearNumero(
                        coeficiente
                    )}`;

            } else {

                terminoLatex =

                `
                ${formatearNumero(
                    coeficiente
                )}

                (x-${formatearNumero(
                    x0
                )})^{${n}}
                `;
            }

            // =====================
            // AGREGAR +
            // =====================

            if (
                n > 0
                &&
                coeficiente >= 0
            ) {

                polinomioLatex +=
                    "+";
            }

            polinomioLatex +=
                terminoLatex;

            // =====================
            // TABLA
            // =====================

            tbody.innerHTML +=

            `
            <tr>

                <td>
                    ${n}
                </td>

                <td>

                    $$

                    ${derivadaLatex}

                    $$

                </td>

                <td>
                    ${formatearNumero(
                        valorDerivada
                    )}
                </td>

                <td>

                    $$

                    ${terminoLatex}

                    $$

                </td>

            </tr>
            `;

            // =====================
            // DERIVADAS
            // =====================

            if (derivadasContainer) {

                derivadasContainer.innerHTML +=

                `
                <div class="derivada-item">

                    <p>

                        $$

                        f^{(${n})}(x)
                        =
                        ${derivadaLatex}

                        $$

                    </p>

                </div>
                `;
            }

            // =====================
            // PROCEDIMIENTO
            // =====================

            procedimiento.innerHTML +=

            `
            <div class="taylor-paso">

                <h3>
                    Orden ${n}
                </h3>

                <div class="latex-box">

                    <p>

                        $$

                        f^{(${n})}(x)
                        =
                        ${derivadaLatex}

                        $$

                    </p>

                    <p>

                        $$

                        f^{(${n})}(${x0})
                        =
                        ${formatearNumero(
                            valorDerivada
                        )}

                        $$

                    </p>

                    <p>

                        $$

                        \\frac{
                            f^{(${n})}(${x0})
                        }{
                            ${n}!
                        }

                        =
                        \\frac{
                            ${formatearNumero(
                                valorDerivada
                            )}
                        }{
                            ${fact}
                        }

                        =
                        ${formatearNumero(
                            coeficiente
                        )}

                        $$

                    </p>

                    <p>

                        $$

                        T_${n}(x)
                        =
                        ${terminoLatex}

                        $$

                    </p>

                </div>

            </div>
            `;

            // =====================
            // DERIVAR
            // =====================

            if (n < orden) {

                try {

                    const derivada =
                        math.derivative(

                            expresionActual,
                            "x"
                        );

                    expresionActual =
                        derivada.toString();

                }
                catch (error) {

                    console.error(
                        "ERROR DERIVANDO:",
                        error
                    );

                    mostrarErrorTaylor(
                        "No se pudo derivar."
                    );

                    return;
                }
            }
        }

        // =====================
        // POLINOMIO
        // =====================

        if (polinomioContainer) {

            polinomioContainer.innerHTML =

            `
            <div class="latex-box">

                $$

                P_${orden}(x)
                =
                ${polinomioLatex}

                $$

            </div>
            `;
        }

        // =====================
        // SUSTITUCIÓN
        // =====================

        if (sustitucionContainer) {

            sustitucionContainer.innerHTML =

            `
            <div class="latex-box">

                $$

                P_${orden}(${xEval})
                \\approx
                ${formatearNumero(
                    aproximacion
                )}

                $$

            </div>
            `;
        }

        // =====================
        // RESULTADO FINAL
        // =====================

        // =====================
// VALOR REAL
// =====================

let valorReal = NaN;

try {

    valorReal =
        math.evaluate(
            expr,
            {
                x: xEval
            }
        );

}
catch {

    valorReal = NaN;
}

// =====================
// ERRORES
// =====================

let errorAbsoluto = NaN;
let errorRelativo = NaN;

if (

    !isNaN(valorReal)

    &&

    isFinite(valorReal)

) {

    errorAbsoluto =

        Math.abs(

            valorReal
            -
            aproximacion

        );

    errorRelativo =

        errorAbsoluto

        /

        Math.abs(
            valorReal
        );
}

  resultado.innerHTML =

`
<div class="resultado-final">

    <h3>
        Resultado Final
    </h3>

    <p>

        $$

        P_${orden}(${xEval})
        =
        ${formatearNumero(
            aproximacion
        )}

        $$

    </p>

    <p>

        $$

        f(${xEval})
        =
        ${formatearNumero(
            valorReal
        )}

        $$

    </p>

    <hr>

    <p>

        Error absoluto:

        <b>

            ${formatearNumero(
                errorAbsoluto
            )}

        </b>

    </p>

    <p>

        Error relativo:

        <b>

            ${
                isFinite(
                    errorRelativo
                )

                ?

                (
                    errorRelativo
                    *
                    100
                ).toFixed(8)
                + "%"

                :

                "N/A"
            }

        </b>

    </p>

</div>
`;

        // =====================
        // MATHJAX
        // =====================

        refrescarMathJaxTaylor();

    }
    catch (error) {

        console.error(
            "ERROR GENERAL:",
            error
        );

        mostrarErrorTaylor(
            "Error interno del método."
        );
    }
};


// =====================
// FACTORIAL
// =====================

function factorial(n) {

    if (
        n === 0
        ||
        n === 1
    ) {

        return 1;
    }

    let resultado =
        1;

    for (

        let i = 2;
        i <= n;
        i++

    ) {

        resultado *= i;
    }

    return resultado;
}


// =====================
// FORMATEAR NÚMERO
// =====================

function formatearNumero(
    num
) {

    if (
        isNaN(num)
    ) {

        return "NaN";
    }

    if (
        !isFinite(num)
    ) {

        return "\\infty";
    }

    return Number(num)
        .toFixed(6)
        .replace(/\.?0+$/, "");
}


// =====================
// LATEX
// =====================

function obtenerLatexFuncion(
    expr
) {

    try {

        const nodo =
            math.parse(expr);

        return nodo.toTex({

            parenthesis:
                "keep"

        });

    }
    catch {

        return expr;
    }
}


// =====================
// ERROR
// =====================

function mostrarErrorTaylor(
    mensaje
) {

    const resultado =
        document.getElementById(
            "resultado-container"
        );

    if (!resultado) {

        console.error(
            mensaje
        );

        return;
    }

    resultado.innerHTML =

    `
    <div class="error-taylor">

        ${mensaje}

    </div>
    `;
}


// =====================
// REFRESCAR MATHJAX
// =====================

function refrescarMathJaxTaylor() {

    if (

        window.MathJax

        &&

        MathJax.typesetPromise

    ) {

        MathJax.typesetPromise();
    }
}


// =====================
// LIMPIAR
// =====================

window.limpiarTaylor =
function () {

    const ids = [

        "funcion-original-container",
        "derivadas-container",
        "polinomio-container",
        "sustitucion-container",
        "resultado-container",
        "procedimiento-container"

    ];

    ids.forEach(id => {

        const el =
            document.getElementById(
                id
            );

        if (el) {

            el.innerHTML =
                "";
        }
    });

    const tbody =
        document.querySelector(
            "#tabla-taylor tbody"
        );

    if (tbody) {

        tbody.innerHTML =
            "";
    }
};