// =====================
// JACOBIANO.JS
// MATRIZ JACOBIANA
// =====================


// =====================
// CREAR JACOBIANO
// =====================

window.crearJacobiano = function (

    funciones,
    variables

) {

    try {

        if (

            !Array.isArray(funciones)

            ||

            !Array.isArray(variables)

        ) {

            console.error(
                "Funciones o variables inválidas"
            );

            return null;
        }

        const jacobiano = [];

        for (

            let i = 0;
            i < funciones.length;
            i++

        ) {

            const fila = [];

            for (

                let j = 0;
                j < variables.length;
                j++

            ) {

                const derivada =
                    derivarFuncion(

                        funciones[i],

                        variables[j]
                    );

                fila.push(
                    derivada
                );
            }

            jacobiano.push(
                fila
            );
        }

        console.log(
            "JACOBIANO:",
            jacobiano
        );

        return jacobiano;

    } catch (error) {

        console.error(
            "ERROR CREANDO JACOBIANO:",
            error
        );

        return null;
    }
};


// =====================
// LIMPIAR EXPRESIÓN
// =====================

function limpiarExpresion(expr) {

    if (!expr) {

        return "";
    }

    let limpia =
        String(expr);

    // =====================
    // ELIMINAR "exponencialE"
    // =====================

    limpia =
        limpia.replace(
            /exponencialE/g,
            "e"
        );

    // =====================
    // ELIMINAR \mathrm
    // =====================

    limpia =
        limpia.replace(
            /\\mathrm/g,
            ""
        );

    // =====================
    // LIMPIAR ESPACIOS
    // =====================

    limpia =
        limpia.replace(
            /\s+/g,
            ""
        );

    return limpia;
}


// =====================
// DERIVAR FUNCIÓN
// =====================

function derivarFuncion(

    expr,
    variable

) {

    try {

        if (!expr) {

            return null;
        }

        let expresion =
            limpiarExpresion(expr);

        console.log(
            "DERIVANDO:",
            expresion,
            "RESPECTO A",
            variable
        );

        const derivada =
            math.derivative(

                expresion,
                variable
            );

        return derivada;

    } catch (error) {

        console.error(

            "ERROR DERIVANDO:",

            expr,

            variable,

            error
        );

        return null;
    }
}


// =====================
// EVALUAR JACOBIANO
// =====================

window.evaluarJacobiano =
function (

    jacobiano,
    variables,
    valores

) {

    try {

        if (!jacobiano) {

            return null;
        }

        const scope =
            crearScope(

                variables,
                valores
            );

        const matriz = [];

        for (

            let i = 0;
            i < jacobiano.length;
            i++

        ) {

            const fila = [];

            for (

                let j = 0;
                j < jacobiano[i].length;
                j++

            ) {

                const derivada =
                    jacobiano[i][j];

                if (!derivada) {

                    fila.push(
                        NaN
                    );

                    continue;
                }

                let valor;

                try {

                    valor =
                        derivada.evaluate(
                            scope
                        );

                } catch (error) {

                    console.error(
                        "ERROR EVALUANDO DERIVADA:",
                        error
                    );

                    valor = NaN;
                }

                valor =
                    Number(valor);

                if (

                    isNaN(valor)

                    ||

                    !isFinite(valor)

                ) {

                    valor = NaN;
                }

                fila.push(
                    valor
                );
            }

            matriz.push(
                fila
            );
        }

        console.log(
            "J(X):",
            matriz
        );

        return matriz;

    } catch (error) {

        console.error(

            "ERROR EVALUANDO JACOBIANO:",

            error
        );

        return null;
    }
};


// =====================
// JACOBIANO → LATEX
// =====================

window.jacobianoALatex =
function (
    jacobiano
) {

    try {

        if (!jacobiano) {

            return "";
        }

        let latex =
            "\\begin{bmatrix}";

        for (

            let i = 0;
            i < jacobiano.length;
            i++

        ) {

            const fila =
                jacobiano[i];

            for (

                let j = 0;
                j < fila.length;
                j++

            ) {

                const derivada =
                    fila[j];

                if (derivada) {

                    try {

                        let tex =
                            derivada.toTex({

                                parenthesis:
                                    "keep"

                            });

                        // =====================
                        // ARREGLAR e
                        // =====================

                        tex =
                            tex.replace(
                                /exponencialE/g,
                                "e"
                            );

                        latex += tex;

                    } catch {

                        latex += "0";
                    }

                } else {

                    latex += "0";
                }

                if (

                    j < fila.length - 1

                ) {

                    latex +=
                        " & ";
                }
            }

            if (

                i < jacobiano.length - 1

            ) {

                latex +=
                    " \\\\ ";
            }
        }

        latex +=
            "\\end{bmatrix}";

        return latex;

    } catch (error) {

        console.error(
            "ERROR LATEX:",
            error
        );

        return "";
    }
};


