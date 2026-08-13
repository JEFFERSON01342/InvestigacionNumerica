// =====================
// MÉTODO PUNTO FIJO
// =====================

window.metodoPuntoFijo = function (
    latex,
    x0
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
    // CONVERTIR g(x)
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

    let xi = x0;

    // =====================
    // VALIDAR CONVERGENCIA
    // |g'(x0)| < 1
    // =====================

    const derivadaEnX0 =
        window.derivadaNumerica(
            expr,
            x0
        );

    const derivadaAbsX0 =
        Math.abs(derivadaEnX0);

    const criterioConvergencia =
        derivadaAbsX0 < 1;

    // =====================
    // ITERACIONES
    // =====================

    for (
        let i = 1;
        i <= maxIter;
        i++
    ) {

        const gx =
            window.evaluarFuncion(
                expr,
                xi
            );

        // =====================
        // VALIDAR RESULTADO
        // =====================

        if (
            !isFinite(gx)
            ||
            isNaN(gx)
        ) {

            resultado.innerText =
                "❌ Divergencia numérica";

            return;
        }

        // =====================
        // ERROR RELATIVO
        // =====================

        const errorRel =
            i === 1
            ? "-"
            : (
                Math.abs(
                    (
                        gx - xi
                    )
                    /
                    gx
                )
                * 100
            ).toFixed(6);

        // =====================
        // DERIVADA EN PUNTO ACTUAL
        // =====================

        const derivadaEnXi =
            window.derivadaNumerica(
                expr,
                xi
            );

        // =====================
        // TABLA
        // =====================

        tbody.innerHTML += `
        <tr>

            <td>
                ${i}
            </td>

            <td>
                ${xi.toFixed(6)}
            </td>

            <td>
                ${gx.toFixed(6)}
            </td>

            <td>
                ${errorRel}
            </td>

            <td>
                ${
                    Math.abs(derivadaEnXi) < 1
                    ? "✓ Converge"
                    : "✗ Puede divergir"
                }
            </td>

        </tr>
        `;

        // =====================
        // GRAFICAR ITERACIÓN
        // =====================

        window.agregarPunto(
            xi,
            gx,
            `iteracion-${i}`
        );

        // =====================
        // CRITERIO PARO
        // =====================

        if (
            Math.abs(
                gx - xi
            )
            <
            tolerancia
        ) {

            window.agregarPunto(
                gx,
                0,
                "raiz"
            );

            const derivadaEnRaiz =
                Math.abs(
                    window.derivadaNumerica(
                        expr,
                        gx
                    )
                );

            resultado.innerText =
                `
Raíz aproximada: x* ≈ ${gx.toFixed(6)}

Validación en x*:
|g'(x*)| = ${derivadaEnRaiz.toFixed(6)}

${
    derivadaEnRaiz < 1
    ? "✓ Converge en esta región"
    : "⚠ No garantiza convergencia"
}

Iteraciones: ${i}
Error: ${Math.abs(gx - xi).toExponential(4)}
                `;

            return;
        }

        // =====================
        // EXPLOSIÓN NUMÉRICA
        // =====================

        if (
            Math.abs(gx)
            > 1e10
        ) {

            resultado.innerText =
                `
❌ Explosión numérica

g(${xi.toFixed(6)}) = ${gx}

|g'(xi)| = ${Math.abs(derivadaEnXi).toFixed(6)} > 1

La derivada es muy grande. Intenta otro g(x).
                `;

            return;
        }

        // avanzar
        xi = gx;
    }

    // =====================
    // NO CONVERGIÓ
    // =====================

    resultado.innerText =
        `
⚠ No convergió en ${maxIter} iteraciones

Última iteración:
x${maxIter} ≈ ${xi.toFixed(6)}

Verifica que |g'(x)| < 1 en la región de búsqueda.
        `;
};