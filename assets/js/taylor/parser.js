// =====================
// PARSER.JS
// TAYLOR
// LATEX -> MATHJS
// =====================


// =====================
// FRACCIONES ANIDADAS
// =====================

function convertirFracciones(expr) {

    while (expr.includes("\\frac")) {

        const inicio =
            expr.indexOf("\\frac");

        const despues =
            expr.substring(
                inicio + 5
            );

        if (
            !despues.startsWith("{")
        ) {

            break;
        }

        // =====================
        // NUMERADOR
        // =====================

        let contador = 0;

        let finNum = -1;

        for (

            let i = 0;
            i < despues.length;
            i++

        ) {

            if (
                despues[i] === "{"
            ) contador++;

            if (
                despues[i] === "}"
            ) contador--;

            if (
                contador === 0
            ) {

                finNum = i;

                break;
            }
        }

        if (
            finNum === -1
        ) break;

        const numerador =

            despues.substring(
                1,
                finNum
            );

        // =====================
        // DENOMINADOR
        // =====================

        const resto =

            despues.substring(
                finNum + 1
            );

        if (
            !resto.startsWith("{")
        ) break;

        contador = 0;

        let finDen = -1;

        for (

            let i = 0;
            i < resto.length;
            i++

        ) {

            if (
                resto[i] === "{"
            ) contador++;

            if (
                resto[i] === "}"
            ) contador--;

            if (
                contador === 0
            ) {

                finDen = i;

                break;
            }
        }

        if (
            finDen === -1
        ) break;

        const denominador =

            resto.substring(
                1,
                finDen
            );

        const original =

            "\\frac{" +
            numerador +
            "}{" +
            denominador +
            "}";

        const reemplazo =

            "((" +
            numerador +
            ")/(" +
            denominador +
            "))";

        expr =
            expr.replace(
                original,
                reemplazo
            );
    }

    return expr;
}


// =====================
// CONVERTIR LATEX
// =====================

window.convertirLatexAJS =
function (latex) {

    try {

        if (!latex) {

            return "";
        }

        let expr =
            latex.trim();

        // =====================
        // LIMPIAR
        // =====================

        expr =
            expr.replace(
                /\s+/g,
                ""
            );

        expr =
            expr.replace(
                /\\left|\\right/g,
                ""
            );

        // =====================
        // FRACCIONES
        // =====================

        expr =
            convertirFracciones(
                expr
            );

        // =====================
        // FUNCIONES
        // =====================

        expr =
            expr.replace(
                /\\sin/g,
                "sin"
            );

        expr =
            expr.replace(
                /\\cos/g,
                "cos"
            );

        expr =
            expr.replace(
                /\\tan/g,
                "tan"
            );

        expr =
            expr.replace(
                /\\ln/g,
                "log"
            );

        expr =
            expr.replace(
                /\\log/g,
                "log10"
            );

        // =====================
        // RAIZ
        // =====================

        expr =
            expr.replace(
                /\\sqrt\{([^{}]+)\}/g,
                "sqrt($1)"
            );

        // =====================
        // PI
        // =====================

        expr =
            expr.replace(
                /\\pi/g,
                "pi"
            );

        // =====================
        // e^(...)
        // =====================

        expr =
            expr.replace(
                /e\^\{([^{}]+)\}/g,
                "exp($1)"
            );

        expr =
            expr.replace(
                /e\^\(([^()]*)\)/g,
                "exp($1)"
            );

        expr =
            expr.replace(
                /e\^([a-zA-Z0-9\.\-\+]+)/g,
                "exp($1)"
            );

        // =====================
        // POTENCIAS LATEX
        // x^{2}
        // =====================

        expr =
            expr.replace(
                /([a-zA-Z0-9\)\]])\^\{([^{}]+)\}/g,
                "$1^($2)"
            );

        // =====================
        // 2x -> 2*x
        // =====================

        expr =
            expr.replace(
                /(\d)([a-zA-Z])/g,
                "$1*$2"
            );

        // =====================
        // 2(
        // =====================

        expr =
            expr.replace(
                /(\d)\(/g,
                "$1*("
            );

        // =====================
        // )(
        // =====================

        expr =
            expr.replace(
                /\)\(/g,
                ")*("
            );

        // =====================
        // )x
        // =====================

        expr =
            expr.replace(
                /\)([a-zA-Z])/g,
                ")*$1"
            );

        // =====================
        // VALIDAR
        // =====================

        math.parse(expr);

        console.log(
            "LATEX:",
            latex
        );

        console.log(
            "MATHJS:",
            expr
        );

        return expr;

    }
    catch (error) {

        console.error(
            "ERROR PARSER:",
            error
        );

        return "";
    }
};


// =====================
// EVALUAR FUNCION
// =====================

window.evaluarFuncionTaylor =
function (

    expr,
    x

) {

    try {

        const valor =

            math.evaluate(

                expr,

                {
                    x: x
                }
            );

        if (

            isNaN(valor)

            ||

            !isFinite(valor)

        ) {

            return NaN;
        }

        return valor;
    }
    catch (error) {

        console.error(
            "ERROR EVALUANDO:",
            error
        );

        return NaN;
    }
};


// =====================
// FACTORIAL
// =====================

window.factorial =
function (n) {

    if (
        n <= 1
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
};


// =====================
// FORMATEAR NUMERO
// =====================

window.formatearNumero =
function (valor) {

    if (

        isNaN(valor)

        ||

        !isFinite(valor)

    ) {

        return "NaN";
    }

    return Number(
        valor
    )
        .toFixed(10)
        .replace(
            /\.?0+$/,
            ""
        );
};