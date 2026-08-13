// =====================
// MÉTODO BISECCIÓN
// =====================

function metodoBiseccion(
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
        convertirLatexAJS(
            latex
        );

    // =====================
    // VALIDAR INTERVALO
    // =====================

    let fa =
        evaluarFuncion(
            expr,
            a
        );

    let fb =
        evaluarFuncion(
            expr,
            b
        );

    if (
        isNaN(fa) ||
        isNaN(fb)
    ) {

        resultado.innerText =
            "Error al evaluar la función";

        return;
    }

    if (fa * fb > 0) {

        resultado.innerText =
            "El intervalo no encierra raíz";

        return;
    }

    // limpiar raíz anterior

    eliminarPunto(
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

        // punto medio

        c =
            (a + b) / 2;

        fc =
            evaluarFuncion(
                expr,
                c
            );

        const producto =
            fa * fb;

        // =====================
        // ERROR
        // =====================

        const errorAbs =
            i === 1
            ? "-"
            : Math.abs(
                c - cAnterior
            );

        const errorRel =
            i === 1
            ? "-"
            : (
                Math.abs(
                    (
                        c
                        -
                        cAnterior
                    ) / c
                ) * 100
            ).toFixed(4);

        // =====================
        // TABLA
        // =====================

        tbody.innerHTML += `
        <tr>

            <td>${i}</td>

            <td>
                ${a.toFixed(6)}
            </td>

            <td>
                ${c.toFixed(6)}
            </td>

            <td>
                ${b.toFixed(6)}
            </td>

            <td>
                ${fa.toFixed(6)}
            </td>

            <td>
                ${fc.toFixed(6)}
            </td>

            <td>
                ${fb.toFixed(6)}
            </td>

            <td>
                ${producto.toFixed(6)}
            </td>

            <td>
                ${
                    errorAbs === "-"
                    ? "-"
                    : errorAbs.toFixed(6)
                }
            </td>

            <td>
                ${errorRel}
            </td>

        </tr>
        `;

        // =====================
        // CRITERIO PARO
        // =====================

        if (
            Math.abs(fc)
            <
            tolerancia
        ) {

            agregarPunto(
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
    // SI NO CONVERGE
    // =====================

    agregarPunto(
        c,
        0,
        "raiz"
    );

    resultado.innerText =
        `Raíz aproximada ≈ ${c.toFixed(6)}
        (máximo de iteraciones alcanzado)`;
}