// =====================
// MATRIZ NUMÉRICA → LATEX
// =====================

window.matrizNumericaALatex =
function (
    matriz
) {

    try {

        if (!matriz) {

            return "";
        }

        let latex =
            "\\begin{bmatrix}";

        for (

            let i = 0;
            i < matriz.length;
            i++

        ) {

            for (

                let j = 0;
                j < matriz[i].length;
                j++

            ) {

                const valor =
                    Number(
                        matriz[i][j]
                    );

                latex +=

                    isNaN(valor)

                    ?

                    "0"

                    :

                    valor.toFixed(6);

                if (

                    j < matriz[i].length - 1

                ) {

                    latex +=
                        " & ";
                }
            }

            if (

                i < matriz.length - 1

            ) {

                latex +=
                    " \\\\ ";
            }
        }

        latex +=
            "\\end{bmatrix}";

        return latex;

    } catch (error) {

        console.error(
            error
        );

        return "";
    }
};


// =====================
// VECTOR → LATEX
// =====================

window.vectorALatex =
function (
    vector
) {

    try {

        if (!vector) {

            return "";
        }

        let latex =
            "\\begin{bmatrix}";

        for (

            let i = 0;
            i < vector.length;
            i++

        ) {

            const valor =
                Number(
                    vector[i]
                );

            latex +=

                isNaN(valor)

                ?

                "0"

                :

                valor.toFixed(6);

            if (

                i < vector.length - 1

            ) {

                latex +=
                    " \\\\ ";
            }
        }

        latex +=
            "\\end{bmatrix}";

        return latex;

    } catch (error) {

        console.error(
            error
        );

        return "";
    }
};


// =====================
// CREAR SCOPE
// =====================

function crearScope(

    variables,
    valores

) {

    const scope = {};

    // =====================
    // VARIABLES
    // =====================

    for (

        let i = 0;
        i < variables.length;
        i++

    ) {

        scope[
            variables[i]
        ] =
            Number(
                valores[i]
            );
    }

    // =====================
    // CONSTANTES
    // =====================

    scope.pi =
        Math.PI;

    scope.PI =
        Math.PI;

    scope.e =
        Math.E;

    scope.E =
        Math.E;

    // =====================
    // FUNCIONES
    // =====================

    scope.sin =
        Math.sin;

    scope.cos =
        Math.cos;

    scope.tan =
        Math.tan;

    scope.asin =
        Math.asin;

    scope.acos =
        Math.acos;

    scope.atan =
        Math.atan;

    scope.sinh =
        Math.sinh;

    scope.cosh =
        Math.cosh;

    scope.tanh =
        Math.tanh;

    scope.sqrt =
        Math.sqrt;

    scope.abs =
        Math.abs;

    scope.exp =
        Math.exp;

    scope.log =
        Math.log;

    scope.ln =
        Math.log;

    scope.log10 =
        Math.log10
            ? Math.log10
            : function (n) {

                return (
                    Math.log(n)
                    /
                    Math.LN10
                );
            };

    return scope;
}


// =====================
// EVALUAR SISTEMA
// =====================

window.evaluarSistemaNewton =
function (

    funciones,
    variables,
    valores

) {

    try {

        const resultados = [];

        const scope =
            crearScope(

                variables,
                valores
            );

        for (

            let i = 0;
            i < funciones.length;
            i++

        ) {

            let funcion =
                funciones[i];

            funcion =
                limpiarExpresion(
                    funcion
                );

            console.log(
                "EVALUANDO:",
                funcion
            );

            const valor =
                math.evaluate(

                    funcion,

                    scope
                );

            resultados.push(
                Number(valor)
            );
        }

        console.log(
            "F(X):",
            resultados
        );

        return resultados;

    } catch (error) {

        console.error(

            "ERROR EVALUANDO SISTEMA:",

            error
        );

        return null;
    }
};


// =====================
// DETERMINANTE
// =====================

window.determinanteJacobiano =
function (
    matriz
) {

    try {

        const det =
            math.det(
                matriz
            );

        return Number(det);

    } catch (error) {

        console.error(
            "ERROR DETERMINANTE:",
            error
        );

        return NaN;
    }
};