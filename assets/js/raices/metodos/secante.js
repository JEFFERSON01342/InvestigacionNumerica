// =====================
// MÉTODO SECANTE
// =====================

window.metodoSecante = function (
    latex,
    x0,
    x1
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

    // limpiar raíz anterior
    window.eliminarPunto(
        "raiz"
    );

    const tolerancia =
        1e-6;

    const maxIter =
        50;

    let xi_1 = x0;
    let xi = x1;

    // =====================
    // ITERACIONES
    // =====================

    for (
        let i = 1;
        i <= maxIter;
        i++
    ) {

        const fxi_1 =
            window.evaluarFuncion(
                expr,
                xi_1
            );

        const fxi =
            window.evaluarFuncion(
                expr,
                xi
            );

        // =====================
        // VALIDAR
        // =====================

        if (
            !isFinite(fxi_1)
            ||
            !isFinite(fxi)
        ) {

            resultado.innerText =
                "Error evaluando la función";

            return;
        }

        // =====================
        // EVITAR DIVISIÓN CERO
        // =====================

        const denominador =
            fxi - fxi_1;

        if (
            !isFinite(
                denominador
            )
            ||
            Math.abs(
                denominador
            ) < 1e-12
        ) {

            resultado.innerText =
                "División cercana a cero";

            return;
        }

        // =====================
        // FÓRMULA SECANTE
        // =====================

        const xiSiguiente =
            xi -
            (
                fxi *
                (
                    xi - xi_1
                )
            )
            /
            denominador;

        // =====================
        // ERROR RELATIVO
        // =====================

        const errorRel =
            i === 1
            ? "-"
            : (
                Math.abs(
                    (
                        xiSiguiente
                        -
                        xi
                    )
                    /
                    xiSiguiente
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
                ${xi_1.toFixed(6)}
            </td>

            <td>
                ${xi.toFixed(6)}
            </td>

            <td>
                ${fxi_1.toFixed(6)}
            </td>

            <td>
                ${fxi.toFixed(6)}
            </td>

            <td>
                ${xiSiguiente.toFixed(6)}
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
            xi,
            fxi,
            `iteracion-${i}`
        );

        // =====================
        // CRITERIO PARO
        // =====================

        if (
            Math.abs(fxi)
            <
            tolerancia
        ) {

            window.agregarPunto(
                xi,
                0,
                "raiz"
            );

            resultado.innerText =
                `Raíz ≈ ${xi.toFixed(6)}`;

            return;
        }

        // =====================
        // VALIDAR DIVERGENCIA
        // =====================

        if (
            !isFinite(
                xiSiguiente
            )
            ||
            isNaN(
                xiSiguiente
            )
            ||
            Math.abs(
                xiSiguiente
            ) > 1e10
        ) {

            resultado.innerText =
                "Divergencia numérica";

            return;
        }

        // avanzar iteración
        xi_1 = xi;
        xi = xiSiguiente;
    }

    // =====================
    // NO CONVERGIÓ
    // =====================

    window.agregarPunto(
        xi,
        0,
        "raiz"
    );

    resultado.innerText =
        `Raíz aproximada ≈ ${xi.toFixed(6)}
(máximo de iteraciones alcanzado)`;
};