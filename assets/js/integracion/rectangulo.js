window.calcularMetodoRectangulo = function (latex, a, b, n) {
    const expresion = convertirLatexIntegracion(latex);
    const deltaX = (b - a) / n;
    const puntos = [];
    let suma = 0;

    for (let i = 0; i < n; i++) {
        const izquierda = a + i * deltaX;
        const derecha = izquierda + deltaX;
        const xi = (izquierda + derecha) / 2;
        const fx = evaluarFuncionIntegracion(expresion, xi);

        suma += fx;
        puntos.push({ i, izquierda, derecha, xi, fx });
    }

    return {
        metodo: "Rectangulos",
        latex,
        expresion,
        a,
        b,
        n,
        deltaX,
        puntos,
        resultado: deltaX * suma,
        suma
    };
};
