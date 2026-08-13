window.calcularMetodoTrapecio = function (latex, a, b, n) {
    const expresion = convertirLatexIntegracion(latex);
    const deltaX = (b - a) / n;
    const puntos = [];
    let sumaInterior = 0;

    for (let i = 0; i <= n; i++) {
        const xi = a + i * deltaX;
        const fx = evaluarFuncionIntegracion(expresion, xi);

        if (i > 0 && i < n) {
            sumaInterior += fx;
        }

        puntos.push({ i, xi, fx });
    }

    const resultado =
        (deltaX / 2) *
        (puntos[0].fx + 2 * sumaInterior + puntos[puntos.length - 1].fx);

    return {
        metodo: "Trapecio",
        latex,
        expresion,
        a,
        b,
        n,
        deltaX,
        puntos,
        sumaInterior,
        resultado
    };
};
