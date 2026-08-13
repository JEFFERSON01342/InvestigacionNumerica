window.calcularMetodoRomberg = function (latex, a, b, niveles) {
    const expresion = convertirLatexIntegracion(latex);
    const tabla = [];
    const detalles = [];

    for (let k = 0; k < niveles; k++) {
        const n = Math.pow(2, k);
        const h = (b - a) / n;
        let sumaInterior = 0;
        const puntos = [];

        for (let i = 1; i < n; i++) {
            const xi = a + i * h;
            const fx = evaluarFuncionIntegracion(expresion, xi);

            sumaInterior += fx;
            puntos.push({ i, xi, fx });
        }

        const fa = evaluarFuncionIntegracion(expresion, a);
        const fb = evaluarFuncionIntegracion(expresion, b);

        tabla[k] = [];
        tabla[k][0] = (h / 2) * (fa + 2 * sumaInterior + fb);
        detalles[k] = {
            nivel: k + 1,
            n,
            h,
            puntos,
            fa,
            fb,
            sumaInterior
        };

        for (let j = 1; j <= k; j++) {
            const factor = Math.pow(4, j);
            tabla[k][j] =
                (factor * tabla[k][j - 1] - tabla[k - 1][j - 1]) /
                (factor - 1);
        }
    }

    return {
        metodo: "Romberg",
        latex,
        expresion,
        a,
        b,
        n: niveles,
        niveles,
        tabla,
        detalles,
        deltaX: (b - a) / Math.pow(2, niveles - 1),
        resultado: tabla[niveles - 1][niveles - 1]
    };
};
