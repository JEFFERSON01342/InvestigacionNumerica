// =====================
// MÉTODO MÜLLER
// =====================

window.metodoMuller = function (
    latex,
    x0,
    x1,
    x2
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

    const expr =
        window.convertirLatexAJS(
            latex
        );

    window.eliminarPunto(
        "raiz"
    );

    const tolerancia =
        1e-6;

    const maxIter =
        50;

    let xi = x0;
    let xi1 = x1;
    let xi2 = x2;

    for (
        let i = 0;
        i < maxIter;
        i++
    ) {

        const fxi =
            window.evaluarFuncion(
                expr,
                xi
            );

        const fxi1 =
            window.evaluarFuncion(
                expr,
                xi1
            );

        const fxi2 =
            window.evaluarFuncion(
                expr,
                xi2
            );

        if (
            !sonFinitosMuller(
                fxi,
                fxi1,
                fxi2
            )
        ) {

            resultado.innerText =
                "Error evaluando la función.";

            return;
        }

        const hi =
            xi1 - xi;

        const hi1 =
            xi2 - xi1;

        if (
            Math.abs(hi) < 1e-12
            ||
            Math.abs(hi1) < 1e-12
        ) {

            resultado.innerText =
                "Los valores iniciales no deben repetirse.";

            return;
        }

        const deltaI =
            (fxi1 - fxi) / hi;

        const deltaI1 =
            (fxi2 - fxi1) / hi1;

        const a =
            (deltaI1 - deltaI) /
            (hi1 + hi);

        const b =
            a * hi1 + deltaI1;

        const c =
            fxi2;

        const discriminante =
            b * b - 4 * a * c;

        if (
            discriminante < 0
        ) {

            resultado.innerText =
                `Müller encontró discriminante negativo en la iteración ${i}.

Esta implementación trabaja con raíces reales. Prueba otros valores iniciales si buscas una raíz real.`;

            return;
        }

        const raizDiscriminante =
            Math.sqrt(
                discriminante
            );

        const denominadorMenos =
            b - raizDiscriminante;

        const denominadorMas =
            b + raizDiscriminante;

        const absMenos =
            Math.abs(
                denominadorMenos
            );

        const absMas =
            Math.abs(
                denominadorMas
            );

        const denominador =
            absMas > absMenos
                ? denominadorMas
                : denominadorMenos;

        if (
            Math.abs(
                denominador
            )
            < 1e-12
        ) {

            resultado.innerText =
                "División cercana a cero en Müller.";

            return;
        }

        const correccionMenos =
            Math.abs(
                denominadorMenos
            )
            > 1e-12
                ? (2 * c) / denominadorMenos
                : NaN;

        const correccionMas =
            Math.abs(
                denominadorMas
            )
            > 1e-12
                ? (2 * c) / denominadorMas
                : NaN;

        const correccion =
            (2 * c) /
            denominador;

        const xi3 =
            xi2 - correccion;

        if (
            !sonFinitosMuller(
                a,
                b,
                c,
                xi3,
                correccion
            )
        ) {

            resultado.innerText =
                "Divergencia numérica en Müller.";

            return;
        }

        const fxi3 =
            window.evaluarFuncion(
                expr,
                xi3
            );

        if (
            !sonFinitosMuller(
                fxi3
            )
        ) {

            resultado.innerText =
                "Error evaluando la nueva aproximación.";

            return;
        }

        const errorRel =
            Math.abs(xi3) > 1e-15
                ? Math.abs(
                    (xi3 - xi2) / xi3
                ) * 100
                : Math.abs(
                    xi3 - xi2
                ) * 100;

        const debeFinalizar =
            Math.abs(
                fxi3
            )
            < tolerancia
            ||
            errorRel < tolerancia;

        const decision =
            debeFinalizar
                ? "FINALIZAR"
                : "CONTINUAR";

        tbody.innerHTML += `
        <tr>

            <td>${i}</td>
            <td>${formatearMuller(xi)}</td>
            <td>${formatearMuller(xi1)}</td>
            <td>${formatearMuller(xi2)}</td>
            <td>${formatearMuller(fxi)}</td>
            <td>${formatearMuller(fxi1)}</td>
            <td>${formatearMuller(fxi2)}</td>
            <td>${formatearMuller(hi)}</td>
            <td>${formatearMuller(hi1)}</td>
            <td>${formatearMuller(deltaI)}</td>
            <td>${formatearMuller(deltaI1)}</td>
            <td>${formatearMuller(a)}</td>
            <td>${formatearMuller(b)}</td>
            <td>${formatearMuller(c)}</td>
            <td>${formatearMuller(denominadorMenos)}</td>
            <td>${formatearMuller(denominadorMas)}</td>
            <td>${formatearMuller(absMenos)}</td>
            <td>${formatearMuller(absMas)}</td>
            <td>${formatearMuller(denominador)}</td>
            <td>${formatearMuller(correccionMenos)}</td>
            <td>${formatearMuller(correccionMas)}</td>
            <td>${formatearMuller(correccion)}</td>
            <td>${formatearMuller(xi3)}</td>
            <td>${formatearMuller(errorRel)}</td>
            <td>${decision}</td>

        </tr>
        `;

        window.agregarPunto(
            xi3,
            fxi3,
            `iteracion-${i}`
        );

        if (
            debeFinalizar
        ) {

            window.agregarPunto(
                xi3,
                0,
                "raiz"
            );

            resultado.innerText =
                `✓ Convergió en ${i + 1} iteraciones

Raíz aproximada:
x = ${formatearMuller(xi3)}

f(x) = ${formatearMuller(fxi3)}

Error relativo:
${errorRel.toExponential(4)}%`;

            return;
        }

        xi = xi1;
        xi1 = xi2;
        xi2 = xi3;
    }

    window.agregarPunto(
        xi2,
        0,
        "raiz"
    );

    resultado.innerText =
        `No convergió en ${maxIter} iteraciones

Última aproximación:
x = ${formatearMuller(xi2)}

f(x) = ${formatearMuller(window.evaluarFuncion(expr, xi2))}`;
};


function sonFinitosMuller(
    ...valores
) {

    return valores.every(
        valor =>
            Number.isFinite(
                valor
            )
    );
}


function formatearMuller(
    valor
) {

    if (
        Math.abs(
            valor
        )
        < 1e-10
    ) {

        return "0.000000";
    }

    return Number(
        valor
    ).toFixed(
        6
    );
}
