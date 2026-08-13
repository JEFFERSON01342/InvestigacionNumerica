// =====================
// EVALUAR FUNCIÓN
// =====================

function evaluarFuncion(
    expr,
    x
) {

    try {

        // =====================
        // VALIDAR ENTRADAS
        // =====================

        if (
            expr === undefined ||
            expr === null ||
            expr === ""
        ) {

            return NaN;
        }

        if (
            !isFinite(x)
        ) {

            return NaN;
        }

        // =====================
        // CONTEXTO MATH
        // =====================

        const scope = {

            x,

            PI:
                Math.PI,

            E:
                Math.E,

            // =====================
            // TRIGONOMÉTRICAS
            // =====================

            sin:
                Math.sin,

            cos:
                Math.cos,

            tan:
                Math.tan,

            asin:
                Math.asin,

            acos:
                Math.acos,

            atan:
                Math.atan,

            sinh:
                Math.sinh,

            cosh:
                Math.cosh,

            tanh:
                Math.tanh,

            // =====================
            // RAÍCES / ABS
            // =====================

            sqrt:
                Math.sqrt,

            abs:
                Math.abs,

            // =====================
            // REDONDEO
            // =====================

            floor:
                Math.floor,

            ceil:
                Math.ceil,

            round:
                Math.round,

            // =====================
            // LOGARITMOS
            // =====================

            // ln(x)
            log:
                Math.log,

            // log10(x)
            log10:
                Math.log10
                    ? Math.log10
                    : function (n) {

                        return (
                            Math.log(n)
                            /
                            Math.LN10
                        );
                    },

            // =====================
            // EXPONENCIAL
            // =====================

            exp:
                Math.exp,

            // =====================
            // POTENCIAS
            // =====================

            pow:
                Math.pow,

            // =====================
            // MIN / MAX
            // =====================

            min:
                Math.min,

            max:
                Math.max
        };

        // =====================
        // CREAR FUNCIÓN
        // =====================

        const funcion =
            Function(

                ...Object.keys(scope),

                `
                "use strict";

                return (${expr});
                `
            );

        // =====================
        // EVALUAR
        // =====================

        const resultado =
            funcion(
                ...Object.values(scope)
            );

        // =====================
        // VALIDAR RESULTADO
        // =====================

        if (
            resultado === undefined ||
            resultado === null ||
            !isFinite(resultado) ||
            isNaN(resultado)
        ) {

            return NaN;
        }

        return Number(resultado);

    } catch (error) {

        console.error(
            "ERROR EVALUANDO:",
            expr,
            "x =",
            x,
            error
        );

        return NaN;
    }
}


// =====================
// DERIVADA NUMÉRICA
// DIFERENCIAS CENTRALES
// =====================

function derivadaNumerica(
    expr,
    x
) {

    try {

        // =====================
        // VALIDAR x
        // =====================

        if (
            !isFinite(x)
        ) {

            return NaN;
        }

        // =====================
        // h ADAPTATIVO
        // =====================

        const h =
            Math.max(
                1e-6,
                Math.abs(x) * 1e-6
            );

        // =====================
        // EVALUAR
        // =====================

        const fxh1 =
            evaluarFuncion(
                expr,
                x + h
            );

        const fxh2 =
            evaluarFuncion(
                expr,
                x - h
            );

        // =====================
        // VALIDAR
        // =====================

        if (
            isNaN(fxh1) ||
            isNaN(fxh2)
        ) {

            return NaN;
        }

        // =====================
        // DIFERENCIA CENTRAL
        // =====================

        const derivada =
            (
                fxh1
                -
                fxh2
            )
            /
            (
                2 * h
            );

        // =====================
        // VALIDAR RESULTADO
        // =====================

        if (
            !isFinite(
                derivada
            ) ||
            isNaN(
                derivada
            )
        ) {

            return NaN;
        }

        return derivada;

    } catch (error) {

        console.error(
            "ERROR DERIVADA:",
            error
        );

        return NaN;
    }
}


// =====================
// SEGUNDA DERIVADA
// =====================

function segundaDerivada(
    expr,
    x
) {

    try {

        if (
            !isFinite(x)
        ) {

            return NaN;
        }

        const h =
            1e-5;

        const fxh1 =
            evaluarFuncion(
                expr,
                x + h
            );

        const fx =
            evaluarFuncion(
                expr,
                x
            );

        const fxh2 =
            evaluarFuncion(
                expr,
                x - h
            );

        // =====================
        // VALIDAR
        // =====================

        if (
            isNaN(fxh1) ||
            isNaN(fx) ||
            isNaN(fxh2)
        ) {

            return NaN;
        }

        // =====================
        // SEGUNDA DERIVADA
        // =====================

        const resultado =
            (
                fxh1
                -
                (2 * fx)
                +
                fxh2
            )
            /
            (
                h * h
            );

        // =====================
        // VALIDAR
        // =====================

        if (
            !isFinite(resultado) ||
            isNaN(resultado)
        ) {

            return NaN;
        }

        return resultado;

    } catch (error) {

        console.error(
            "ERROR SEGUNDA DERIVADA:",
            error
        );

        return NaN;
    }
}


// =====================
// VALIDAR INTERVALO
// f(a) * f(b) < 0
// =====================

function validarIntervalo(
    expr,
    a,
    b
) {

    const fa =
        evaluarFuncion(
            expr,
            a
        );

    const fb =
        evaluarFuncion(
            expr,
            b
        );

    if (
        isNaN(fa) ||
        isNaN(fb)
    ) {

        return false;
    }

    return (
        fa * fb
    ) < 0;
}


// =====================
// BUSCAR CAMBIO SIGNO
// =====================

function buscarIntervalos(
    expr,
    inicio = -10,
    fin = 10,
    paso = 1
) {

    const intervalos = [];

    for (
        let x = inicio;
        x < fin;
        x += paso
    ) {

        const fx1 =
            evaluarFuncion(
                expr,
                x
            );

        const fx2 =
            evaluarFuncion(
                expr,
                x + paso
            );

        // =====================
        // VALIDAR
        // =====================

        if (
            isNaN(fx1) ||
            isNaN(fx2)
        ) {

            continue;
        }

        // =====================
        // RAÍZ EXACTA
        // =====================

        if (
            Math.abs(fx1)
            < 1e-12
        ) {

            intervalos.push({

                a: x,
                b: x
            });

            continue;
        }

        // =====================
        // CAMBIO SIGNO
        // =====================

        if (
            fx1 * fx2 < 0
        ) {

            intervalos.push({

                a: x,
                b: x + paso
            });
        }
    }

    return intervalos;
}