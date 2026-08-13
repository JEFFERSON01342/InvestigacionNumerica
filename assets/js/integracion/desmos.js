let graficaIntegracion = null;

function iniciarGraficaIntegracion() {
    const elemento = document.getElementById("grafica-integracion");

    if (!elemento || !window.Desmos) return;

    graficaIntegracion = Desmos.GraphingCalculator(elemento, {
        keypad: false,
        expressions: false,
        settingsMenu: false,
        zoomButtons: true
    });
}

function limpiarGraficaIntegracion() {
    if (!graficaIntegracion) return;

    graficaIntegracion.getExpressions().forEach(expresion => {
        graficaIntegracion.removeExpression({ id: expresion.id });
    });
}

function graficarIntegracion(data) {
    if (!graficaIntegracion) return;

    limpiarGraficaIntegracion();

    const puntosCurva = obtenerPuntosCurva(data, 80);
    const yValores = puntosCurva.map(punto => punto.y).filter(Number.isFinite);

    graficarFuncionBase(data.latex);
    graficarAreaReal(puntosCurva);
    graficarAreaMetodo(data);
    graficarGuias(data);
    graficarEtiquetas(data, yValores);
    ajustarVentana(data, yValores);
}

function graficarFuncionBase(latex) {
    graficaIntegracion.setExpression({
        id: "funcion-integracion",
        latex: `y=${latex}`,
        color: "#dc2626",
        lineWidth: 3
    });
}

function graficarAreaReal(puntos) {
    const latex = crearPoligono(
        puntos.map(punto => [punto.x, punto.y])
    );

    if (!latex) return;

    graficaIntegracion.setExpression({
        id: "area-real",
        latex,
        color: "#16a34a",
        fillOpacity: 0.22,
        lineOpacity: 0.25
    });
}

function graficarAreaMetodo(data) {
    if (data.metodo === "Rectangulos") {
        data.puntos.forEach((punto, indice) => {
            const latex = crearPoligono([
                [punto.izquierda, punto.fx],
                [punto.derecha, punto.fx]
            ]);

            agregarPoligonoMetodo(`rectangulo-${indice}`, latex);
        });
    }

    if (data.metodo === "Trapecio") {
        for (let i = 0; i < data.puntos.length - 1; i++) {
            const actual = data.puntos[i];
            const siguiente = data.puntos[i + 1];
            const latex = crearPoligono([
                [actual.xi, actual.fx],
                [siguiente.xi, siguiente.fx]
            ]);

            agregarPoligonoMetodo(`trapecio-${i}`, latex);
        }
    }

    if (data.metodo === "Romberg") {
        const ultimoDetalle = data.detalles[data.detalles.length - 1];
        const puntos = [
            { xi: data.a, fx: ultimoDetalle.fa },
            ...ultimoDetalle.puntos,
            { xi: data.b, fx: ultimoDetalle.fb }
        ];

        for (let i = 0; i < puntos.length - 1; i++) {
            const actual = puntos[i];
            const siguiente = puntos[i + 1];
            const latex = crearPoligono([
                [actual.xi, actual.fx],
                [siguiente.xi, siguiente.fx]
            ]);

            agregarPoligonoMetodo(`romberg-${i}`, latex);
        }
    }
}

function agregarPoligonoMetodo(id, latex) {
    if (!latex) return;

    graficaIntegracion.setExpression({
        id,
        latex,
        color: "#2563eb",
        fillOpacity: 0.28,
        lineWidth: 2,
        lineOpacity: 0.85
    });
}

function graficarGuias(data) {
    graficaIntegracion.setExpression({
        id: "limite-a",
        latex: `x=${numeroDesmos(data.a)}`,
        color: "#7f1d1d",
        lineStyle: Desmos.Styles.DASHED
    });

    graficaIntegracion.setExpression({
        id: "limite-b",
        latex: `x=${numeroDesmos(data.b)}`,
        color: "#7f1d1d",
        lineStyle: Desmos.Styles.DASHED
    });
}

function graficarEtiquetas(data, yValores) {
    const centro = (data.a + data.b) / 2;
    const yMax = Math.max(...yValores, 0);
    const yMin = Math.min(...yValores, 0);
    const salto = Math.max((yMax - yMin) * 0.12, 1);
    const yEtiqueta = yMax + salto;

    graficaIntegracion.setExpression({
        id: "etiqueta-real",
        latex: `(${numeroDesmos(centro)},${numeroDesmos(yEtiqueta)})`,
        showLabel: true,
        label: `Real = ${formatearNumeroIntegracion(data.areaReal, 8)}`,
        color: "#16a34a",
        pointSize: 0
    });

    graficaIntegracion.setExpression({
        id: "etiqueta-metodo",
        latex: `(${numeroDesmos(centro)},${numeroDesmos(yEtiqueta - salto)})`,
        showLabel: true,
        label: `${data.metodo} = ${formatearNumeroIntegracion(data.resultado, 8)} | Error ${formatearNumeroIntegracion(data.errorAbsoluto, 8)} (${data.errorPorcentual === null ? "N/D" : formatearNumeroIntegracion(data.errorPorcentual, 5) + "%"})`,
        color: "#2563eb",
        pointSize: 0
    });
}

function ajustarVentana(data, yValores) {
    const xMin = Math.min(data.a, data.b);
    const xMax = Math.max(data.a, data.b);
    const anchoX = Math.max(xMax - xMin, 1);
    const yMin = Math.min(...yValores, 0);
    const yMax = Math.max(...yValores, 0);
    const altoY = Math.max(yMax - yMin, 1);

    graficaIntegracion.setMathBounds({
        left: xMin - anchoX * 0.15,
        right: xMax + anchoX * 0.15,
        bottom: yMin - altoY * 0.25,
        top: yMax + altoY * 0.35
    });
}

function obtenerPuntosCurva(data, cantidad) {
    const puntos = [];

    for (let i = 0; i <= cantidad; i++) {
        const x = data.a + ((data.b - data.a) * i) / cantidad;
        const y = evaluarFuncionIntegracion(data.expresion, x);

        puntos.push({ x, y });
    }

    return puntos;
}

function crearPoligono(puntosSuperiores) {
    if (!puntosSuperiores.length) return "";

    const inicio = puntosSuperiores[0][0];
    const fin = puntosSuperiores[puntosSuperiores.length - 1][0];
    const puntos = [
        [inicio, 0],
        ...puntosSuperiores,
        [fin, 0]
    ];

    const coordenadas = puntos
        .map(([x, y]) => `(${numeroDesmos(x)},${numeroDesmos(y)})`)
        .join(",");

    return `\\operatorname{polygon}\\left(${coordenadas}\\right)`;
}

function numeroDesmos(valor) {
    if (!Number.isFinite(valor)) return "0";

    return Number(valor.toPrecision(12)).toString();
}
