// =====================
// ESTADO GLOBAL
// =====================

let metodoActual =
    null;


// =====================
// INICIALIZACIÓN
// =====================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "RAICES INICIADO"
        );

        // =====================
        // DESMOS
        // =====================

        setTimeout(
            () => {

                iniciarDesmos();

            },
            100
        );

        // =====================
        // BOTONES CATEGORÍAS
        // =====================

        inicializarBotonesCategorias();

        // =====================
        // BOTONES MÉTODOS
        // =====================

        inicializarBotones();

        // =====================
        // BOTÓN EJECUTAR
        // =====================

        const botonIterar =
            document.getElementById(
                "btn-iterar"
            );

        if (botonIterar) {

            botonIterar.addEventListener(
                "click",
                ejecutarMetodo
            );
        }
    }
);


// =====================
// BOTONES CATEGORÍAS
// =====================

function inicializarBotonesCategorias() {

    const botones =
        document.querySelectorAll(
            ".categoria-btn"
        );

    botones.forEach(
        btn => {

            btn.addEventListener(
                "click",
                function () {

                    const categoria =
                        this.dataset.categoria;

                    cambiarCategoria(
                        categoria
                    );
                }
            );
        }
    );
}


// =====================
// BOTONES DE MÉTODO
// =====================

function inicializarBotones() {

    const botones =
        document.querySelectorAll(
            ".metodo-btn:not([disabled])"
        );

    botones.forEach(
        btn => {

            btn.addEventListener(
                "click",
                function () {

                    const tipo =
                        this.dataset.metodo;

                    metodoActual =
                        tipo;

                    // =====================
                    // UI
                    // =====================

                    crearTabla(
                        tipo
                    );

                    mostrarInputs(
                        tipo
                    );

                    activarBotonMetodo(
                        botones,
                        this
                    );
                }
            );
        }
    );
}


// =====================
// CONTROLADOR CENTRAL
// =====================

function ejecutarMetodo() {

    // =====================
    // VALIDAR FUNCIÓN
    // =====================

    const latex =
        obtenerLatex();

    if (!latex) {

        alert(
            "Escribe una función"
        );

        return;
    }

    // validar x
    if (
        !latex.includes(
            "x"
        )
    ) {

        alert(
            "La función debe contener x"
        );

        return;
    }

    // =====================
    // VALIDAR MÉTODO
    // =====================

    if (
        !metodoActual
    ) {

        alert(
            "Selecciona un método"
        );

        return;
    }

    // =====================
    // OBTENER INPUTS
    // =====================

    const valores =
        obtenerValoresMetodo();

    // =====================
    // ROUTER MÉTODOS
    // =====================

    switch (
        metodoActual
    ) {

        // =====================
        // BISECCIÓN
        // =====================

        case "biseccion":

            if (
                valores.a == null
                ||
                valores.b == null
            ) {

                alert(
                    "Ingresa a y b"
                );

                return;
            }

            metodoBiseccion(
                latex,
                valores.a,
                valores.b
            );

            break;


        // =====================
        // REGLA FALSA
        // =====================

        case "reglaFalsa":

            if (
                valores.a == null
                ||
                valores.b == null
            ) {

                alert(
                    "Ingresa a y b"
                );

                return;
            }

            metodoReglaFalsa(
                latex,
                valores.a,
                valores.b
            );

            break;


        // =====================
        // NEWTON
        // =====================

        case "newton":

            if (
                valores.x0 == null
            ) {

                alert(
                    "Ingresa x₀"
                );

                return;
            }

            metodoNewton(
                latex,
                valores.x0
            );

            break;


        // =====================
        // SECANTE
        // =====================

        case "secante":

            if (
                valores.a == null
                ||
                valores.b == null
            ) {

                alert(
                    "Ingresa x₀ y x₁"
                );

                return;
            }

            metodoSecante(
                latex,
                valores.a,
                valores.b
            );

            break;


        // =====================
        // PUNTO FIJO
        // =====================

        case "puntoFijo":

            if (
                valores.x0 == null
            ) {

                alert(
                    "Ingresa x₀"
                );

                return;
            }

            metodoPuntoFijo(
                latex,
                valores.x0
            );

            break;


        // =====================
        // MULLER
        // =====================

        case "muller":

            if (
                valores.a == null
                ||
                valores.b == null
                ||
                valores.x0 == null
            ) {

                alert(
                    "Ingresa xi, xi+1 y xi+2"
                );

                return;
            }

            metodoMuller(
                latex,
                valores.a,
                valores.b,
                valores.x0
            );

            break;


        // =====================
        // BAIRSTOW
        // =====================

        case "bairstow":

            if (
                valores.r == null
                ||
                valores.s == null
            ) {

                alert(
                    "Ingresa r y s"
                );

                return;
            }

            const coeficientes =
                obtenerCoeficientesBairstow(
                    latex
                );

            if (
                !coeficientes
            ) {

                return;
            }

            metodoBarirstow(
                coeficientes,
                valores.r,
                valores.s
            );

            break;


        // =====================
        // HORNER-NEWTON
        // =====================

        case "hornerNewton":

            if (
                valores.x0 == null
            ) {

                alert(
                    "Ingresa x₀"
                );

                return;
            }

            const coeficientesHorner =
                obtenerCoeficientesHornerNewton(
                    latex
                );

            if (
                !coeficientesHorner
            ) {

                return;
            }

            metodoNewtonHorner(
                coeficientesHorner,
                valores.x0
            );

            break;


        // =====================
        // DEFAULT
        // =====================

        default:

            alert(
                "Método no reconocido"
            );

            break;
    }
}
