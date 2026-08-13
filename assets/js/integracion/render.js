function refrescarMathJaxIntegracion() {
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise();
    }
}

function setHTMLIntegracion(id, html) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.innerHTML = html;
    }
}

window.limpiarRenderIntegracion = function () {
    setHTMLIntegracion("integral-container", "Aqui aparecera la integral...");
    setHTMLIntegracion("delta-container", "Aqui aparecera Delta x...");
    setHTMLIntegracion("formula-container", "Aqui aparecera la formula...");
    setHTMLIntegracion("sustitucion-container", "Aqui aparecera la sustitucion...");
    setHTMLIntegracion("resultado-container", "Aqui aparecera el resultado...");
    setHTMLIntegracion("procedimiento-container", "");
    setHTMLIntegracion("comparacion-area", "Aqui aparecera la comparacion de areas...");

    const thead = document.querySelector("#tabla-puntos thead");
    const tbody = document.querySelector("#tabla-puntos tbody");

    if (thead) {
        thead.innerHTML = `
            <tr>
                <th>i</th>
                <th>x_i</th>
                <th>f(x_i)</th>
            </tr>
        `;
    }

    if (tbody) {
        tbody.innerHTML = "";
    }
};

window.mostrarErrorIntegracion = function (mensaje) {
    setHTMLIntegracion(
        "resultado-container",
        `
        <div class="error-integracion">
            ${mensaje}
        </div>
        `
    );
};

window.renderIntegracion = function (data) {
    renderIntegral(data);

    if (data.metodo === "Rectangulos") {
        renderRectangulos(data);
    }

    if (data.metodo === "Trapecio") {
        renderTrapecio(data);
    }

    if (data.metodo === "Romberg") {
        renderRomberg(data);
    }

    refrescarMathJaxIntegracion();
};

function renderIntegral(data) {
    setHTMLIntegracion(
        "integral-container",
        `
        <div class="latex-box">
            $$\\int_{${data.a}}^{${data.b}} ${data.latex}\\,dx$$
        </div>
        `
    );
}

function renderRectangulos(data) {
    const f = formatearNumeroIntegracion;
    const filas = data.puntos
        .map(
            punto => `
            <tr>
                <td>${punto.i}</td>
                <td>${f(punto.izquierda, 6)}</td>
                <td>${f(punto.derecha, 6)}</td>
                <td>${f(punto.xi, 6)}</td>
                <td>${f(punto.fx, 10)}</td>
            </tr>
            `
        )
        .join("");

    document.querySelector("#tabla-puntos thead").innerHTML = `
        <tr>
            <th>i</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Punto medio</th>
            <th>f(punto medio)</th>
        </tr>
    `;
    document.querySelector("#tabla-puntos tbody").innerHTML = filas;

    setHTMLIntegracion(
        "delta-container",
        `<div class="latex-box">$$\\Delta x=\\frac{${data.b}-${data.a}}{${data.n}}=${f(data.deltaX)}$$</div>`
    );

    setHTMLIntegracion(
        "formula-container",
        `<div class="latex-box">$$I\\approx \\Delta x\\sum_{i=0}^{n-1} f\\left(a+\\left(i+\\frac{1}{2}\\right)\\Delta x\\right)$$</div>`
    );

    setHTMLIntegracion(
        "sustitucion-container",
        `<div class="latex-box">$$I\\approx ${f(data.deltaX)}(${f(data.suma)})=${f(data.resultado)}$$</div>`
    );

    renderResultadoComun(data);
    renderProcedimientoRectangulos(data);
}

function renderTrapecio(data) {
    const f = formatearNumeroIntegracion;
    const filas = data.puntos
        .map(
            punto => `
            <tr>
                <td>${punto.i}</td>
                <td>${f(punto.xi, 6)}</td>
                <td>${f(punto.fx, 10)}</td>
            </tr>
            `
        )
        .join("");

    document.querySelector("#tabla-puntos thead").innerHTML = `
        <tr>
            <th>i</th>
            <th>x_i</th>
            <th>f(x_i)</th>
        </tr>
    `;
    document.querySelector("#tabla-puntos tbody").innerHTML = filas;

    setHTMLIntegracion(
        "delta-container",
        `<div class="latex-box">$$h=\\Delta x=\\frac{${data.b}-${data.a}}{${data.n}}=${f(data.deltaX)}$$</div>`
    );

    setHTMLIntegracion(
        "formula-container",
        `<div class="latex-box">$$I\\approx \\frac{h}{2}\\left[f(x_0)+2\\sum_{i=1}^{n-1}f(x_i)+f(x_n)\\right]$$</div>`
    );

    setHTMLIntegracion(
        "sustitucion-container",
        `<div class="latex-box">$$I\\approx \\frac{${f(data.deltaX)}}{2}\\left[${f(data.puntos[0].fx)}+2(${f(data.sumaInterior)})+${f(data.puntos[data.puntos.length - 1].fx)}\\right]=${f(data.resultado)}$$</div>`
    );

    renderResultadoComun(data);
    renderProcedimientoTrapecio(data);
}

