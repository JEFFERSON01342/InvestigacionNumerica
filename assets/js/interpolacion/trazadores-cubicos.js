// =====================
// TRAZADORES CÚBICOS
// INTERPOLACIÓN
// =====================


// =====================
// RESOLVER TRAZADORES
// =====================

window.resolverTrazadores =
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
            "Error: No puede haber valores de x duplicados."
        );
        return;
    }

    // Ordenar por x
    datos.sort(
        (a, b) =>
            a.x - b.x
    );

    // =====================
    // LIMPIAR TODOS LOS RESULTADOS PREVIOS
    // =====================

    const ids = [
        "tabla-newton-container",
        "procedimiento-diferencias",
        "coeficientes-container",
        "construccion-container",
        "simplificacion-container",
        "polinomio-final-container",
        "evaluacion-container",
        "verificacion-container"
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = "";
        }
    });

    // =====================
    // MOSTRAR PROCEDIMIENTO PASO A PASO
    // =====================

    // =====================
    // CALCULAR TRAZADORES
    // =====================

    const splines =
        calcularSplines(
            datos
        );

    window.trazadoresActuales = {
        datos,
        splines
    };

    window.datosActuales = datos;

    mostrarProcedimientoTrazadoresCompleto(
        datos
    );

    // =====================
    // MOSTRAR ECUACIONES FINALES
    // =====================

    mostrarEcuacionesSplines(
        datos,
        splines
    );

    // =====================
    // MOSTRAR COEFICIENTES
    // =====================

    mostrarCoeficientesSplines(
        splines
    );

    mostrarSistemaTrazadores(
        datos
    );

    mostrarSplinePorPartes(
        splines
    );

    // =====================
    // VERIFICACIÓN
    // =====================

    verificarTrazadores(
        datos,
        splines
    );
}


// =====================
// CALCULAR SPLINES
// =====================

function calcularSplines(datos) {

    const n =
        datos.length;

    const h = [];

    for (
        let i = 0;
        i < n - 1;
        i++
    ) {
        h[i] =
            datos[i + 1].x -
            datos[i].x;
    }

    // Sistema tridiagonal
    const alpha = [0];

    for (
        let i = 1;
        i < n - 1;
        i++
    ) {

        alpha[i] =
            (3 / h[i]) *
            (datos[i + 1].fx -
             datos[i].fx) -
            (3 / h[i - 1]) *
            (datos[i].fx -
             datos[i - 1].fx);
    }

    alpha[n - 1] = 0;

    // Resolver sistema tridiagonal
    const l = [];
    const mu = [];
    const z = [];

    l[0] = 1;
    mu[0] = 0;
    z[0] = 0;

    for (
        let i = 1;
        i < n - 1;
        i++
    ) {

        l[i] =
            2 *
            (h[i - 1] + h[i]) -
            h[i - 1] * mu[i - 1];

        if (Math.abs(l[i]) < 1e-10) {
            l[i] = 1e-10;
        }

        mu[i] =
            h[i] / l[i];

        z[i] =
            (alpha[i] -
             h[i - 1] * z[i - 1]) /
            l[i];
    }

    l[n - 1] = 1;
    z[n - 1] = 0;

    const c = [];
    c[n - 1] = 0;

    for (
        let j = n - 2;
        j >= 0;
        j--
    ) {

        c[j] =
            z[j] -
            mu[j] * c[j + 1];
    }

    // Calcular a, b, d
    const splines = [];

    for (
        let i = 0;
        i < n - 1;
        i++
    ) {

        const a =
            datos[i].fx;

        const b =
            (datos[i + 1].fx -
             datos[i].fx) /
            h[i] -
            h[i] *
            (c[i + 1] + 2 * c[i]) /
            3;

        const d =
            (c[i + 1] - c[i]) /
            (3 * h[i]);

        splines.push({
            x0: datos[i].x,
            x1: datos[i + 1].x,
            a,
            b,
            c: c[i],
            d,
            h: h[i]
        });
    }

    return splines;
}


// =====================
// MOSTRAR PROCEDIMIENTO PASO A PASO
// =====================

