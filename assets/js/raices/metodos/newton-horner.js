// =====================
// MÉTODO HORNER-NEWTON
// =====================

function obtenerCoeficientesHornerNewton(
    latex
) {

    const resultado =
        document.getElementById(
            "resultado-text"
        );

    try {

        const expr =
            convertirLatexAJS(
                latex
            );

        const gradoInicial =
            Math.max(
                1,
                obtenerGradoPolinomio(
                    expr
                )
            );

        const gradoMaximo =
            Math.max(
                gradoInicial,
                10
            );

        for (
            let grado = gradoInicial;
            grado <= gradoMaximo;
            grado++
        ) {

            const coeficientes =
                resolverCoeficientesPorInterpolacion(
                    expr,
                    grado
                );

            if (
                validarCoeficientesPolinomio(
                    expr,
                    coeficientes
                )
            ) {

                const coeficientesLimpios =
                    limpiarCoeficientesAltos(
                        coeficientes
                    );

                if (
                    coeficientesLimpios.length > 1
                ) {

                    return coeficientesLimpios;
                }
            }
        }

        alert(
            "Horner-Newton requiere un polinomio válido"
        );

        resultado.innerText =
            "Horner-Newton solo acepta polinomios en x.";

        return null;

    } catch (error) {

        console.error(
            "ERROR COEFICIENTES HORNER-NEWTON:",
            error
        );

        alert(
            "No se pudieron obtener los coeficientes del polinomio"
        );

        resultado.innerText =
            "Revisa que p(x) sea un polinomio válido.";

        return null;
    }
}


window.metodoNewtonHorner = function (
    coeficientes,
    x0
) {

    const thead =
        document.querySelector(
            "#tabla-iteraciones thead"
        );

    const tbody =
        document.querySelector(
            "#tabla-iteraciones tbody"
        );

    const resultado =
        document.getElementById(
            "resultado-text"
        );

    thead.innerHTML = "";
    tbody.innerHTML = "";

    resultado.innerText =
        "Calculando...";

    window.eliminarPunto(
        "raiz"
    );

    const grado =
        coeficientes.length - 1;

    if (
        grado < 1
    ) {

        resultado.innerText =
            "Horner-Newton requiere un polinomio de grado 1 o mayor.";

        return;
    }

    crearTablaNewtonHorner(
        coeficientes
    );

    const tolerancia =
        1e-6;

    const maxIter =
        50;

    let xi =
        x0;

    for (
        let iter = 1;
        iter <= maxIter;
        iter++
    ) {

        const valores =
            calcularFilasHornerNewton(
                coeficientes,
                xi
            );

        const b =
            valores.b;

        const c =
            valores.c;

        const b0 =
            b[0];

        const c1 =
            c[1];

        if (
            !Number.isFinite(
                b0
            )
            ||
            !Number.isFinite(
                c1
            )
        ) {

            resultado.innerText =
                "Error numérico en Horner-Newton.";

            return;
        }

        if (
            Math.abs(
                c1
            )
            < 1e-12
        ) {

            resultado.innerText =
                "La derivada calculada por Horner es cercana a cero.";

            return;
        }

        const xiSiguiente =
            xi - b0 / c1;

        if (
            !Number.isFinite(
                xiSiguiente
            )
        ) {

            resultado.innerText =
                "Divergencia numérica en Horner-Newton.";

            return;
        }

        const errorRel =
            iter === 1
                ? null
                : calcularErrorHornerNewton(
                    xiSiguiente,
                    xi
                );

        const debeFinalizar =
            Math.abs(
                b0
            )
            < tolerancia
            ||
            (
                errorRel !== null
                &&
                errorRel < tolerancia
            );

        const decision =
            debeFinalizar
                ? "FINALIZAR"
                : "CONTINUAR";

        agregarFilaNewtonHorner(
            tbody,
            b,
            c,
            xiSiguiente,
            errorRel,
            decision
        );

        window.agregarPunto(
            xiSiguiente,
            evaluarPolinomioCoeficientes(
                coeficientes,
                xiSiguiente
            ),
            `horner-newton-${iter}`
        );

        if (
            debeFinalizar
        ) {

            const valorRaiz =
                evaluarPolinomioCoeficientes(
                    coeficientes,
                    xiSiguiente
                );

            window.agregarPunto(
                xiSiguiente,
                0,
                "raiz"
            );

            resultado.innerText =
                `✓ Convergió en ${iter} iteraciones

Raíz aproximada:
x = ${formatearHornerNewton(xiSiguiente)}

p(x) = ${formatearHornerNewton(valorRaiz)}

Error relativo:
${errorRel === null ? "-" : errorRel.toExponential(4) + "%"}

Fórmula:
xᵢ = xᵢ₋₁ - b₀ / c₁`;

            return;
        }

        xi =
            xiSiguiente;
    }

    resultado.innerText =
        `No convergió en ${maxIter} iteraciones

Última aproximación:
x = ${formatearHornerNewton(xi)}

p(x) = ${formatearHornerNewton(
            evaluarPolinomioCoeficientes(
                coeficientes,
                xi
            )
        )}`;
};


