// =====================
// RENDER.JS
// INTERPOLACIÓN
// =====================


// =====================
// INIT
// =====================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        eventosInterpolacion();

        generarTablaDatos();
    }
);


// =====================
// EVENTOS
// =====================

function eventosInterpolacion() {

    const btnGenerar =

        document.getElementById(
            "btn-generar-tabla"
        );

    if (btnGenerar) {

        btnGenerar.addEventListener(

            "click",

            generarTablaDatos
        );
    }

    const btnLimpiar =

        document.getElementById(
            "btn-limpiar"
        );

    if (btnLimpiar) {

        btnLimpiar.addEventListener(

            "click",

            limpiarInterpolacion
        );
    }
}


// =====================
// GENERAR TABLA DATOS
// =====================

window.generarTablaDatos =
function () {

    const cantidad =

        parseInt(

            document
                .getElementById(
                    "cantidad-puntos"
                )
                .value

        );

    const container =

        document.getElementById(
            "tabla-datos-container"
        );

    if (!container) {

        return;
    }

    let html =

    `
    <div class="table-container">

        <table>

            <thead>

                <tr>

                    <th>x</th>

                    <th>f(x)</th>

                </tr>

            </thead>

            <tbody>
    `;

    for (

        let i = 0;
        i < cantidad;
        i++

    ) {

        html +=

        `
        <tr>

            <td>

                <input
                    type="number"
                    step="any"
                    class="tabla-input x-input">

            </td>

            <td>

                <input
                    type="number"
                    step="any"
                    class="tabla-input fx-input">

            </td>

        </tr>
        `;
    }

    html +=

    `
            </tbody>

        </table>

    </div>
    `;

    container.innerHTML =
        html;

    limpiarResultados();
}


// =====================
// OBTENER DATOS
// =====================

window.obtenerDatosTabla =
function () {

    const xs =

        document.querySelectorAll(
            ".x-input"
        );

    const fxs =

        document.querySelectorAll(
            ".fx-input"
        );

    const datos = [];

    for (

        let i = 0;
        i < xs.length;
        i++

    ) {

        const x =

            parseFloat(
                xs[i].value
            );

        const fx =

            parseFloat(
                fxs[i].value
            );

        if (

            isNaN(x)

            ||

            isNaN(fx)

        ) {

            continue;
        }

        datos.push({

            x,
            fx

        });
    }

    return datos;
};


// =====================
// TABLA NEWTON
// =====================

window.mostrarTablaNewton =
function (

    matriz,
    puntos

) {

    const container =

        document.getElementById(
            "tabla-newton-container"
        );

    if (!container) {

        return;
    }

    const n =
        puntos.length;

    let html =

    `
    <div class="table-container">

        <table>

            <thead>

                <tr>

                    <th>x</th>

                    <th>f(x)</th>
    `;

    for (

        let j = 1;
        j < n;
        j++

    ) {

        html +=

        `
        <th>

            f[x₀...x${j}]

        </th>
        `;
    }

    html +=

    `
                </tr>

            </thead>

            <tbody>
    `;

    for (

        let i = 0;
        i < n;
        i++

    ) {

        html += "<tr>";

        html +=

        `
        <td>

            ${puntos[i].x}

        </td>
        `;

        for (

            let j = 0;
            j < n - i;
            j++

        ) {

            let clase = "";

            if (

                i === 0

                &&

                j > 0

            ) {

                clase =
                    "columna-coeficiente";
            }

           const fraccion =
    matriz[i][j];

            html +=

            `
            <td class="${clase}">

                $$${fraccion.toLatex()}$$

            </td>
            `;
        }

        html += "</tr>";
    }

    html +=

    `
            </tbody>

        </table>

    </div>
    `;

    container.innerHTML =
        html;

    refrescarMathJax();
};


// =====================
// COEFICIENTES
// =====================

window.mostrarCoeficientes =
function (

    coeficientes

) {

    const container =

        document.getElementById(
            "coeficientes-container"
        );

    if (!container) {

        return;
    }

    let html =

    `
    <div class="coeficientes-grid">
    `;

    coeficientes.forEach(

        (

            valor,
            indice

        ) => {

            html +=

            `
            <div class="coef-card">

                <h3>

                    a${indice}

                </h3>

                <p>

                    $$${valor.toLatex()}$$

                </p>

            </div>
            `;
        }
    );

    html +=

    `
    </div>
    `;

    container.innerHTML =
        html;

    refrescarMathJax();
};


// =====================
// AGREGAR PASO
// =====================

window.agregarPaso =
function (

    titulo,
    contenido

) {

    const container =

        document.getElementById(
            "procedimiento-diferencias"
        );

    if (!container) {

        return;
    }

    container.innerHTML +=

    `
    <div class="paso-card">

        <h3>

            ${titulo}

        </h3>

        <div class="latex-box">

            ${contenido}

        </div>

    </div>
    `;

    refrescarMathJax();
};


// =====================
// CONSTRUCCIÓN
// =====================

window.mostrarConstruccion =
function (

    latex

) {

    document.getElementById(
        "construccion-container"
    ).innerHTML =

    `
    <div class="latex-box">

        $$

        ${latex}

        $$

    </div>
    `;

    refrescarMathJax();
};


// =====================
// SIMPLIFICACIÓN
// =====================

window.mostrarSimplificacion =
function (

    latex

) {

    document.getElementById(
        "simplificacion-container"
    ).innerHTML =

    `
    <div class="latex-box">

        $$

        ${latex}

        $$

    </div>
    `;

    refrescarMathJax();
};


// =====================
// POLINOMIO FINAL
// =====================

window.mostrarPolinomioFinal =
function (

    latex

) {

    document.getElementById(
        "polinomio-final-container"
    ).innerHTML =

    `
    <div class="polinomio-final">

        <h2>

            Polinomio Interpolante

        </h2>

        $$

        ${latex}

        $$

    </div>
    `;

    refrescarMathJax();
};


// =====================
// VERIFICACIÓN
// =====================

window.mostrarVerificacion =
function (

    html

) {

    document.getElementById(
        "verificacion-container"
    ).innerHTML =
        html;

    refrescarMathJax();
};


// =====================
// LIMPIAR RESULTADOS
// =====================

function limpiarResultados() {

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

    ids.forEach(

        id => {

            const el =

                document.getElementById(
                    id
                );

            if (el) {

                el.innerHTML = "";
            }
        }
    );
}


// =====================
// LIMPIAR TODO
// =====================

window.limpiarInterpolacion =
function () {

    generarTablaDatos();
};


// =====================
// MATHJAX
// =====================

window.refrescarMathJax =
function () {

    if (

        window.MathJax

        &&

        MathJax.typesetPromise

    ) {

        MathJax.typesetPromise();
    }
};