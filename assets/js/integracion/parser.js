function convertirFraccionesIntegracion(expr) {
    while (expr.includes("\\frac")) {
        const inicio = expr.indexOf("\\frac");
        const despues = expr.substring(inicio + 5);

        if (!despues.startsWith("{")) break;

        let contador = 0;
        let finNum = -1;

        for (let i = 0; i < despues.length; i++) {
            if (despues[i] === "{") contador++;
            if (despues[i] === "}") contador--;
            if (contador === 0) {
                finNum = i;
                break;
            }
        }

        if (finNum === -1) break;

        const numerador = despues.substring(1, finNum);
        const resto = despues.substring(finNum + 1);

        if (!resto.startsWith("{")) break;

        contador = 0;
        let finDen = -1;

        for (let i = 0; i < resto.length; i++) {
            if (resto[i] === "{") contador++;
            if (resto[i] === "}") contador--;
            if (contador === 0) {
                finDen = i;
                break;
            }
        }

        if (finDen === -1) break;

        const denominador = resto.substring(1, finDen);
        const original = "\\frac{" + numerador + "}{" + denominador + "}";
        const reemplazo = "((" + numerador + ")/(" + denominador + "))";

        expr = expr.replace(original, reemplazo);
    }

    return expr;
}

window.convertirLatexIntegracion = function (latex) {
    if (!latex || !latex.trim()) {
        throw new Error("Ingrese una funcion para integrar.");
    }

    let expr = latex.trim();

    expr = expr.replace(/\s+/g, "");
    expr = expr.replace(/\\left|\\right/g, "");
    expr = convertirFraccionesIntegracion(expr);

    expr = expr.replace(/\\sin/g, "sin");
    expr = expr.replace(/\\cos/g, "cos");
    expr = expr.replace(/\\tan/g, "tan");
    expr = expr.replace(/\\ln/g, "log");
    expr = expr.replace(/\\log/g, "log10");
    expr = expr.replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)");
    expr = expr.replace(/\\pi/g, "pi");
    expr = expr.replace(/\\cdot/g, "*");
    expr = expr.replace(/\\,/g, "");

    expr = expr.replace(/e\^\{([^{}]+)\}/g, "exp($1)");
    expr = expr.replace(/e\^\(([^()]*)\)/g, "exp($1)");
    expr = expr.replace(/e\^([a-zA-Z0-9\.\-\+]+)/g, "exp($1)");
    expr = expr.replace(/([a-zA-Z0-9\)\]])\^\{([^{}]+)\}/g, "$1^($2)");

    expr = expr.replace(/(\d)([a-zA-Z])/g, "$1*$2");
    expr = expr.replace(/(\d)\(/g, "$1*(");
    expr = expr.replace(/\)\(/g, ")*(");
    expr = expr.replace(/\)([a-zA-Z])/g, ")*$1");

    try {
        math.parse(expr);
        return expr;
    } catch (error) {
        throw new Error("No se pudo interpretar la funcion. Revise la sintaxis.");
    }
};

window.evaluarFuncionIntegracion = function (expr, x) {
    const valor = math.evaluate(expr, { x });

    if (typeof valor !== "number" || isNaN(valor) || !isFinite(valor)) {
        throw new Error("La funcion no se puede evaluar en x = " + x + ".");
    }

    return valor;
};

window.formatearNumeroIntegracion = function (valor, decimales = 10) {
    if (typeof valor !== "number" || isNaN(valor) || !isFinite(valor)) {
        return "NaN";
    }

    return Number(valor)
        .toFixed(decimales)
        .replace(/\.?0+$/, "");
};
