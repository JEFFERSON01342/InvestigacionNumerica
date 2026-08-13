// =====================
// RENDER.JS
// TAYLOR
// =====================


// =====================
// INIT
// =====================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        configurarMathFieldTaylor();

        eventosTaylor();

        limpiarTaylor();
    }
);


// =====================
// CONFIGURAR MATHFIELD
// =====================

function configurarMathFieldTaylor() {

    try {

        const field =
            document.getElementById(
                "funcion-taylor"
            );

        if (!field) {

            return;
        }

        field.setOptions({

            virtualKeyboardMode:
                "onfocus",

            virtualKeyboards:
                "all",

            smartMode:
                true,

            smartFence:
                true,

            inlineShortcuts: {

                pi: "\\pi",

                sqrt: "\\sqrt{#0}",

                sin: "\\sin",

                cos: "\\cos",

                tan: "\\tan",

                ln: "\\ln",

                log: "\\log",

                alpha: "\\alpha",

                beta: "\\beta",

                theta: "\\theta"
            }
        });

        // =====================
        // PLACEHOLDER
        // =====================

        field.setAttribute(

            "placeholder",

            "Ejemplo: e^x"
        );

        // =====================
        // EJEMPLO INICIAL
        // =====================

        field.value =
            "e^x";

    } catch (error) {

        console.error(
            "ERROR MATHFIELD:",
            error
        );
    }
}


// =====================
// EVENTOS
// =====================

function eventosTaylor() {

    try {

        // =====================
        // BOTÓN CALCULAR
        // =====================

        const btnCalcular =
            document.getElementById(
                "btn-calcular-taylor"
            );

        if (btnCalcular) {

            btnCalcular.addEventListener(

                "click",

                () => {

                    resolverTaylor();
                }
            );
        }

        // =====================
        // BOTÓN LIMPIAR
        // =====================

        const btnLimpiar =
            document.getElementById(
                "btn-limpiar"
            );

        if (btnLimpiar) {

            btnLimpiar.addEventListener(

                "click",

                limpiarTaylor
            );
        }

    } catch (error) {

        console.error(
            "ERROR EVENTOS:",
            error
        );
    }
}


// =====================
// LIMPIAR
// =====================

window.limpiarTaylor =
function () {

    try {

        // =====================
        // FUNCIÓN
        // =====================

        const field =
            document.getElementById(
                "funcion-taylor"
            );

        if (field) {

            field.value =
                "e^x";
        }

        // =====================
        // INPUTS
        // =====================

        const orden =
            document.getElementById(
                "orden-taylor"
            );

        const punto =
            document.getElementById(
                "punto-a"
            );

        const valorX =
            document.getElementById(
                "valor-x"
            );

        if (orden) {

            orden.value = 5;
        }

        if (punto) {

            punto.value = 0;
        }

        if (valorX) {

            valorX.value = 1;
        }

        // =====================
        // CONTENEDORES
        // =====================

        limpiarContenedor(

            "funcion-original-container",

            "Aquí aparecerá la función..."
        );

        limpiarContenedor(

            "derivadas-container",

            "Aquí aparecerán las derivadas..."
        );

        limpiarContenedor(

            "polinomio-container",

            "Aquí aparecerá el polinomio..."
        );

        limpiarContenedor(

            "sustitucion-container",

            "Aquí aparecerá la sustitución..."
        );

        limpiarContenedor(

            "resultado-container",

            "Aquí aparecerá el resultado..."
        );

        limpiarContenedor(

            "procedimiento-container",

            ""
        );

        // =====================
        // TABLA
        // =====================

        const tbody =
            document.querySelector(
                "#tabla-taylor tbody"
            );

        if (tbody) {

            tbody.innerHTML =
                "";
        }

    } catch (error) {

        console.error(
            "ERROR LIMPIAR:",
            error
        );
    }
};


// =====================
// LIMPIAR CONTENEDOR
// =====================

function limpiarContenedor(

    id,
    texto

) {

    const elemento =
        document.getElementById(
            id
        );

    if (elemento) {

        elemento.innerHTML =
            texto;
    }
}


// =====================
// MOSTRAR FUNCIÓN
// =====================

window.mostrarFuncionOriginal =
function (
    latex
) {

    try {

        const container =
            document.getElementById(
                "funcion-original-container"
            );

        if (!container) {

            return;
        }

        container.innerHTML =

        `
        <div class="latex-box">

            $$

            f(x)=${latex}

            $$

        </div>
        `;

        refrescarMathJax();

    } catch (error) {

        console.error(
            "ERROR MOSTRAR FUNCIÓN:",
            error
        );
    }
};


// =====================
// MOSTRAR DERIVADA
// =====================