function renderRomberg(data) {
    const f = formatearNumeroIntegracion;
    const encabezados = Array.from(
        { length: data.niveles },
        (_, i) => `<th>R(k, ${i + 1})</th>`
    ).join("");

    const filas = data.tabla
        .map((fila, i) => {
            const celdas = Array.from({ length: data.niveles }, (_, j) => {
                const valor = j <= i ? f(fila[j], 10) : "";
                return `<td>${valor}</td>`;
            }).join("");

            return `
                <tr>
                    <td>${i + 1}</td>
                    <td>${Math.pow(2, i)}</td>
                    ${celdas}
                </tr>
            `;
        })
        .join("");

    document.querySelector("#tabla-puntos thead").innerHTML = `
        <tr>
            <th>Nivel</th>
            <th>Subintervalos</th>
            ${encabezados}
        </tr>
    `;
    document.querySelector("#tabla-puntos tbody").innerHTML = filas;

    setHTMLIntegracion(
        "delta-container",
        `<div class="latex-box">$$h_{final}=\\frac{${data.b}-${data.a}}{2^{${data.niveles - 1}}}=${f(data.deltaX)}$$</div>`
    );

    setHTMLIntegracion(
        "formula-container",
        `<div class="latex-box">$$R_{k,j}=\\frac{4^jR_{k,j-1}-R_{k-1,j-1}}{4^j-1}$$</div>`
    );

    setHTMLIntegracion(
        "sustitucion-container",
        `<div class="latex-box">$$I\\approx R_{${data.niveles},${data.niveles}}=${f(data.resultado)}$$</div>`
    );

    renderResultadoComun(data);
    renderProcedimientoRomberg(data);
}

function renderResultadoComun(data) {
    setHTMLIntegracion(
        "resultado-container",
        `
        <div class="resultado-final">
            <h3>Resultado final</h3>
            <p>Metodo: <b>${data.metodo}</b></p>
            <p>Integral aproximada: <b>${formatearNumeroIntegracion(data.resultado, 12)}</b></p>
            <p>Area real: <b>${formatearNumeroIntegracion(data.areaReal, 12)}</b></p>
            <p>Error absoluto: <b>${formatearNumeroIntegracion(data.errorAbsoluto, 12)}</b></p>
            <p>Error porcentual: <b>${data.errorPorcentual === null ? "No definido" : formatearNumeroIntegracion(data.errorPorcentual, 8) + "%"}</b></p>
        </div>
        `
    );

    setHTMLIntegracion(
        "comparacion-area",
        `
        <div class="area-resumen">
            <div>
                <span>Area real</span>
                <strong>${formatearNumeroIntegracion(data.areaReal, 12)}</strong>
            </div>
            <div>
                <span>Area por ${data.metodo}</span>
                <strong>${formatearNumeroIntegracion(data.resultado, 12)}</strong>
            </div>
            <div>
                <span>Error</span>
                <strong>${formatearNumeroIntegracion(data.errorAbsoluto, 12)}</strong>
            </div>
            <div>
                <span>Error porcentual</span>
                <strong>${data.errorPorcentual === null ? "No definido" : formatearNumeroIntegracion(data.errorPorcentual, 8) + "%"}</strong>
            </div>
        </div>
        `
    );
}

function renderProcedimientoRectangulos(data) {
    const f = formatearNumeroIntegracion;
    const puntosX = data.puntos
        .map(punto => formulaLinea(`x_${punto.i}`, `${data.a}+${punto.i}(${f(data.deltaX)})=${f(punto.izquierda)}`))
        .join("");
    const puntosMedios = data.puntos
        .map(punto => formulaLinea(`m_${punto.i}`, `\\frac{${f(punto.izquierda)}+${f(punto.derecha)}}{2}=${f(punto.xi)}`))
        .join("");
    const evaluaciones = data.puntos
        .map(punto => formulaLinea(`f(m_${punto.i})`, `f(${f(punto.xi)})=${f(punto.fx)}`))
        .join("");
    const sumaFx = data.puntos
        .map(punto => f(punto.fx))
        .join("+");

    setHTMLIntegracion(
        "procedimiento-container",
        `
        ${pasoHTML(1, "Ancho de cada rectangulo", `
            <div class="latex-box">
                $$\\Delta x=\\frac{b-a}{n}=\\frac{${data.b}-${data.a}}{${data.n}}=${f(data.deltaX)}$$
            </div>
        `)}

        ${pasoHTML(2, "Calculo de los puntos iniciales", puntosX)}

        ${pasoHTML(3, "Calculo del punto medio", puntosMedios)}

        ${pasoHTML(4, "Sustitucion de cada punto medio en f(x)", evaluaciones)}

        ${pasoHTML(5, "Sustitucion en la regla de rectangulos", `
            <div class="latex-box">
                $$I\\approx \\Delta x\\sum f(m_i)$$
                $$I\\approx ${f(data.deltaX)}\\left(${sumaFx}\\right)$$
                $$I\\approx ${f(data.deltaX)}(${f(data.suma)})=${f(data.resultado)}$$
            </div>
        `)}
        `
    );
}

