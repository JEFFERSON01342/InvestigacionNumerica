// =====================
// LATEX → JS
// =====================

function convertirLatexAJS(
    latex
) {

    if (!latex) {

        return "";
    }

    let expr = latex;

    // =====================
    // LIMPIEZA
    // =====================

    expr = expr.trim();

    // quitar espacios
    expr =
        expr.replace(/\s+/g, "");

    // quitar \left y \right
    expr =
        expr.replace(/\\left/g, "");

    expr =
        expr.replace(/\\right/g, "");

    // =====================
    // FRACCIONES
    // =====================

    expr =
        convertirFracciones(
            expr
        );

    // =====================
    // e^{...} → exp(...)
    // =====================

    // e^{x}
    expr =
        expr.replace(
            /e\^\{([^{}]+)\}/g,
            "exp($1)"
        );

    // e^(x)
    expr =
        expr.replace(
            /e\^\(([^()]+)\)/g,
            "exp($1)"
        );

    // e^x
    expr =
        expr.replace(
            /e\^([a-zA-Z0-9.+\-*/]+)/g,
            "exp($1)"
        );

    // =====================
    // RAÍCES
    // =====================

    // \sqrt[n]{x}
    expr =
        expr.replace(
            /\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g,
            "(($2)^(1/($1)))"
        );

    // \sqrt{x}
    expr =
        expr.replace(
            /\\sqrt\{([^{}]+)\}/g,
            "sqrt($1)"
        );

    // =====================
    // FUNCIONES
    // =====================

    // sen → sin
    expr =
        expr.replace(
            /\\?sen/g,
            "sin"
        );

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
            /\\asin/g,
            "asin"
        );

    expr =
        expr.replace(
            /\\acos/g,
            "acos"
        );

    expr =
        expr.replace(
            /\\atan/g,
            "atan"
        );

    // ln(x)
    expr =
        expr.replace(
            /\\ln/g,
            "log"
        );

    // log(x)
    expr =
        expr.replace(
            /\\log/g,
            "log10"
        );

    expr =
        expr.replace(
            /\\exp/g,
            "exp"
        );

    expr =
        expr.replace(
            /\\abs/g,
            "abs"
        );

    // =====================
    // CONSTANTES
    // =====================

    expr =
        expr.replace(
            /\\pi/g,
            "PI"
        );

    expr =
        expr.replace(
            /\bpi\b/g,
            "PI"
        );

    // e restante → E
    expr =
        expr.replace(
            /\be\b/g,
            "E"
        );

    // =====================
    // POTENCIAS
    // =====================

    // x^{2}
    expr =
        expr.replace(
            /\^\{([^{}]+)\}/g,
            "^($1)"
        );

    // =====================
    // MULTIPLICACIÓN
    // IMPLÍCITA
    // =====================

    // 2x → 2*x
    expr =
        expr.replace(
            /(\d)([a-zA-Z])/g,
            "$1*$2"
        );

    // )( → )*(
    expr =
        expr.replace(
            /\)\(/g,
            ")*("
        );

    // 2( → 2*(
    expr =
        expr.replace(
            /(\d)\(/g,
            "$1*("
        );

    // )x → )*x
    expr =
        expr.replace(
            /\)([a-zA-Z])/g,
            ")*$1"
        );

    // x( → x*(
    expr =
        expr.replace(
            /(x|PI|E)\(/g,
            "$1*("
        );

    // xsin(x)
    expr =
        expr.replace(
            /(x|PI|E)(sin|cos|tan|asin|acos|atan|log|log10|sqrt|exp|abs)/g,
            "$1*$2"
        );

    // 2sin(x)
    expr =
        expr.replace(
            /(\d)(sin|cos|tan|asin|acos|atan|log|log10|sqrt|exp|abs)/g,
            "$1*$2"
        );

    // =====================
    // POTENCIA JS
    // =====================

    expr =
        expr.replace(
            /\^/g,
            "**"
        );

    console.log(
        "LATEX ORIGINAL:",
        latex
    );

    console.log(
        "LATEX → JS:",
        expr
    );

    return expr;
}


// =====================
// CONVERTIR FRACCIONES
// =====================

function convertirFracciones(
    expr
) {

    let anterior = "";

    while (
        expr.includes("\\frac")
        &&
        anterior !== expr
    ) {

        anterior = expr;

        expr =
            expr.replace(
                /\\frac\{([^{}]+)\}\{([^{}]+)\}/g,
                "(($1)/($2))"
            );
    }

    return expr;
}