window.agregarDerivadaHTML =
function (

    orden,
    latex

) {

    try {

        const container =
            document.getElementById(
                "derivadas-container"
            );

        if (!container) {

            return;
        }

        container.innerHTML +=

        `
        <div class="derivada-card">

            <h3>

                Derivada orden ${orden}

            </h3>

            <div class="derivada-formula">

                $$

                f^{(${orden})}(x)=
                ${latex}

                $$

            </div>

        </div>
        `;

        refrescarMathJax();

    } catch (error) {

        console.error(
            "ERROR DERIVADA HTML:",
            error
        );
    }
};


// =====================
// AGREGAR FILA TABLA
// =====================

window.agregarFilaTaylor =
function (

    n,
    derivada,
    evaluacion,
    termino

) {

    try {

        const tbody =
            document.querySelector(
                "#tabla-taylor tbody"
            );

        if (!tbody) {

            return;
        }

        tbody.innerHTML +=

        `
        <tr>

            <td>
                ${n}
            </td>

            <td>

                $$${derivada}$$

            </td>

            <td>

                ${Number(
                    evaluacion
                ).toFixed(6)}

            </td>

            <td>

                $$${termino}$$

            </td>

        </tr>
        `;

        refrescarMathJax();

    } catch (error) {

        console.error(
            "ERROR FILA:",
            error
        );
    }
};


// =====================
// MOSTRAR POLINOMIO
// =====================

window.mostrarPolinomioTaylor =
function (
    latex
) {

    try {

        const container =
            document.getElementById(
                "polinomio-container"
            );

        if (!container) {

            return;
        }

        container.innerHTML =

        `
        <div class="latex-box">

            $$

            P_n(x)=
            ${latex}

            $$

        </div>
        `;

        refrescarMathJax();

    } catch (error) {

        console.error(
            "ERROR POLINOMIO:",
            error
        );
    }
};


// =====================
// MOSTRAR SUSTITUCIÓN
// =====================

window.mostrarSustitucionTaylor =
function (

    latex,
    valor

) {

    try {

        const container =
            document.getElementById(
                "sustitucion-container"
            );

        if (!container) {

            return;
        }

        container.innerHTML =

        `
        <div class="latex-box">

            <p>

                <b>
                    Sustituyendo valores:
                </b>

            </p>

            $$

            ${latex}

            $$

            <br>

            <h3 style="
                color:#991b1b;
            ">

                Aproximación ≈
                ${Number(
                    valor
                ).toFixed(10)}

            </h3>

        </div>
        `;

        refrescarMathJax();

    } catch (error) {

        console.error(
            "ERROR SUSTITUCIÓN:",
            error
        );
    }
};


// =====================
// RESULTADO FINAL
// =====================

window.mostrarResultadoTaylor =
function (

    aproximacion,
    real,
    errorAbs,
    errorRel,
    orden

) {

    try {

        const container =
            document.getElementById(
                "resultado-container"
            );

        if (!container) {

            return;
        }

        container.innerHTML =

        `
        <div class="resultado-final">

            <h3>

                Resultado Final

            </h3>

            <p>

                Orden del polinomio:

                <b>
                    ${orden}
                </b>

            </p>

            <p>

                Valor aproximado:

                <b>
                    ${Number(
                        aproximacion
                    ).toFixed(10)}
                </b>

            </p>

            <p>

                Valor real:

                <b>
                    ${Number(
                        real
                    ).toFixed(10)}
                </b>

            </p>

            <p>

                Error absoluto:

                <b>
                    ${Number(
                        errorAbs
                    ).toExponential(6)}
                </b>

            </p>

            <p>

                Error relativo:

                <b>
                    ${Number(
                        errorRel
                    ).toExponential(6)}
                </b>

            </p>

        </div>
        `;

    } catch (error) {

        console.error(
            "ERROR RESULTADO:",
            error
        );
    }
};


// =====================
// PASO HTML
// =====================

window.agregarPasoTaylor =
function (

    paso,
    contenido

) {

    try {

        const container =
            document.getElementById(
                "procedimiento-container"
            );

        if (!container) {

            return;
        }

        container.innerHTML +=

        `
        <div class="paso-card">

            <h3>

                Paso ${paso}

            </h3>

            <div class="latex-box">

                ${contenido}

            </div>

        </div>
        `;

        refrescarMathJax();

    } catch (error) {

        console.error(
            "ERROR PASO:",
            error
        );
    }
};


// =====================
// ERROR
// =====================

window.mostrarErrorTaylor =
function (
    mensaje
) {

    try {

        const container =
            document.getElementById(
                "resultado-container"
            );

        if (!container) {

            return;
        }

        container.innerHTML =

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

    } catch (error) {

        console.error(
            "ERROR MOSTRAR ERROR:",
            error
        );
    }
};


// =====================
// REFRESCAR MATHJAX
// =====================

window.refrescarMathJax =
function () {

    try {

        if (

            window.MathJax

            &&

            MathJax.typesetPromise

        ) {

            MathJax.typesetPromise();
        }

    } catch (error) {

        console.error(
            "ERROR MATHJAX:",
            error
        );
    }
};