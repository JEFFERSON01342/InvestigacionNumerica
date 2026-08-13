// =====================
// MÉTODO REGLA FALSA
// =====================

window.metodoReglaFalsa = function (
    latex,
    a,
    b
) {

    const tbody =
        document.querySelector(
            "#tabla-iteraciones tbody"
        );

    const resultado =
        document.getElementById(
            "resultado-text"
        );

    tbody.innerHTML = "";

    resultado.innerText =
        "Calculando...";

    // =====================
    // CONVERTIR FUNCIÓN
    // =====================

    const expr =
        window.convertirLatexAJS(
            latex
        );

    // =====================
    // VALIDAR INTERVALO
    // =====================

    let fa =
        window.evaluarFuncion(
            expr,
            a
        );

    let fb =
        window.evaluarFuncion(
            expr,
            b
        );

    if (
        isNaN(fa)
        ||
        isNaN(fb)
    ) {

        resultado.innerText =
            "Error al evaluar la función";

        return;
    }

    if (
        fa * fb > 0
    ) {

        resultado.innerText =
            "El intervalo no encierra raíz";

        return;
    }

    // limpiar raíz anterior
    window.eliminarPunto(
        "raiz"
    );

    // =====================
    // ITERACIONES
    // =====================

    let c = null;
    let fc = null;

    const tolerancia =
        1e-6;

    const maxIter =
        50;

    for (
        let i = 1;
        i <= maxIter;
        i++
    ) {

        const cAnterior =
            c;

        // =====================
        // FÓRMULA REGLA FALSA
        // =====================

        c =
            b -
            (
                fb *
                (
                    a - b
                )
            )
            /
            (
                fa - fb
            );

        fc =
            window.evaluarFuncion(
                expr,
                c
            );

        // validar
        if (
            !isFinite(fc)
            ||
            isNaN(fc)
        ) {

            resultado.innerText =
                "Error numérico";

            return;
        }

        const producto =
            fa * fb;

        // =====================
        // ERROR RELATIVO
        // =====================

        const errorRel =
            i === 1
            ? "-"
            : (
                Math.abs(
                    (
                        c -
                        cAnterior
                    )
                    / c
                )
                * 100
            ).toFixed(6);

        // =====================
        // TABLA
        // =====================

        tbody.innerHTML += `
        <tr>

            <td>
                ${i}
            </td>

            <td>
                ${a.toFixed(6)}
            </td>

            <td>
                ${b.toFixed(6)}
            </td>

            <td>
                ${fa.toFixed(6)}
            </td>

            <td>
                ${fb.toFixed(6)}
            </td>

            <td>
                ${producto.toFixed(6)}
            </td>

            <td>
                ${c.toFixed(6)}
            </td>

            <td>
                ${fc.toFixed(6)}
            </td>

            <td>
                ${errorRel}
            </td>

        </tr>
        `;

        // =====================
        // GRAFICAR ITERACIÓN
        // =====================

        window.agregarPunto(
            c,
            fc,
            `iteracion-${i}`
        );

        // =====================
        // CRITERIO PARO
        // =====================

        if (
            Math.abs(fc)
            <
            tolerancia
        ) {

            window.agregarPunto(
                c,
                0,
                "raiz"
            );

            resultado.innerText =
                `Raíz ≈ ${c.toFixed(6)}`;

            return;
        }

        // =====================
        // CAMBIO INTERVALO
        // =====================

        if (
            fa * fc < 0
        ) {

            b = c;
            fb = fc;

        } else {

            a = c;
            fa = fc;
        }
    }

    // =====================
    // NO CONVERGIÓ
    // =====================

    window.agregarPunto(
        c,
        0,
        "raiz"
    );

    resultado.innerText =
        `Raíz aproximada ≈ ${c.toFixed(6)}
(máximo de iteraciones alcanzado)`;
};