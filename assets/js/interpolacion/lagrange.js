// =====================
// LAGRANGE.JS
// INTERPOLACIÓN
// =====================


// =====================
// RESOLVER LAGRANGE
// =====================

window.resolverLagrange =
function () {

    const datos =
        obtenerDatosTabla();

    if (
        datos.length < 2
    ) {
        alert(
            "Ingrese al menos 2 puntos."
        );
        return;
    }

    // =====================
    // VALIDAR X DUPLICADOS
    // =====================

    const xValues =
        datos.map(
            d => d.x
        );

    const xUnicos =
        new Set(xValues);

    if (
        xUnicos.size !==
        xValues.length
    ) {
        alert(
            "Error: No puede haber valores de x duplicados. Cada punto debe tener un x único."
        );
        return;
    }

    const n =
        datos.length;

    // =====================
    // LIMPIAR PASOS
    // =====================

    document.getElementById(
        "procedimiento-diferencias"
    ).innerHTML = "";

    document.getElementById(
        "tabla-newton-container"
    ).innerHTML = "";

    document.getElementById(
        "coeficientes-container"
    ).innerHTML = "";

    // =====================
    // POLINOMIOS DE LAGRANGE
    // =====================

    let html =
        `<div class="lagrange-pasos">`;

    let expresionLagrange =
        "";

    for (
        let i = 0;
        i < n;
        i++
    ) {

        const xi =
            datos[i].x;

        const fxi =
            datos[i].fx;

        let Li = "";

        let denominador = 1;

        for (
            let j = 0;
            j < n;
            j++
        ) {

            if (i === j) {
                continue;
            }

            const xj =
                datos[j].x;

            denominador *=
                (xi - xj);

            if (xj >= 0) {
                Li +=
                    `(x-${xj})*`;
            } else {
                Li +=
                    `(x+${Math.abs(xj)})*`;
            }
        }

        Li =
            Li.slice(0, -1);

        html +=
            `
            <div class="lagrange-paso">
                <h3>
                    L<sub>${i}</sub>(x)
                </h3>
                <p>
                    L<sub>${i}</sub>(x) = $$\\frac{${Li}}{${denominador.toFixed(4)}}$$
                </p>
                <p>
                    f(x<sub>${i}</sub>) = ${fxi}
                </p>
            </div>
            `;

        if (
            expresionLagrange !== ""
        ) {
            expresionLagrange +=
                "+";
        }

        expresionLagrange +=
            `(${fxi})*(${Li})/(${denominador})`;
    }

    html += `</div>`;

    document.getElementById(
        "procedimiento-diferencias"
    ).innerHTML = html;

    refrescarMathJax();

    // =====================
    // CONSTRUCCIÓN
    // =====================

    let latexConstruccion =
        "P_n(x)=";

    for (
        let i = 0;
        i < n;
        i++
    ) {

        const xi =
            datos[i].x;

        const fxi =
            datos[i].fx;

        let Li = "";

        let denominador = 1;

        for (
            let j = 0;
            j < n;
            j++
        ) {

            if (i === j) {
                continue;
            }

            const xj =
                datos[j].x;

            denominador *=
                (xi - xj);

            if (xj >= 0) {
                Li +=
                    `(x-${xj})`;
            } else {
                Li +=
                    `(x+${Math.abs(xj)})`;
            }
        }

        if (i > 0) {
            latexConstruccion +=
                "+";
        }

        latexConstruccion +=
            `\\frac{${fxi} \\cdot ${Li}}{${denominador.toFixed(4)}}`;
    }

    document.getElementById(
        "construccion-container"
    ).innerHTML =
        `
        <div class="latex-box">
            $$
            ${latexConstruccion}
            $$
        </div>
        `;

    refrescarMathJax();

    // =====================
    // SIMPLIFICACIÓN
    // =====================

    simplificarLagrange(
        datos,
        expresionLagrange
    );

    // =====================
    // VERIFICACIÓN
    // =====================

    verificarLagrange(
        datos
    );
}


// =====================
// SIMPLIFICAR LAGRANGE
// =====================

