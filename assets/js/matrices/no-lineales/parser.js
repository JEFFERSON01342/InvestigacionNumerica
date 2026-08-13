// =====================
// PARSER.JS
// LATEX → JAVASCRIPT
// =====================


// =====================
// CONVERTIR LATEX
// =====================

window.convertirLatexAJS = function (latex) {

    try {

        // =====================
        // VALIDAR
        // =====================

        if (!latex) {

            return "";
        }

        // =====================
        // STRING
        // =====================

        let expr =
            String(latex);

        console.log(
            "LATEX ORIGINAL:",
            expr
        );

        // =====================
        // LIMPIAR
        // =====================

        expr =
            expr.trim();

        expr =
            expr.replace(
                /\s+/g,
                ""
            );

        // =====================
        // \left \right
        // =====================

        expr =
            expr.replace(
                /\\left/g,
                ""
            );

        expr =
            expr.replace(
                /\\right/g,
                ""
            );

        // =====================
        // \mathrm{e}
        // =====================

        expr =
            expr.replace(
                /\\mathrm\{e\}/g,
                "e"
            );

        expr =
            expr.replace(
                /\\exponentialE/g,
                "e"
            );

        expr =
            expr.replace(
                /exponentialE/g,
                "e"
            );

        // =====================
        // MULTIPLICACIÓN LATEX
        // =====================

        expr =
            expr.replace(
                /\\cdot/g,
                "*"
            );

        expr =
            expr.replace(
                /\\times/g,
                "*"
            );

        // =====================
        // FUNCIONES LATEX
        // =====================

        const funcionesLatex = [

            {
                latex: /\\sin/g,
                js: "sin"
            },

            {
                latex: /\\cos/g,
                js: "cos"
            },

            {
                latex: /\\tan/g,
                js: "tan"
            },

            {
                latex: /\\asin/g,
                js: "asin"
            },

            {
                latex: /\\acos/g,
                js: "acos"
            },

            {
                latex: /\\atan/g,
                js: "atan"
            },

            {
                latex: /\\ln/g,
                js: "log"
            },

            {
                latex: /\\log/g,
                js: "log"
            },

            {
                latex: /\\sqrt/g,
                js: "sqrt"
            }
        ];

        funcionesLatex.forEach(funcion => {

            expr =
                expr.replace(
                    funcion.latex,
                    funcion.js
                );
        });

        // =====================
        // CONSTANTES
        // =====================

        expr =
            expr.replace(
                /\\pi/g,
                "pi"
            );

        expr =
            expr.replace(
                /π/g,
                "pi"
            );

        expr =
            expr.replace(
                /∞/g,
                "Infinity"
            );

        // =====================
        // FRACCIONES
        // =====================

        while (/\\frac/.test(expr)) {

            expr =
                expr.replace(

                    /\\frac\{([^{}]+)\}\{([^{}]+)\}/,

                    "(($1)/(($2)))"
                );
        }

        // =====================
        // sqrt{...}
        // =====================

        expr =
            expr.replace(

                /sqrt\{([^{}]+)\}/g,

                "sqrt($1)"
            );

        // =====================
        // POTENCIAS
        // x^{2}
        // =====================

        expr =
            expr.replace(

                /([a-zA-Z0-9)\]])\^\{([^{}]+)\}/g,

                "$1^($2)"
            );

        // =====================
        // x^2
        // =====================

        expr =
            expr.replace(

                /([a-zA-Z0-9)\]])\^([\-]?[0-9]+)/g,

                "$1^($2)"
            );

        // =====================
        // e^{...}
        // → exp(...)
        // =====================

        expr =
            expr.replace(

                /e\^\{([^{}]+)\}/g,

                "exp($1)"
            );

        // =====================
        // e^(...)
        // → exp(...)
        // =====================

        expr =
            expr.replace(

                /e\^\(([^()]+)\)/g,

                "exp($1)"
            );

        // =====================
        // e^-x
        // → exp(-x)
        // =====================

        expr =
            expr.replace(

                /e\^(-?[a-zA-Z0-9]+)/g,

                "exp($1)"
            );

        // =====================
        // QUITAR LLAVES
        // =====================

        expr =
            expr.replace(
                /[{}]/g,
                ""
            );

        // =====================
        // MULTIPLICACIÓN IMPLÍCITA
        // =====================

        // 2x
        expr =
            expr.replace(

                /([0-9])([a-zA-Z])/g,

                "$1*$2"
            );

        // x2
        expr =
            expr.replace(

                /([a-zA-Z])([0-9])/g,

                "$1*$2"
            );

        // )(
        expr =
            expr.replace(

                /\)\(/g,

                ")*("
            );

        // 2(
        expr =
            expr.replace(

                /([0-9])\(/g,

                "$1*("
            );

        // )2
        expr =
            expr.replace(

                /\)([0-9])/g,

                ")*$1"
            );

        // )x
        expr =
            expr.replace(

                /\)([a-zA-Z])/g,

                ")*$1"
            );

        // =====================
        // x(
        // EVITAR FUNCIONES
        // =====================

        expr =
            expr.replace(

                /([a-zA-Z]+)\(/g,

                (match, p1) => {

                    const funciones = [

                        "sin",
                        "cos",
                        "tan",

                        "asin",
                        "acos",
                        "atan",

                        "log",
                        "sqrt",
                        "exp",
                        "abs"
                    ];

                    if (
                        funciones.includes(p1)
                    ) {

                        return p1 + "(";
                    }

                    return p1 + "*(";
                }
            );

        // =====================
        // ABSOLUTO
        // =====================

        expr =
            expr.replace(

                /\|(.*?)\|/g,

                "abs($1)"
            );

        // =====================
        // SIGNOS
        // =====================

        expr =
            expr.replace(
                /\+\+/g,
                "+"
            );

        expr =
            expr.replace(
                /--/g,
                "+"
            );

        expr =
            expr.replace(
                /\+-/g,
                "-"
            );

        expr =
            expr.replace(
                /-\+/g,
                "-"
            );

        // =====================
        // LIMPIAR **
        // =====================

        expr =
            expr.replace(
                /\*\*/g,
                "^"
            );

        // =====================
        // FINAL
        // =====================

        expr =
            expr.trim();

        console.log(
            "EXPRESIÓN JS:",
            expr
        );

        return expr;

    } catch (error) {

        console.error(
            "ERROR PARSER:",
            error
        );

        return "";
    }
};


// =====================
// OBTENER VARIABLES
// =====================

window.obtenerVariables = function () {

    try {

        const fields =
            document.querySelectorAll(
                ".ecuacion-field"
            );

        const variables =
            new Set();

        fields.forEach(field => {

            let latex = "";

            try {

                latex =
                    field.getValue();

            } catch {

                latex =
                    field.value;
            }

            // =====================
            // VARIABLES REALES
            // =====================

            const matches =
                latex.match(
                    /[xyzuvw]/g
                );

            if (matches) {

                matches.forEach(variable => {

                    variables.add(
                        variable
                    );
                });
            }
        });

        const resultado =
            Array.from(
                variables
            ).sort();

        console.log(
            "VARIABLES:",
            resultado
        );

        return resultado;

    } catch (error) {

        console.error(
            "ERROR VARIABLES:",
            error
        );

        return [];
    }
};