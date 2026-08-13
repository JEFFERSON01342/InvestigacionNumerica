// =====================
// VARIABLES PRIVADAS
// =====================

let grafica = null;
let cientifica = null;


// =====================
// INICIALIZAR DESMOS
// =====================

function iniciarDesmos() {

    console.log("INICIANDO DESMOS");

    inicializarGrafica();

    inicializarCalculadora();

    escucharCambios();

    console.log("DESMOS OK");
}


// =====================
// GRÁFICA
// =====================

function inicializarGrafica() {

    const elementoGrafica =
        document.getElementById(
            "grafica"
        );

    if (!elementoGrafica) {

        console.error(
            "No existe #grafica"
        );

        return;
    }

    grafica =
        Desmos.GraphingCalculator(

            elementoGrafica,

            {
                keypad: false,
                expressions: false,
                settingsMenu: false,
                zoomButtons: true
            }
        );

    console.log(
        "GRÁFICA INICIALIZADA"
    );
}


// =====================
// CALCULADORA
// =====================

function inicializarCalculadora() {

    const elementoCalc =
        document.getElementById(
            "cientifica"
        );

    if (!elementoCalc) {

        console.error(
            "No existe #cientifica"
        );

        return;
    }

    cientifica =
        Desmos.ScientificCalculator(

            elementoCalc
        );

    console.log(
        "CIENTIFICA INICIALIZADA"
    );
}


// =====================
// ESCUCHAR CAMBIOS
// =====================

function escucharCambios() {

    if (!cientifica) return;

    cientifica.observeEvent(

        "change",

        () => {

            actualizarGrafica();
        }
    );
}


// =====================
// ACTUALIZAR GRÁFICA
// =====================

function actualizarGrafica() {

    const latex =
        obtenerLatex();

    console.log(
        "LATEX:",
        latex
    );

    if (!latex) {

        limpiarGrafica();

        return;
    }

    // =====================
    // SI NO HAY x
    // =====================

    if (!latex.includes("x")) {

        limpiarGrafica();

        return;
    }

    try {

        grafica.setExpression({

            id: "funcion",

            latex: `y=${latex}`,

            color: "#dc2626"
        });

    } catch (error) {

        console.error(
            "ERROR AL GRAFICAR:",
            error
        );
    }
}


// =====================
// LIMPIAR GRÁFICA
// =====================

function limpiarGrafica() {

    if (!grafica) return;

    grafica.removeExpression({

        id: "funcion"
    });
}


// =====================
// OBTENER LATEX
// =====================

function obtenerLatex() {

    if (!cientifica) {

        return null;
    }

    try {

        // =====================
        // OBTENER ESTADO
        // =====================

        const estado =
            cientifica.getState();

        console.log(
            "ESTADO:",
            estado
        );

        // =====================
        // BUSCAR EXPRESIONES
        // =====================

        if (
            estado &&
            estado.expressions &&
            estado.expressions.list &&
            estado.expressions.list.length > 0
        ) {

            // buscar primera expresión válida

            const expresion =
                estado.expressions.list.find(

                    item =>
                        item.latex
                );

            return expresion?.latex ?? null;
        }

        return null;

    } catch (error) {

        console.error(
            "ERROR LATEX:",
            error
        );

        return null;
    }
}


// =====================
// OBTENER INSTANCIAS
// =====================

function obtenerGrafica() {

    return grafica;
}

function obtenerCientifica() {

    return cientifica;
}


// =====================
// GRAFICAR FUNCIÓN
// =====================

function graficarFuncion(
    latex
) {

    if (!grafica) return;

    try {

        grafica.setExpression({

            id: "funcion",

            latex: `y=${latex}`,

            color: "#dc2626"
        });

    } catch (error) {

        console.error(
            "ERROR GRAFICAR:",
            error
        );
    }
}


// =====================
// AGREGAR PUNTO
// =====================

function agregarPunto(
    x,
    y,
    etiqueta = "punto"
) {

    if (!grafica) return;

    if (
        !isFinite(x) ||
        !isFinite(y)
    ) {

        return;
    }

    try {

        grafica.setExpression({

            id: etiqueta,

            latex: `(${x},${y})`,

            showLabel: true,

            label: etiqueta,

            color: "#16a34a",

            pointStyle: Desmos.Styles.POINT,

            pointSize: 12
        });

    } catch (error) {

        console.error(
            "ERROR PUNTO:",
            error
        );
    }
}


// =====================
// ELIMINAR PUNTO
// =====================

function eliminarPunto(
    etiqueta
) {

    if (!grafica) return;

    try {

        grafica.removeExpression({

            id: etiqueta
        });

    } catch (error) {

        console.error(
            "ERROR ELIMINAR:",
            error
        );
    }
}


// =====================
// LIMPIAR ITERACIONES
// =====================

function limpiarIteraciones() {

    if (!grafica) return;

    try {

        const expresiones =
            grafica.getExpressions();

        expresiones.forEach(

            expresion => {

                if (
                    expresion.id &&
                    expresion.id.startsWith(
                        "iteracion-"
                    )
                ) {

                    grafica.removeExpression({

                        id: expresion.id
                    });
                }
            }
        );

    } catch (error) {

        console.error(
            "ERROR LIMPIAR ITERACIONES:",
            error
        );
    }
}