function simplificarLagrange(
    datos,
    expresion
) {

    try {

        const n =
            datos.length;

        let html =
            `<div class="simplificacion-steps">`;

        // =====================
        // PASO 1: EXPRESIÓN
        // =====================

        html +=
            `
            <div class="paso-simplificacion">
                <h3>
                    Paso 1: Forma de Lagrange
                </h3>
                <div class="latex-box">
                    $$P_n(x)=${expresion}$$
                </div>
            </div>
            `;

        // =====================
        // PASO 2: EXPANDIR
        // =====================

        html +=
            `
            <div class="paso-simplificacion">
                <h3>
                    Paso 2: Expandir términos
                </h3>
            `;

        let expresionAcumulada =
            "";

        for (
            let i = 0;
            i < n;
            i++
        ) {

            const xi =
                datos[i].x;

            const fxi =
                datos[i].fx;

            let Li = "";

            let denominador = 1;

            for (
                let j = 0;
                j < n;
                j++
            ) {

                if (i === j) {
                    continue;
                }

                const xj =
                    datos[j].x;

                denominador *=
                    (xi - xj);

                if (xj >= 0) {
                    Li +=
                        `(x-${xj})*`;
                } else {
                    Li +=
                        `(x+${Math.abs(xj)})*`;
                }
            }

            Li = Li.slice(0, -1);

            const termino =
                `(${fxi})*(${Li})/(${denominador})`;

            const terminoExpandido =
                nerdamer(
                    `expand(${termino})`
                ).toTeX();

            html +=
                `
                <div class="termino-expandido">
                    <p>
                        Término ${i + 1}: L<sub>${i}</sub>(x)
                    </p>
                    <p style="margin-left: 20px;">
                        $$${terminoExpandido}$$
                    </p>
                </div>
                `;

            if (
                expresionAcumulada !== ""
            ) {
                expresionAcumulada +=
                    "+";
            }

            expresionAcumulada +=
                termino;
        }

        html += `</div>`;

        // =====================
        // PASO 3: SUMAR
        // =====================

        const expandida =
            nerdamer(
                `expand(${expresionAcumulada})`
            );

        const latexFinal =
            expandida.toTeX();

        html +=
            `
            <div class="paso-simplificacion">
                <h3>
                    Paso 3: Sumar y simplificar
                </h3>
                <div class="latex-box">
                    $$P_n(x)=${latexFinal}$$
                </div>
            </div>
            `;

        html += `</div>`;

        document.getElementById(
            "simplificacion-container"
        ).innerHTML = html;

        document.getElementById(
            "polinomio-final-container"
        ).innerHTML =
            `
            <div class="polinomio-final">
                <h2>
                    Polinomio Interpolante
                </h2>
                $$P_n(x)=${latexFinal}$$
            </div>
            `;

        // Guardar polinomio para visualización
        window.polinomioLagrangeLatex = latexFinal;
        window.datosActuales = datos;

        refrescarMathJax();

    }
    catch (error) {

        console.error(
            "Error en simplificación:",
            error
        );

        document.getElementById(
            "simplificacion-container"
        ).innerHTML =
            "No se pudo simplificar.";
    }
}


// =====================
// VERIFICAR LAGRANGE
// =====================

function verificarLagrange(
    datos
) {

    try {

        let html =
            `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>x</th>
                            <th>f(x)</th>
                            <th>P(x)</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

        datos.forEach(
            (punto, i) => {

                let Li = "";

                let denominador = 1;

                const xi =
                    punto.x;

                for (
                    let j = 0;
                    j < datos.length;
                    j++
                ) {

                    if (i === j) {
                        continue;
                    }

                    const xj =
                        datos[j].x;

                    denominador *=
                        (xi - xj);

                    if (xj >= 0) {
                        Li +=
                            `(${xi}-${xj})*`;
                    } else {
                        Li +=
                            `(${xi}+${Math.abs(xj)})*`;
                    }
                }

                Li = Li.slice(0, -1);

                const resultado =
                    eval(Li) * punto.fx /
                    denominador;

                html +=
                    `
                    <tr>
                        <td>${punto.x}</td>
                        <td>${punto.fx}</td>
                        <td>${resultado.toFixed(6)}</td>
                    </tr>
                    `;
            }
        );

        html +=
            `
                    </tbody>
                </table>
            </div>
            `;

        document.getElementById(
            "verificacion-container"
        ).innerHTML = html;

        refrescarMathJax();

    }
    catch (error) {

        console.error(
            "Error en verificación:",
            error
        );
    }
}