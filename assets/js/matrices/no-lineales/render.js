// =====================
// RENDER.JS
// SISTEMAS NO LINEALES
// =====================


// =====================
// INIT
// =====================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        renderSistema();

        renderValoresIniciales();

        crearTablaIteraciones();

        // =====================
        // EVENTO SELECT
        // =====================

        const select =
            document.getElementById(
                "cantidad-variables"
            );

        if (select) {

            select.addEventListener(

                "change",

                () => {

                    renderSistema();

                    renderValoresIniciales();

                    crearTablaIteraciones();
                }
            );
        }

        // =====================
        // BOTÓN LIMPIAR
        // =====================

        const btnLimpiar =
            document.getElementById(
                "btn-limpiar"
            );

        if (btnLimpiar) {

            btnLimpiar.addEventListener(

                "click",

                limpiarSistema
            );
        }
    }
);


// =====================
// RENDER SISTEMA
// =====================

window.renderSistema =
function () {

    try {

        const cantidad =
            parseInt(

                document
                    .getElementById(
                        "cantidad-variables"
                    )
                    .value

            );

        const container =
            document.getElementById(
                "sistema-container"
            );

        if (!container) {

            console.error(
                "No existe sistema-container"
            );

            return;
        }

        // =====================
        // LIMPIAR
        // =====================

        container.innerHTML =
            "";

        // =====================
        // WRAPPER
        // =====================

        const wrapper =
            document.createElement(
                "div"
            );

        wrapper.className =
            "sistema-wrapper";

        // =====================
        // LLAVE
        // =====================

        const llave =
            document.createElement(
                "div"
            );

        llave.className =
            "llave-sistema";

        llave.innerHTML = `
            <div>{</div>
        `;

        // =====================
        // ECUACIONES
        // =====================

        const ecuaciones =
            document.createElement(
                "div"
            );

        ecuaciones.className =
            "ecuaciones-container";

        // =====================
        // CREAR FILAS
        // =====================

        for (

            let i = 0;
            i < cantidad;
            i++

        ) {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "ecuacion-row";

            // =====================
            // LABEL
            // =====================

            const label =
                document.createElement(
                    "div"
                );

            label.className =
                "ecuacion-label";

            label.textContent =
                `f${i + 1}(X) =`;

            // =====================
            // MATHFIELD
            // =====================

            const mathField =
                document.createElement(
                    "math-field"
                );

            mathField.className =
                "ecuacion-field";

            configurarMathField(
                mathField
            );

            // =====================
            // EJEMPLOS
            // =====================

            if (cantidad === 2) {

                if (i === 0) {

                    mathField.value =
                        "x^2+y^2-4";
                }

                if (i === 1) {

                    mathField.value =
                        "x-y-1";
                }
            }

            if (cantidad === 3) {

                if (i === 0) {

                    mathField.value =
                        "x+y+z-3";
                }

                if (i === 1) {

                    mathField.value =
                        "x^2+y^2+z^2-5";
                }

                if (i === 2) {

                    mathField.value =
                        "x-y+z-1";
                }
            }

            // =====================
            // APPEND
            // =====================

            row.appendChild(
                label
            );

            row.appendChild(
                mathField
            );

            ecuaciones.appendChild(
                row
            );
        }

        // =====================
        // APPEND FINAL
        // =====================

        wrapper.appendChild(
            llave
        );

        wrapper.appendChild(
            ecuaciones
        );

        container.appendChild(
            wrapper
        );

    } catch (error) {

        console.error(
            "ERROR RENDER:",
            error
        );
    }
};


// =====================
// CONFIG MATHFIELD
// =====================

function configurarMathField(
    mathField
) {

    try {

        mathField.setOptions({

            virtualKeyboardMode:
                "onfocus",

            virtualKeyboards:
                "all",

            smartMode:
                true,

            smartFence:
                true,

            inlineShortcuts: {

                pi: "\\pi",

                sqrt: "\\sqrt{#0}",

                sin: "\\sin",

                cos: "\\cos",

                tan: "\\tan",

                ln: "\\ln",

                log: "\\log"
            }
        });

        mathField.setAttribute(

            "placeholder",

            "Ejemplo: x^2+y^2-4"
        );

    } catch (error) {

        console.error(
            "ERROR MATHFIELD:",
            error
        );
    }
}