function mostrarProcedimientoTrazadores(
    datos
) {

    const n = datos.length;
    let html = `<div class="splines-procedimiento">`;

    // =====================
    // PASO 1: INTERPOLACIÓN
    // =====================

    html += `
        <div class="paso-card">
            <h3>Paso 1: Condiciones de Interpolación (${2*(n-1)} ecuaciones)</h3>
            <p style="color: #666; font-size: 13px; margin-bottom: 10px;">
                Cada spline debe pasar por los extremos de su intervalo.
            </p>
            <div class="ecuaciones-interpolacion">
    `;

    for (let i = 0; i < n - 1; i++) {
        html += `
            <div style="margin: 5px 0; padding-left: 15px;">
                <p style="font-size: 12px;">
                    $$S_${i}(${datos[i].x.toFixed(4)}) = ${datos[i].fx.toFixed(4)}$$
                </p>
            </div>
            <div style="margin: 5px 0; padding-left: 15px;">
                <p style="font-size: 12px;">
                    $$S_${i}(${datos[i+1].x.toFixed(4)}) = ${datos[i+1].fx.toFixed(4)}$$
                </p>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    // =====================
    // PASO 2: CONTINUIDAD DERIVADA PRIMERA
    // =====================

    html += `
        <div class="paso-card">
            <h3>Paso 2: Continuidad de Primera Derivada (${n-2} ecuaciones)</h3>
            <p style="color: #666; font-size: 13px; margin-bottom: 10px;">
                Para que no haya "quiebres" en la curva: \$S_i'(x_{i+1}) = S_{i+1}'(x_{i+1})\$
            </p>
            <p style="color: #999; font-size: 12px; margin-bottom: 8px;">
                Donde \$S_i'(x) = 3a_i x^2 + 2b_i x + c_i\$
            </p>
            <div class="ecuaciones-derivadas">
    `;

    for (let i = 1; i < n - 1; i++) {
        html += `
            <div style="margin: 5px 0; padding-left: 15px;">
                <p style="font-size: 12px;">
                    $$S_{${i-1}}'(${datos[i].x.toFixed(4)}) = S_{${i}}'(${datos[i].x.toFixed(4)})$$
                </p>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    // =====================
    // PASO 3: CONTINUIDAD DERIVADA SEGUNDA
    // =====================

    html += `
        <div class="paso-card">
            <h3>Paso 3: Continuidad de Segunda Derivada (${n-2} ecuaciones)</h3>
            <p style="color: #666; font-size: 13px; margin-bottom: 10px;">
                Para que la curvatura también sea suave: \$S_i''(x_{i+1}) = S_{i+1}''(x_{i+1})\$
            </p>
            <p style="color: #999; font-size: 12px; margin-bottom: 8px;">
                Donde \$S_i''(x) = 6a_i x + 2b_i\$
            </p>
            <div class="ecuaciones-derivadas-segunda">
    `;

    for (let i = 1; i < n - 1; i++) {
        html += `
            <div style="margin: 5px 0; padding-left: 15px;">
                <p style="font-size: 12px;">
                    $$S_{${i-1}}''(${datos[i].x.toFixed(4)}) = S_{${i}}''(${datos[i].x.toFixed(4)})$$
                </p>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    // =====================
    // PASO 4: CONDICIONES DE FRONTERA
    // =====================

    html += `
        <div class="paso-card">
            <h3>Paso 4: Condiciones de Frontera Natural (2 ecuaciones)</h3>
            <p style="color: #666; font-size: 13px; margin-bottom: 10px;">
                En los extremos, la segunda derivada es cero (spline natural):
            </p>
            <div class="ecuaciones-frontera">
                <div style="margin: 5px 0; padding-left: 15px;">
                    <p style="font-size: 12px;">
                        $$S_0''(${datos[0].x.toFixed(4)}) = 0$$
                    </p>
                </div>
                <div style="margin: 5px 0; padding-left: 15px;">
                    <p style="font-size: 12px;">
                        $$S_{${n-2}}''(${datos[n-1].x.toFixed(4)}) = 0$$
                    </p>
                </div>
            </div>
        </div>
    `;

    // =====================
    // RESUMEN DE ECUACIONES
    // =====================

    html += `
        <div class="paso-card" style="background-color: #f0f7ff; border-left: 4px solid #2196F3;">
            <h3 style="color: #1976D2;">Resumen: Total de Ecuaciones</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                <div>
                    <p><strong>Ecuación</strong></p>
                    <p>Interpolación</p>
                    <p>Derivada 1ª</p>
                    <p>Derivada 2ª</p>
                    <p>Frontera</p>
                    <p style="border-top: 2px solid #1976D2; padding-top: 8px;"><strong>Total</strong></p>
                </div>
                <div>
                    <p><strong>Cantidad</strong></p>
                    <p>${2*(n-1)}</p>
                    <p>${n-2}</p>
                    <p>${n-2}</p>
                    <p>2</p>
                    <p style="border-top: 2px solid #1976D2; padding-top: 8px;"><strong>${2*(n-1) + 2*(n-2) + 2}</strong></p>
                </div>
            </div>
            <p style="margin-top: 12px; color: #555; font-size: 13px;">
                Tenemos <strong>${2*(n-1) + 2*(n-2) + 2}</strong> ecuaciones y <strong>${4*(n-1)}</strong> incógnitas (${n-1} splines × 4 coeficientes)
            </p>
        </div>
    `;

    html += `</div>`;

    document.getElementById(
        "procedimiento-diferencias"
    ).innerHTML = html;

    refrescarMathJax();
}


function mostrarTablaOrdenadaTrazadores(
    datos
) {

    let html =
        `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>i</th>
                        <th>x_i</th>
                        <th>y_i</th>
                        <th>h_i=x_{i+1}-x_i</th>
                    </tr>
                </thead>
                <tbody>
        `;

    datos.forEach((p, i) => {
        const h =
            i < datos.length - 1
                ? fmt(datos[i + 1].x - p.x)
                : "-";

        html += `
            <tr>
                <td>${i}</td>
                <td>${fmt(p.x)}</td>
                <td>${fmt(p.fx)}</td>
                <td>${h}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    document.getElementById(
        "tabla-newton-container"
    ).innerHTML = html;
}


function mostrarSistemaTrazadores(
    datos
) {

    const segmentos =
        datos.length - 1;

    const ecuaciones = obtenerEcuacionesSistemaTrazadores(datos);
    
    const splines = window.trazadoresActuales.splines;

    let html =
        `
        <div class="splines-ecuaciones">
            <div class="paso-card">
                <h3>Sistema de Ecuaciones Lineal</h3>
                <p style="color: #666; font-size: 13px; margin-bottom: 15px;">
                    Al combinar todas las condiciones, se obtiene un sistema de ${ecuaciones.length} ecuaciones con ${4 * segmentos} incógnitas:
                </p>
                <div class="latex-box" style="background-color: #f5f5f5; padding: 15px; text-align: left;">
                    $$\\begin{cases}
        `;

    ecuaciones.forEach((ecuacion, i) => {
        const esUltima = (i === ecuaciones.length - 1);
        html += `${ecuacion}${!esUltima ? '\\\\' : ''}
        `;
    });

    html += `
                    \\end{cases}$$
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                    <div>
                        <p style="color: #666; font-size: 13px; margin-bottom: 10px;">
                            <strong>Vector de incógnitas:</strong>
                        </p>
                        <div class="latex-box" style="background-color: #fff; padding: 10px;">
                            $$X = \\begin{bmatrix}${formatearVectorCoeficientesLatex(segmentos)}\\end{bmatrix}$$
                        </div>
                    </div>
                    
                    <div>
                        <p style="color: #666; font-size: 13px; margin-bottom: 10px;">
                            <strong>Vector solución X resuelto:</strong>
                        </p>
                        <div class="latex-box" style="background-color: #e8f5e9; padding: 10px;">
                            $$X = \\begin{bmatrix}${formatearVectorSolucion(splines)}\\end{bmatrix}$$
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById(
        "simplificacion-container"
    ).innerHTML = html;

    refrescarMathJax();
}


function formatearVectorSolucion(
    splines
) {

    const valores = [];

    splines.forEach(s => {
        valores.push(
            fmt(s.a, 6),
            fmt(s.b, 6),
            fmt(s.c, 6),
            fmt(s.d, 6)
        );
    });

    return valores.join("\\\\");
}


function mostrarSplinePorPartes(
    splines
) {

    const partes =
        splines.map((s, i) => {
            const g =
                convertirCoeficientesGlobales(s);

            return `
                ${formatearPolinomioGlobal(g)},&
                ${fmt(s.x0)}\\le x\\le ${fmt(s.x1)}
            `;
        }).join("\\\\");

    const html =
        `
        <div class="polinomio-final">
            <h2>Spline cubico natural</h2>
            <div class="latex-box spline-final-box">
                $$S(x)=\\begin{cases}
                    ${partes}
                \\end{cases}$$
            </div>
        </div>
    `;

    document.getElementById(
        "polinomio-final-container"
    ).innerHTML = html;

    refrescarMathJax();
}


function obtenerEcuacionesSistemaTrazadores(
    datos
) {

    const ecuaciones = [];
    const segmentos =
        datos.length - 1;

    for (let i = 0; i < segmentos; i++) {
        ecuaciones.push(
            ecuacionInterpolacion(i, datos[i].x, datos[i].fx)
        );

        ecuaciones.push(
            ecuacionInterpolacion(i, datos[i + 1].x, datos[i + 1].fx)
        );
    }

    for (let i = 1; i < datos.length - 1; i++) {
        ecuaciones.push(
            ecuacionDerivadaPrimera(i - 1, i, datos[i].x)
        );
    }

    for (let i = 1; i < datos.length - 1; i++) {
        ecuaciones.push(
            ecuacionDerivadaSegunda(i - 1, i, datos[i].x)
        );
    }

    ecuaciones.push(
        `6a_0(${fmt(datos[0].x)})+2b_0=0`
    );

    ecuaciones.push(
        `6a_${segmentos - 1}(${fmt(datos[datos.length - 1].x)})+2b_${segmentos - 1}=0`
    );

    return ecuaciones;
}


function ecuacionInterpolacion(
    i,
    x,
    y
) {

    return `${fmtPotencia(x, 3)}a_${i}+${fmtPotencia(x, 2)}b_${i}+${fmt(x)}c_${i}+d_${i}=${fmt(y)}`;
}


function ecuacionDerivadaPrimera(
    izquierda,
    derecha,
    x
) {

    return `${fmt(3 * x * x)}a_${izquierda}+${fmt(2 * x)}b_${izquierda}+c_${izquierda}`
        + `=${fmt(3 * x * x)}a_${derecha}+${fmt(2 * x)}b_${derecha}+c_${derecha}`;
}


function ecuacionDerivadaSegunda(
    izquierda,
    derecha,
    x
) {

    return `${fmt(6 * x)}a_${izquierda}+2b_${izquierda}`
        + `=${fmt(6 * x)}a_${derecha}+2b_${derecha}`;
}


function convertirCoeficientesGlobales(
    s
) {

    const a =
        s.d;

    const b =
        s.c - 3 * s.d * s.x0;

    const c =
        s.b - 2 * s.c * s.x0 + 3 * s.d * s.x0 * s.x0;

    const d =
        s.a - s.b * s.x0 + s.c * s.x0 * s.x0 - s.d * s.x0 * s.x0 * s.x0;

    return {
        a,
        b,
        c,
        d
    };
}


function formatearPolinomioGlobal(
    g
) {

    return `${fmt(g.a)}x^3${fmtTermino(g.b, "x^2")}${fmtTermino(g.c, "x")}${fmtTermino(g.d, "")}`;
}


function fmtTermino(
    valor,
    variable
) {

    const signo =
        valor >= 0
            ? "+"
            : "-";

    return `${signo}${fmt(Math.abs(valor))}${variable}`;
}


function fmtPotencia(
    x,
    potencia
) {

    return fmt(
        Math.pow(x, potencia)
    );
}


function fmt(
    valor,
    decimales = 4
) {

    if (
        !isFinite(valor)
    ) {
        return String(valor);
    }

    return Number(valor)
        .toFixed(decimales)
        .replace(/\.?0+$/, "");
}


function formatearPuntosTrazadores(
    datos
) {

    return datos
        .map(p => `(${fmt(p.x)},${fmt(p.fx)})`)
        .join(",");
}


function formatearVectorCoeficientes(
    segmentos
) {

    const coeficientes = [];

    for (let i = 0; i < segmentos; i++) {
        coeficientes.push(
            `a_${i}`,
            `b_${i}`,
            `c_${i}`,
            `d_${i}`
        );
    }

    return coeficientes.join(", ");
}


function formatearVectorCoeficientesLatex(
    segmentos
) {

    const coeficientes = [];

    for (let i = 0; i < segmentos; i++) {
        coeficientes.push(
            `a_${i}`,
            `b_${i}`,
            `c_${i}`,
            `d_${i}`
        );
    }

    return coeficientes.join("\\\\");
}


// =====================
// MOSTRAR COEFICIENTES
// =====================

function mostrarProcedimientoTrazadoresCompleto(
    datos
) {

    const segmentos =
        datos.length - 1;

    let html =
        `<div class="splines-procedimiento">`;

    html += `
        <div class="paso-card">
            <h3>Paso 1: Ordenar los datos</h3>
            <p>Los puntos se ordenan de menor a mayor segun x.</p>
            <div class="latex-box">
                $$${formatearPuntosTrazadores(datos)}$$
            </div>
        </div>

        <div class="paso-card">
            <h3>Paso 2: Construir los polinomios por intervalo</h3>
            <p>Con ${datos.length} puntos hay ${segmentos} intervalos.</p>
            <div class="latex-box">
                $$S_i(x)=a_i x^3+b_i x^2+c_i x+d_i$$
                $$i=0,1,\\ldots,${segmentos - 1}$$
            </div>
            <div class="trazadores-lista">
                ${datos.slice(0, -1).map((p, i) => `
                    <div class="trazador-linea">
                        $$S_${i}(x),\\quad ${fmt(p.x)}\\le x\\le ${fmt(datos[i + 1].x)}$$
                    </div>
                `).join("")}
            </div>
        </div>

        <div class="paso-card">
            <h3>Paso 3: Contar incognitas</h3>
            <p>Cada polinomio tiene 4 coeficientes: a_i, b_i, c_i y d_i.</p>
            <div class="latex-box">
                $$4n=4(${segmentos})=${4 * segmentos}$$
            </div>
            <p>Se necesitan ${4 * segmentos} ecuaciones para resolver todos los coeficientes.</p>
        </div>
    `;

    html += `
        <div class="paso-card">
            <h3>Paso 4: Condicion de interpolacion (${2 * segmentos} ecuaciones)</h3>
            <p>Cada spline debe pasar por los extremos de su intervalo.</p>
            <div class="trazadores-lista">
    `;

    for (let i = 0; i < segmentos; i++) {
        html += `
            <div class="trazador-linea">
                $$S_${i}(${fmt(datos[i].x)})=${fmt(datos[i].fx)}$$
                $$S_${i}(${fmt(datos[i + 1].x)})=${fmt(datos[i + 1].fx)}$$
            </div>
        `;
    }

    html += `
            </div>
        </div>

        <div class="paso-card">
            <h3>Paso 5: Continuidad de la primera derivada (${segmentos - 1} ecuaciones)</h3>
            <p>Para que no existan esquinas, las pendientes coinciden en cada punto interior.</p>
            <div class="latex-box">
                $$S_i'(x)=3a_i x^2+2b_i x+c_i$$
            </div>
            <p style="color: #666; font-size: 13px; margin-bottom: 10px;">Al igualar y simplificar:</p>
            <div class="trazadores-lista">
    `;

    for (let i = 1; i < datos.length - 1; i++) {
        const x = fmt(datos[i].x);
        html += `
            <div class="trazador-linea">
                <p style="font-size: 12px; margin: 3px 0;">$$3a_{${i-1}} (${x})^2 + 2b_{${i-1}} (${x}) + c_{${i-1}} = 3a_${i} (${x})^2 + 2b_${i} (${x}) + c_${i}$$</p>
                <p style="font-size: 11px; color: #999; margin-top: 2px;"> que resulta en: $$3(${fmt(datos[i].x * datos[i].x)})a_{${i-1}} + ${fmt(2*datos[i].x)}b_{${i-1}} + c_{${i-1}} = 3(${fmt(datos[i].x * datos[i].x)})a_${i} + ${fmt(2*datos[i].x)}b_${i} + c_${i}$$</p>
            </div>
        `;
    }

    html += `
            </div>
        </div>

        <div class="paso-card">
            <h3>Paso 6: Continuidad de la segunda derivada (${segmentos - 1} ecuaciones)</h3>
            <p>Para mantener suavidad y concavidad, tambien coinciden las segundas derivadas.</p>
            <div class="latex-box">
                $$S_i''(x)=6a_i x+2b_i$$
            </div>
            <p style="color: #666; font-size: 13px; margin-bottom: 10px;">Al igualar y simplificar:</p>
            <div class="trazadores-lista">
    `;

    for (let i = 1; i < datos.length - 1; i++) {
        const x = fmt(datos[i].x);
        html += `
            <div class="trazador-linea">
                <p style="font-size: 12px; margin: 3px 0;">$$6a_{${i-1}} (${x}) + 2b_{${i-1}} = 6a_${i} (${x}) + 2b_${i}$$</p>
                <p style="font-size: 11px; color: #999; margin-top: 2px;"> que resulta en: $$${fmt(6*datos[i].x)}a_{${i-1}} + 2b_{${i-1}} = ${fmt(6*datos[i].x)}a_${i} + 2b_${i}$$</p>
            </div>
        `;
    }

    html += `
            </div>
        </div>

        <div class="paso-card">
            <h3>Paso 7: Aplicar condiciones de frontera</h3>
            <p>Se usa spline cubico natural: la segunda derivada vale cero en los extremos.</p>
            <div class="latex-box">
                $$S_0''(${fmt(datos[0].x)})=0$$
                $$S_${segmentos - 1}''(${fmt(datos[datos.length - 1].x)})=0$$
            </div>
        </div>

        <div class="paso-card resumen-spline">
            <h3>Paso 8: Resolver el sistema</h3>
            <p>Al juntar todas las ecuaciones se obtiene:</p>
            <div class="latex-box">
                $$AX=B$$
            </div>
            <p>El vector X contiene ${4 * segmentos} coeficientes: ${formatearVectorCoeficientes(segmentos)}.</p>
        </div>

        <div class="paso-card">
            <h3>Paso 9: Escribir el spline completo</h3>
            <p>Con los coeficientes calculados se escribe una funcion por partes, una expresion para cada intervalo.</p>
        </div>

        <div class="paso-card">
            <h3>Paso 10: Interpolar el valor pedido</h3>
            <p>Cuando ingresas un valor de x, la app identifica el intervalo correspondiente y evalua ese tramo.</p>
        </div>
    `;

    html += `</div>`;

    document.getElementById(
        "procedimiento-diferencias"
    ).innerHTML = html;

    refrescarMathJax();
}

function mostrarCoeficientesSplines(
    splines
) {

    let html =
        `<div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Spline</th>
                        <th>Intervalo</th>
                        <th>a local</th>
                        <th>b local</th>
                        <th>c local</th>
                        <th>d local</th>
                    </tr>
                </thead>
                <tbody>`;

    splines.forEach(
        (s, i) => {

            html +=
                `
                <tr>
                    <td>S<sub>${i}</sub></td>
                    <td>[${s.x0.toFixed(4)}, ${s.x1.toFixed(4)}]</td>
                    <td>${s.a.toFixed(8)}</td>
                    <td>${s.b.toFixed(8)}</td>
                    <td>${s.c.toFixed(8)}</td>
                    <td>${s.d.toFixed(8)}</td>
                </tr>
                `;
        }
    );

    html +=
        `
                </tbody>
            </table>
        </div>`;

    document.getElementById(
        "coeficientes-container"
    ).innerHTML = html;
}


// =====================
// MOSTRAR ECUACIONES FINALES
// =====================

function mostrarEcuacionesSplines(
    datos,
    splines
) {

    let html =
        `<div class="splines-ecuaciones">
            <h3 style="margin-bottom: 15px;">Sustitución de Valores en los Polinomios</h3>
            <p style="color: #666; font-size: 13px; margin-bottom: 15px;">
                Cada spline se expresa en forma local usando desplazamientos desde x₀:
            </p>
        `;

    let ecuacionesGlobales = [];
    
    splines.forEach(
        (s, i) => {

            const xi =
                s.x0.toFixed(4);

            const xi1 =
                s.x1.toFixed(4);

            const a =
                s.a.toFixed(6);

            const b =
                s.b.toFixed(6);

            const c =
                s.c.toFixed(6);

            const d =
                s.d.toFixed(6);

            html +=
                `
                <div class="spline-paso" style="margin-bottom: 20px; padding: 12px; background-color: #f9f9f9; border-left: 4px solid #4CAF50; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0;">Polinomio ${i+1}: S<sub>${i}</sub>(x)</h4>
                        <span style="background-color: #e8f5e9; padding: 4px 8px; border-radius: 3px; font-size: 12px;">x ∈ [${xi}, ${xi1}]</span>
                    </div>
                    <p style="font-size: 12px; color: #666; margin-top: 8px;"><strong>Forma local:</strong></p>
                    <div class="latex-box" style="background-color: #fff; margin: 8px 0;">
                        $$S_${i}(x) = ${a} + ${b}(x-${xi}) + ${c}(x-${xi})^2 + ${d}(x-${xi})^3$$
                    </div>
                    <div style="background-color: #fff; padding: 8px; border-radius: 3px; margin-top: 8px;">
                        <p style="font-size: 11px; margin: 2px 0;"><strong>Coeficientes locales:</strong></p>
                        <p style="font-size: 11px; margin: 2px 0;">• a = ${a}</p>
                        <p style="font-size: 11px; margin: 2px 0;">• b = ${b}</p>
                        <p style="font-size: 11px; margin: 2px 0;">• c = ${c}</p>
                        <p style="font-size: 11px; margin: 2px 0;">• d = ${d}</p>
                    </div>
                </div>
                `;
            
            // Guardar ecuación global para después
            const ag = s.d;
            const bg = s.c - 3 * s.d * s.x0;
            const cg = s.b - 2 * s.c * s.x0 + 3 * s.d * s.x0 * s.x0;
            const dg = s.a - s.b * s.x0 + s.c * s.x0 * s.x0 - s.d * s.x0 * s.x0 * s.x0;
            
            ecuacionesGlobales.push({
                i,
                ag: ag.toFixed(6),
                bg: bg.toFixed(6),
                cg: cg.toFixed(6),
                dg: dg.toFixed(6)
            });
        }
    );

    html += `
        <div style="margin-top: 25px; padding: 15px; background-color: #e3f2fd; border-radius: 4px; border-left: 4px solid #2196F3;">
            <h3 style="margin-top: 0; color: #1565c0;">Forma Global de los Polinomios</h3>
            <p style="color: #666; font-size: 13px; margin-bottom: 15px;">
                Al expandir los polinomios, se obtienen en términos de x (no en términos de (x-x₀)):
            </p>
            <div class="trazadores-lista">
    `;

    ecuacionesGlobales.forEach(eg => {
        html += `
                <div class="trazador-linea" style="margin-bottom: 8px;">
                    <p style="font-size: 12px; margin: 2px 0;">
                        $$S_${eg.i}(x) = ${eg.ag}x^3 + ${eg.bg}x^2 + ${eg.cg}x + ${eg.dg}$$
                    </p>
                </div>
        `;
    });

    html += `
            </div>
        </div>
    </div>`;

    document.getElementById(
        "construccion-container"
    ).innerHTML = html;

    refrescarMathJax();
}


// =====================
// VERIFICACIÓN
// =====================

function verificarTrazadores(
    datos,
    splines
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
                            <th>S(x)</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

        datos.forEach(
            punto => {

                let valor = 0;

                // Encontrar el spline correcto
                for (
                    let s of splines
                ) {

                    if (
                        punto.x >=
                        s.x0 &&
                        punto.x <=
                        s.x1
                    ) {

                        const dx =
                            punto.x -
                            s.x0;

                        valor =
                            s.a +
                            s.b * dx +
                            s.c * dx * dx +
                            s.d * dx * dx * dx;

                        break;
                    }
                }

                html +=
                    `
                    <tr>
                        <td>${punto.x.toFixed(4)}</td>
                        <td>${punto.fx.toFixed(4)}</td>
                        <td>${valor.toFixed(4)}</td>
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

    }
    catch (error) {

        console.error(
            "Error en verificación:",
            error
        );
    }
}


// =====================
// EVALUAR EN UN PUNTO
// =====================

window.evaluarTrazador =
function (x, splines) {

    for (
        let s of splines
    ) {

        if (
            x >= s.x0 &&
            x <= s.x1
        ) {

            const dx =
                x - s.x0;

            const valor =
                s.a +
                s.b * dx +
                s.c * dx * dx +
                s.d * dx * dx * dx;

            return valor;
        }
    }

    return null;
}


window.evaluarTrazadorCompleto =
function (
    xValor
) {

    let datos;
    let splines;

    if (
        window.trazadoresActuales
    ) {
        datos =
            window.trazadoresActuales.datos;

        splines =
            window.trazadoresActuales.splines;
    } else {
        datos =
            obtenerDatosTabla();

        datos.sort(
            (a, b) =>
                a.x - b.x
        );

        splines =
            calcularSplines(
                datos
            );
    }

    const spline =
        splines.find(s =>
            xValor >= s.x0 &&
            xValor <= s.x1
        );

    if (
        !spline
    ) {
        alert(
            "El valor de x esta fuera del rango de los datos."
        );
        return;
    }

    const dx =
        xValor - spline.x0;

    const valor =
        spline.a +
        spline.b * dx +
        spline.c * dx * dx +
        spline.d * dx * dx * dx;

    const indice =
        splines.indexOf(
            spline
        );

    const html =
        `
        <div class="resultado-evaluacion">
            <h3>Paso 10: Interpolar el valor pedido</h3>
            <p>El valor ${fmt(xValor)} cae en el intervalo [${fmt(spline.x0)}, ${fmt(spline.x1)}].</p>
            <div class="latex-box">
                $$S_${indice}(x)=${fmt(spline.a, 6)}+${fmt(spline.b, 6)}(x-${fmt(spline.x0)})+${fmt(spline.c, 6)}(x-${fmt(spline.x0)})^2+${fmt(spline.d, 6)}(x-${fmt(spline.x0)})^3$$
                $$S_${indice}(${fmt(xValor)})=${fmt(valor, 8)}$$
            </div>
            <p>Resultado: <strong>${fmt(valor, 8)}</strong></p>
        </div>
    `;

    document.getElementById(
        "evaluacion-container"
    ).innerHTML = html;

    refrescarMathJax();
}


const evaluarPolinomioInterpolacionBase =
    window.evaluarPolinomio;

window.evaluarPolinomio =
function () {

    const metodo =
        document.getElementById(
            "metodo"
        )?.value;

    if (
        metodo !== "trazadores"
    ) {
        return evaluarPolinomioInterpolacionBase();
    }

    const xInput =
        document.getElementById(
            "x-evaluar"
        );

    if (
        !xInput ||
        !xInput.value
    ) {
        alert(
            "Ingrese un valor de x"
        );
        return;
    }

    const xValor =
        parseFloat(
            xInput.value
        );

    if (
        isNaN(xValor)
    ) {
        alert(
            "Valor de x invalido"
        );
        return;
    }

    window.evaluarTrazadorCompleto(
        xValor
    );
}