function renderProcedimientoTrapecio(data) {
    const f = formatearNumeroIntegracion;
    const puntosX = data.puntos
        .map(punto => formulaLinea(`x_${punto.i}`, `${data.a}+${punto.i}(${f(data.deltaX)})=${f(punto.xi)}`))
        .join("");
    const evaluaciones = data.puntos
        .map(punto => formulaLinea(`f(x_${punto.i})`, `f(${f(punto.xi)})=${f(punto.fx)}`))
        .join("");
    const interiores = data.puntos
        .filter(punto => punto.i > 0 && punto.i < data.n)
        .map(punto => f(punto.fx))
        .join("+") || "0";

    setHTMLIntegracion(
        "procedimiento-container",
        `
        ${pasoHTML(1, "Ancho de cada trapecio", `
            <div class="latex-box">
                $$h=\\frac{b-a}{n}=\\frac{${data.b}-${data.a}}{${data.n}}=${f(data.deltaX)}$$
            </div>
        `)}

        ${pasoHTML(2, "Calculo de x0, x1, x2, ...", puntosX)}

        ${pasoHTML(3, "Sustitucion de cada x_i en f(x)", evaluaciones)}

        ${pasoHTML(4, "Suma de puntos interiores", `
            <div class="latex-box">
                $$\\sum_{i=1}^{n-1}f(x_i)=${interiores}=${f(data.sumaInterior)}$$
            </div>
        `)}

        ${pasoHTML(5, "Sustitucion en la regla del trapecio", `
            <div class="latex-box">
                $$I\\approx \\frac{h}{2}\\left[f(x_0)+2\\sum_{i=1}^{n-1}f(x_i)+f(x_n)\\right]$$
                $$I\\approx \\frac{${f(data.deltaX)}}{2}\\left[${f(data.puntos[0].fx)}+2(${f(data.sumaInterior)})+${f(data.puntos[data.puntos.length - 1].fx)}\\right]$$
                $$I\\approx ${f(data.resultado)}$$
            </div>
        `)}
        `
    );
}

function renderProcedimientoRomberg(data) {
    const f = formatearNumeroIntegracion;
    const trapecios = data.detalles
        .map(detalle => {
            const suma = detalle.puntos.map(punto => f(punto.fx)).join("+") || "0";

            return `
                <div class="romberg-bloque">
                    <h4>Nivel ${detalle.nivel}: n=${detalle.n}, h=${f(detalle.h)}</h4>
                    <div class="latex-box">
                        $$R_{${detalle.nivel},1}=\\frac{${f(detalle.h)}}{2}\\left[${f(detalle.fa)}+2(${suma})+${f(detalle.fb)}\\right]$$
                        $$R_{${detalle.nivel},1}=${f(data.tabla[detalle.nivel - 1][0])}$$
                    </div>
                </div>
            `;
        })
        .join("");
    const columnas = [];

    for (let j = 1; j < data.niveles; j++) {
        const operaciones = [];

        for (let k = j; k < data.niveles; k++) {
            const factor = Math.pow(4, j);

            operaciones.push(`
                <div class="latex-box">
                    $$R_{${k + 1},${j + 1}}=\\frac{${factor}R_{${k + 1},${j}}-R_{${k},${j}}}{${factor}-1}$$
                    $$R_{${k + 1},${j + 1}}=\\frac{${factor}(${f(data.tabla[k][j - 1])})-${f(data.tabla[k - 1][j - 1])}}{${factor - 1}}=${f(data.tabla[k][j])}$$
                </div>
            `);
        }

        columnas.push(
            pasoHTML(
                j + 2,
                `Columna ${j + 1}: quedan ${data.niveles - j} valores`,
                operaciones.join("")
            )
        );
    }

    setHTMLIntegracion(
        "procedimiento-container",
        `
        ${pasoHTML(1, "Primera columna con trapecio compuesto", trapecios)}
        ${columnas.join("")}
        ${pasoHTML(data.niveles + 1, "Resultado final de la tabla Romberg", `
            <div class="latex-box">
                $$I\\approx R_{${data.niveles},${data.niveles}}=${f(data.resultado)}$$
            </div>
        `)}
        `
    );
}

function pasoHTML(numero, titulo, contenido) {
    return `
        <div class="paso-card">
            <h3>Paso ${numero}: ${titulo}</h3>
            ${contenido}
        </div>
    `;
}

function formulaLinea(izquierda, derecha) {
    return `
        <div class="latex-box formula-linea">
            $$${izquierda}=${derecha}$$
        </div>
    `;
}