// =====================
// VALORES INICIALES
// =====================

window.renderValoresIniciales =
function () {

    try {

        const cantidad =
            parseInt(

                document
                    .getElementById(
                        "cantidad-variables"
                    )
                    .value

            );

        const container =
            document.getElementById(
                "valores-iniciales"
            );

        if (!container) {

            return;
        }

        // =====================
        // LIMPIAR
        // =====================

        container.innerHTML =
            "";

        const variables =
            ["x", "y", "z", "w", "u"];

        // =====================
        // CREAR INPUTS
        // =====================

        for (

            let i = 0;
            i < cantidad;
            i++

        ) {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "variable-item";

            // =====================
            // LABEL
            // =====================

            const label =
                document.createElement(
                    "label"
                );

            label.textContent =
                `${variables[i]}₀ =`;

            // =====================
            // INPUT
            // =====================

            const input =
                document.createElement(
                    "input"
                );

            input.type =
                "number";

            input.step =
                "any";

            input.value =
                "1";

            input.id =
                `valor-inicial-${i}`;

            // =====================
            // APPEND
            // =====================

            item.appendChild(
                label
            );

            item.appendChild(
                input
            );

            container.appendChild(
                item
            );
        }

    } catch (error) {

        console.error(
            "ERROR VALORES:",
            error
        );
    }
};


// =====================
// TABLA ITERACIONES
// =====================

window.crearTablaIteraciones =
function () {

    try {

        const cantidad =
            parseInt(

                document
                    .getElementById(
                        "cantidad-variables"
                    )
                    .value

            );

        const thead =
            document.querySelector(
                "#tabla-sistema thead"
            );

        if (!thead) {

            return;
        }

        let html =
            "<tr>";

        html +=
            "<th>Iter</th>";

        // =====================
        // VARIABLES
        // =====================

        const variables =
            ["x", "y", "z", "w", "u"];

        for (

            let i = 0;
            i < cantidad;
            i++

        ) {

            html +=
                `<th>${variables[i]}</th>`;
        }

        // =====================
        // DELTAS
        // =====================

        for (

            let i = 0;
            i < cantidad;
            i++

        ) {

            html +=
                `<th>Δ${variables[i]}</th>`;
        }

        // =====================
        // ERROR
        // =====================

        html +=
            "<th>Error</th>";

        html +=
            "</tr>";

        thead.innerHTML =
            html;

    } catch (error) {

        console.error(
            "ERROR TABLA:",
            error
        );
    }
};


// =====================
// LIMPIAR
// =====================

window.limpiarSistema =
function () {

    try {

        // =====================
        // MATHFIELDS
        // =====================

        const fields =
            document.querySelectorAll(
                ".ecuacion-field"
            );

        fields.forEach(

            field => {

                field.value =
                    "";
            }
        );

        // =====================
        // INPUTS
        // =====================

        const inputs =
            document.querySelectorAll(
                "#valores-iniciales input"
            );

        inputs.forEach(

            input => {

                input.value =
                    "1";
            }
        );

        // =====================
        // RESULTADOS
        // =====================

        document.getElementById(
            "resultado-sistema"
        ).innerHTML =
            "";

        document.getElementById(
            "jacobiano-container"
        ).innerHTML =
            "";

        document.getElementById(
            "procedimiento-container"
        ).innerHTML =
            "";

        const tbody =
            document.querySelector(
                "#tabla-sistema tbody"
            );

        if (tbody) {

            tbody.innerHTML =
                "";
        }

    } catch (error) {

        console.error(
            "ERROR LIMPIAR:",
            error
        );
    }
};


// =====================
// MATHJAX
// =====================

window.refrescarMathJax =
function () {

    try {

        if (

            window.MathJax

            &&

            MathJax.typesetPromise

        ) {

            MathJax.typesetPromise();
        }

    } catch (error) {

        console.error(
            error
        );
    }
};