function crearTablaNewtonHorner(
    coeficientes
) {

    const thead =
        document.querySelector(
            "#tabla-iteraciones thead"
        );

    const tabla =
        document.getElementById(
            "tabla-iteraciones"
        );

    const grado =
        coeficientes.length - 1;

    const columnas = [];

    for (
        let i = grado;
        i >= 0;
        i--
    ) {

        columnas.push(
            `b${formatearSubindiceHornerNewton(i)}`
        );
    }

    for (
        let i = grado;
        i >= 1;
        i--
    ) {

        columnas.push(
            `c${formatearSubindiceHornerNewton(i)}`
        );
    }

    columnas.push(
        "xᵢ",
        "Er%",
        "Decisión"
    );

    const coeficientesTexto =
        [];

    for (
        let i = grado;
        i >= 0;
        i--
    ) {

        coeficientesTexto.push(
            `a${formatearSubindiceHornerNewton(i)} = ${formatearHornerNewton(coeficientes[i])}`
        );
    }

    tabla.classList.add(
        "tabla-horner-newton"
    );

    thead.innerHTML = `
        <tr class="hn-coeficientes">
            <th colspan="${columnas.length}">
                ${coeficientesTexto.join(" &nbsp;&nbsp; ")}
            </th>
        </tr>
        <tr>
            ${columnas.map(
                columna => `<th>${columna}</th>`
            ).join("")}
        </tr>
    `;
}


function calcularFilasHornerNewton(
    coeficientes,
    x
) {

    const grado =
        coeficientes.length - 1;

    const b =
        new Array(
            grado + 1
        );

    const c =
        new Array(
            grado + 1
        );

    b[grado] =
        coeficientes[grado];

    for (
        let k = grado - 1;
        k >= 0;
        k--
    ) {

        b[k] =
            coeficientes[k] +
            x * b[k + 1];
    }

    c[grado] =
        b[grado];

    for (
        let k = grado - 1;
        k >= 1;
        k--
    ) {

        c[k] =
            b[k] +
            x * c[k + 1];
    }

    return {

        b,
        c
    };
}


function agregarFilaNewtonHorner(
    tbody,
    b,
    c,
    xi,
    errorRel,
    decision
) {

    const grado =
        b.length - 1;

    const celdas = [];

    for (
        let i = grado;
        i >= 0;
        i--
    ) {

        celdas.push(
            formatearHornerNewton(
                b[i]
            )
        );
    }

    for (
        let i = grado;
        i >= 1;
        i--
    ) {

        celdas.push(
            formatearHornerNewton(
                c[i]
            )
        );
    }

    celdas.push(
        formatearHornerNewton(
            xi
        ),
        errorRel === null
            ? "-"
            : `${formatearHornerNewton(errorRel)}%`,
        decision
    );

    tbody.innerHTML += `
        <tr>
            ${celdas.map(
                celda => `<td>${celda}</td>`
            ).join("")}
        </tr>
    `;
}


function calcularErrorHornerNewton(
    actual,
    anterior
) {

    return Math.abs(
        actual
    ) > 1e-15
        ? Math.abs(
            (actual - anterior) / actual
        ) * 100
        : Math.abs(
            actual - anterior
        ) * 100;
}


function formatearHornerNewton(
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


function formatearSubindiceHornerNewton(
    numero
) {

    const subindices = {
        "0": "₀",
        "1": "₁",
        "2": "₂",
        "3": "₃",
        "4": "₄",
        "5": "₅",
        "6": "₆",
        "7": "₇",
        "8": "₈",
        "9": "₉"
    };

    return String(
        numero
    )
        .split("")
        .map(
            digito => subindices[digito]
        )
        .join("");
}
